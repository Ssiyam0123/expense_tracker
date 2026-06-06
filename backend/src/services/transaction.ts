import mongoose from "mongoose";
import { connectDB } from "../utils/db";
import { Transaction } from "../models/Transaction";
import { logger } from "../utils/logger";

interface SyncItem {
  amountMinor: number;
  currency: string;
  type: "income" | "expense";
  categoryId: string;
  paymentMethodId: string;
  timestamp: string;
  note?: string | null;
  tags?: string[];
  localId: string;
  sourceDeviceId: string;
  version: number;
  deletedAt?: string | null;
  idempotencyKey: string;
}

interface ListTransactionsQuery {
  page: number;
  limit: number;
  type?: "income" | "expense";
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy: "timestamp" | "amountMinor" | "createdAt";
  sortOrder: "asc" | "desc";
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  await connectDB();
  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  };

  if (query.type) filter.type = query.type;
  if (query.categoryId)
    filter.categoryId = new mongoose.Types.ObjectId(query.categoryId);
  if (query.startDate || query.endDate) {
    filter.timestamp = {};
    if (query.startDate)
      (filter.timestamp as Record<string, Date>).$gte = new Date(query.startDate);
    if (query.endDate)
      (filter.timestamp as Record<string, Date>).$lte = new Date(query.endDate);
  }

  const skip = (query.page - 1) * query.limit;
  const sortOrder = query.sortOrder === "desc" ? -1 : 1;
  const sortBy = query.sortBy || "timestamp";

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(query.limit)
      .populate("categoryId", "name icon color type")
      .populate("paymentMethodId", "name icon")
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function createTransaction(
  userId: string,
  data: {
    amountMinor: number;
    currency: string;
    type: "income" | "expense";
    categoryId: string;
    paymentMethodId: string;
    timestamp?: string;
    note?: string;
    tags?: string[];
    localId?: string;
    sourceDeviceId?: string;
  }
) {
  await connectDB();
  const localId = data.localId || crypto.randomUUID();
  const sourceDeviceId = data.sourceDeviceId || "server";

  return Transaction.create({
    userId: new mongoose.Types.ObjectId(userId),
    amountMinor: data.amountMinor,
    currency: data.currency,
    type: data.type,
    categoryId: new mongoose.Types.ObjectId(data.categoryId),
    paymentMethodId: new mongoose.Types.ObjectId(data.paymentMethodId),
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    note: data.note,
    tags: data.tags || [],
    localId,
    sourceDeviceId,
  });
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: Record<string, unknown>
) {
  await connectDB();
  const update: Record<string, unknown> = { $set: data, $inc: { version: 1 } };
  if (data.timestamp) {
    (update.$set as Record<string, unknown>).timestamp = new Date(data.timestamp as string);
  }
  if (data.categoryId) {
    (update.$set as Record<string, unknown>).categoryId = new mongoose.Types.ObjectId(data.categoryId as string);
  }
  if (data.paymentMethodId) {
    (update.$set as Record<string, unknown>).paymentMethodId = new mongoose.Types.ObjectId(data.paymentMethodId as string);
  }

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(transactionId),
      userId: new mongoose.Types.ObjectId(userId),
      deletedAt: null,
    },
    update,
    { new: true }
  ).lean();

  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return transaction;
}

export async function deleteTransaction(userId: string, transactionId: string) {
  await connectDB();
  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(transactionId),
      userId: new mongoose.Types.ObjectId(userId),
      deletedAt: null,
    },
    {
      $set: { deletedAt: new Date() },
      $inc: { version: 1 },
    },
    { new: true }
  ).lean();

  if (!transaction) {
    throw new Error("Transaction not found");
  }
  return transaction;
}

export async function syncTransactions(
  userId: string,
  data: { transactions: SyncItem[] }
) {
  await connectDB();
  const results: Array<{
    localId: string;
    status: string;
    serverId?: string;
    error?: string;
  }> = [];

  for (const item of data.transactions) {
    try {
      const filter = {
        userId: new mongoose.Types.ObjectId(userId),
        sourceDeviceId: item.sourceDeviceId,
        localId: item.localId,
      };

      if (item.deletedAt) {
        await Transaction.findOneAndUpdate(filter, {
          $set: { deletedAt: new Date(item.deletedAt) },
          $inc: { version: 1 },
        });
        results.push({ localId: item.localId, status: "deleted" });
      } else {
        const existing = await Transaction.findOne(filter);

        if (existing) {
          if (item.version >= existing.version) {
            await Transaction.findOneAndUpdate(filter, {
              $set: {
                amountMinor: item.amountMinor,
                currency: item.currency,
                type: item.type,
                categoryId: new mongoose.Types.ObjectId(item.categoryId),
                paymentMethodId: new mongoose.Types.ObjectId(item.paymentMethodId),
                timestamp: new Date(item.timestamp),
                note: item.note,
                tags: item.tags || [],
                syncStatus: "synced",
                syncedAt: new Date(),
                version: item.version,
              },
            });
            results.push({
              localId: item.localId,
              status: "updated",
              serverId: existing._id.toString(),
            });
          } else {
            results.push({
              localId: item.localId,
              status: "conflict",
              error: "Server has newer version",
            });
          }
        } else {
          const created = await Transaction.create({
            userId: new mongoose.Types.ObjectId(userId),
            amountMinor: item.amountMinor,
            currency: item.currency,
            type: item.type,
            categoryId: new mongoose.Types.ObjectId(item.categoryId),
            paymentMethodId: new mongoose.Types.ObjectId(item.paymentMethodId),
            timestamp: new Date(item.timestamp),
            note: item.note,
            tags: item.tags || [],
            localId: item.localId,
            sourceDeviceId: item.sourceDeviceId,
            syncStatus: "synced",
            version: item.version,
            syncedAt: new Date(),
          });
          results.push({
            localId: item.localId,
            status: "created",
            serverId: created._id.toString(),
          });
        }
      }
    } catch (err) {
      logger.error({ err, localId: item.localId }, "Sync error for transaction");
      results.push({
        localId: item.localId,
        status: "error",
        error: (err as Error).message,
      });
    }
  }

  return results;
}
