import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentMethod extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    icon: { type: String },
  },
  {
    timestamps: true,
  }
);

PaymentMethodSchema.index({ userId: 1, name: 1 }, { unique: true });

export const PaymentMethod =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);
