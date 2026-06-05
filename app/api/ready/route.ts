import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { logger } from "@/lib/logger";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const isConnected = mongoose.connection.readyState === 1;
    return NextResponse.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      database: isConnected ? "connected" : "disconnected",
    });
  } catch (err) {
    logger.error({ err }, "/ready check failed");
    return NextResponse.json(
      { status: "not_ready", database: "disconnected" },
      { status: 503 }
    );
  }
}
