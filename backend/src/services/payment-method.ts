import mongoose from "mongoose";
import { connectDB } from "../utils/db";
import { PaymentMethod } from "../models/PaymentMethod";

export interface CreatePaymentMethodInput {
  name: string;
  icon?: string;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  icon?: string;
}

const DEFAULT_PAYMENT_METHODS = [
  { name: "Cash", icon: "💵" },
  { name: "Card", icon: "💳" },
  { name: "Mobile Banking", icon: "📱" },
];

export async function getPaymentMethods(userId: string) {
  await connectDB();
  const uId = new mongoose.Types.ObjectId(userId);
  let pms = await PaymentMethod.find({ userId: uId })
    .sort({ name: 1 })
    .lean();

  if (pms.length === 0) {
    const toInsert = DEFAULT_PAYMENT_METHODS.map((pm) => ({
      userId: uId,
      ...pm,
    }));
    await PaymentMethod.insertMany(toInsert);
    pms = await PaymentMethod.find({ userId: uId })
      .sort({ name: 1 })
      .lean();
  }

  return pms;
}

export async function createPaymentMethod(
  userId: string,
  data: CreatePaymentMethodInput
) {
  await connectDB();
  const existing = await PaymentMethod.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    name: data.name,
  });
  if (existing) {
    throw new Error("Payment method with this name already exists");
  }
  return PaymentMethod.create({
    userId: new mongoose.Types.ObjectId(userId),
    ...data,
  });
}

export async function updatePaymentMethod(
  userId: string,
  paymentMethodId: string,
  data: UpdatePaymentMethodInput
) {
  await connectDB();
  const pm = await PaymentMethod.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(paymentMethodId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: data },
    { new: true }
  ).lean();

  if (!pm) {
    throw new Error("Payment method not found");
  }
  return pm;
}

export async function deletePaymentMethod(userId: string, paymentMethodId: string) {
  await connectDB();
  const result = await PaymentMethod.deleteOne({
    _id: new mongoose.Types.ObjectId(paymentMethodId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (result.deletedCount === 0) {
    throw new Error("Payment method not found");
  }
}
