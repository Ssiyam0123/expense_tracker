import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amountMinor: number;
  currency: string;
  period: "monthly" | "weekly" | "yearly";
  month: number; // 1-12
  year: number;
  alertThreshold?: number; // percentage (e.g., 80 means alert at 80% spent)
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true, default: "BDT" },
    period: {
      type: String,
      required: true,
      enum: ["monthly", "weekly", "yearly"],
      default: "monthly",
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    alertThreshold: { type: Number, default: 80 },
  },
  {
    timestamps: true,
  }
);

BudgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

export const Budget = mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
