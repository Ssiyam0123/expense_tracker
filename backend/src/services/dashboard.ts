import mongoose from "mongoose";
import { connectDB } from "../utils/db";
import { Transaction } from "../models/Transaction";
import { Budget } from "../models/Budget";

export async function getDashboardSummary(
  userId: string,
  month: number,
  year: number
) {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Total income and expense for month
  const aggResult = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        deletedAt: null,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amountMinor" },
      },
    },
  ]);

  const incomeRow = aggResult.find((r: { _id: string }) => r._id === "income");
  const expenseRow = aggResult.find((r: { _id: string }) => r._id === "expense");
  const totalIncome = incomeRow?.total || 0;
  const totalExpense = expenseRow?.total || 0;

  // Category breakdown for expenses
  const categoryBreakdown = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        deletedAt: null,
        type: "expense",
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amountMinor" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        categoryId: "$_id",
        categoryName: { $ifNull: ["$category.name", "Unknown"] },
        categoryIcon: "$category.icon",
        categoryColor: "$category.color",
        total: 1,
        count: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Budgets for this month
  const budgets = await Budget.find({
    userId: userObjectId,
    month,
    year,
  })
    .populate("categoryId", "name icon color")
    .lean();

  // Calculate budget vs actual
  const budgetStatus = await Promise.all(
    budgets.map(async (budget) => {
      const catId =
        budget.categoryId && (budget.categoryId as any)._id
          ? (budget.categoryId as any)._id
          : budget.categoryId;

      const spent = await Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            categoryId: catId,
            type: "expense",
            deletedAt: null,
            timestamp: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amountMinor" },
          },
        },
      ]);

      const spentAmount = spent[0]?.total || 0;
      const percentage =
        budget.amountMinor > 0
          ? Math.round((spentAmount / budget.amountMinor) * 100)
          : 0;

      return {
        budgetId: budget._id,
        categoryId: budget.categoryId,
        categoryName:
          (budget.categoryId as unknown as { name: string })?.name || "Unknown",
        budgetAmount: budget.amountMinor,
        spentAmount,
        remainingAmount: budget.amountMinor - spentAmount,
        percentage,
        alertThreshold: budget.alertThreshold,
        isOverBudget: spentAmount > budget.amountMinor,
        isNearThreshold: budget.alertThreshold
          ? percentage >= budget.alertThreshold
          : false,
      };
    })
  );

  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryBreakdown,
    budgetStatus,
  };
}
