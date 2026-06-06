import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

// Middleware imports
import { authRateLimiter, apiRateLimiter } from "./middleware/rateLimiter";

// Route imports
import authRoutes from "./routes/auth";
import transactionRoutes from "./routes/transactions";
import budgetRoutes from "./routes/budgets";
import categoryRoutes from "./routes/categories";
import paymentMethodRoutes from "./routes/payment-methods";
import dashboardRoutes from "./routes/dashboard";
import exportRoutes from "./routes/export";

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----

// CORS: allow all origins in dev; configure tighter in production
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? process.env.CORS_ORIGIN || "*"
      : true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-user-id"],
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

// ---- Public Routes ----

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth (no JWT required, rate limited)
app.use("/api/auth", authRateLimiter, authRoutes);

// ---- Protected Routes (JWT required) ----

app.use("/api/v1/transactions", apiRateLimiter, transactionRoutes);
app.use("/api/v1/budgets", apiRateLimiter, budgetRoutes);
app.use("/api/v1/categories", apiRateLimiter, categoryRoutes);
app.use("/api/v1/payment-methods", apiRateLimiter, paymentMethodRoutes);
app.use("/api/v1/dashboard", apiRateLimiter, dashboardRoutes);
app.use("/api/v1/export.csv", apiRateLimiter, exportRoutes);

// ---- Error Handler ----
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL",
        message: "Internal server error",
        details: null,
      },
      meta: {},
    });
  }
);

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    data: null,
    error: { code: "NOT_FOUND", message: "Route not found", details: null },
    meta: {},
  });
});

// ---- Start Server ----
async function start() {
  try {
    await connectDB();
    logger.info("Database connected successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

// Only start the standalone HTTP server if we are not in a Vercel Serverless environment.
if (!process.env.VERCEL) {
  start();
}

export default app;
