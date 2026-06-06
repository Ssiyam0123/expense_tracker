import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amountMinor: number;
  currency: string;
  type: "income" | "expense";
  categoryId: mongoose.Types.ObjectId;
  paymentMethodId: mongoose.Types.ObjectId;
  timestamp: Date;
  note?: string;
  tags: string[];
  localId: string;
  sourceDeviceId: string;
  syncStatus: "pending" | "synced" | "conflict";
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  syncedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true, default: "BDT" },
    type: { type: String, required: true, enum: ["income", "expense"] },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    paymentMethodId: { type: Schema.Types.ObjectId, ref: "PaymentMethod", required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    note: { type: String },
    tags: [{ type: String }],
    localId: { type: String, required: true },
    sourceDeviceId: { type: String, required: true },
    syncStatus: {
      type: String,
      required: true,
      enum: ["pending", "synced", "conflict"],
      default: "synced",
    },
    version: { type: Number, required: true, default: 1 },
    deletedAt: { type: Date, default: null },
    syncedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index(
  { userId: 1, sourceDeviceId: 1, localId: 1 },
  { unique: true }
);

TransactionSchema.index({ userId: 1, timestamp: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1, timestamp: -1 });
TransactionSchema.index({ userId: 1, type: 1, timestamp: -1 });

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
