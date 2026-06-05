import mongoose from "mongoose";
import { logger } from "@/lib/logger";
import dns from "node:dns";

// Configure DNS resolvers to handle SRV resolution issues on some local networks
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (err) {
  logger.warn({ err }, "Could not set custom DNS servers");
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/expense_tracker";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.info("MongoDB connected");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    logger.error({ err: e }, "MongoDB connection error");
    throw e;
  }

  return cached.conn;
}
