import mongoose from "mongoose";
import { connectDB } from "../utils/db";
import { Budget } from "../models/Budget";

export interface CreateBudgetInput {
  categoryId: string;
  amountMinor: number;
  currency?: string;
  period?: "monthly" | "weekly" | "yearly";
  month: number;
  year: number;
  alertThreshold?: number;
}

export interface UpdateBudgetInput {
  amountMinor?: number;
  alertThreshold?: number;
}

export async function getBudgets(userId: string, month?: number, year?: number) {
  await connectDB();
  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };
  if (month) filter.month = month;
  if (year) filter.year = year;

  return Budget.find(filter)
    .populate("categoryId", "name icon color")
    .sort({ year: -1, month: -1 })
    .lean();
}

export async function createBudget(userId: string, data: CreateBudgetInput) {
  await connectDB();
  const existing = await Budget.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    categoryId: new mongoose.Types.ObjectId(data.categoryId),
    month: data.month,
    year: data.year,
  });
  if (existing) {
    throw new Error("Budget for this category and month already exists");
  }
  const { categoryId, ...rest } = data;
  return Budget.create({
    userId: new mongoose.Types.ObjectId(userId),
    categoryId: new mongoose.Types.ObjectId(categoryId),
    ...rest,
  });
}

export async function updateBudget(
  userId: string,
  budgetId: string,
  data: UpdateBudgetInput
) {
  await connectDB();
  const budget = await Budget.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(budgetId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: data },
    { new: true }
  ).lean();

  if (!budget) {
    throw new Error("Budget not found");
  }
  return budget;
}

export async function deleteBudget(userId: string, budgetId: string) {
  await connectDB();
  const result = await Budget.deleteOne({
    _id: new mongoose.Types.ObjectId(budgetId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (result.deletedCount === 0) {
    throw new Error("Budget not found");
  }
}
