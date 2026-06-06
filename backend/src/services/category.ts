import mongoose from "mongoose";
import { connectDB } from "../utils/db";
import { Category } from "../models/Category";

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
  type?: "income" | "expense";
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  type?: "income" | "expense";
}

const DEFAULT_CATEGORIES = [
  { name: "Salary", icon: "💼", color: "#10B981", type: "income" },
  { name: "Investments", icon: "📈", color: "#3B82F6", type: "income" },
  { name: "Gifts / Others", icon: "🎁", color: "#EC4899", type: "income" },
  { name: "Food / Dining", icon: "🍔", color: "#F59E0B", type: "expense" },
  { name: "Rent / Housing", icon: "🏠", color: "#EF4444", type: "expense" },
  { name: "Transportation", icon: "🚗", color: "#8B5CF6", type: "expense" },
  { name: "Entertainment", icon: "🎬", color: "#EC4899", type: "expense" },
  { name: "Shopping", icon: "🛒", color: "#06B6D4", type: "expense" },
  { name: "Utilities", icon: "⚡", color: "#EAB308", type: "expense" },
];

export async function getCategories(userId: string) {
  await connectDB();
  const uId = new mongoose.Types.ObjectId(userId);
  let categories = await Category.find({ userId: uId })
    .sort({ name: 1 })
    .lean();

  if (categories.length === 0) {
    const toInsert = DEFAULT_CATEGORIES.map((cat) => ({
      userId: uId,
      ...cat,
    }));
    await Category.insertMany(toInsert);
    categories = await Category.find({ userId: uId })
      .sort({ name: 1 })
      .lean();
  }

  return categories;
}

export async function createCategory(userId: string, data: CreateCategoryInput) {
  await connectDB();
  const existing = await Category.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    name: data.name,
  });
  if (existing) {
    throw new Error("Category with this name already exists");
  }
  return Category.create({
    userId: new mongoose.Types.ObjectId(userId),
    ...data,
  });
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: UpdateCategoryInput
) {
  await connectDB();
  const category = await Category.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(categoryId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: data },
    { new: true }
  ).lean();

  if (!category) {
    throw new Error("Category not found");
  }
  return category;
}

export async function deleteCategory(userId: string, categoryId: string) {
  await connectDB();
  const result = await Category.deleteOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (result.deletedCount === 0) {
    throw new Error("Category not found");
  }
}
