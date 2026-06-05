import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  icon?: string;
  color?: string;
  type: "income" | "expense";
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    icon: { type: String },
    color: { type: String },
    type: {
      type: String,
      required: true,
      enum: ["income", "expense"],
      default: "expense",
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
