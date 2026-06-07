import { Request, Response, NextFunction } from "express";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { apiError } from "../utils/response";
import { logger } from "../utils/logger";
import { User } from "../models/User";
import { connectDB } from "../utils/db";

interface UserPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      auth?: {
        userId: string | null;
        sessionId: string | null;
        actor: unknown;
        sessionClaims: unknown;
      };
    }
  }
}

// Wrap ClerkExpressWithAuth in our custom authenticate middleware
const clerkMiddleware = ClerkExpressWithAuth();

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  clerkMiddleware(req as any, res as any, async () => {
    if (req.auth && req.auth.userId) {
      try {
        await connectDB();
        
        // Find MongoDB user associated with this Clerk User ID
        let user = await User.findOne({ providerId: req.auth.userId });
        
        if (!user) {
          // Fallbacks for name and email from session claims
          const email = (req.auth.sessionClaims as any)?.email || `${req.auth.userId}@clerk.local`;
          const name = (req.auth.sessionClaims as any)?.name || "Clerk User";
          
          user = await User.create({
            email,
            name,
            provider: "google", // Map as standard provider login
            providerId: req.auth.userId,
          });
          logger.info({ userId: user._id.toString() }, "Created new MongoDB user document for Clerk ID");
        }
        
        req.user = {
          userId: user._id.toString(),
          email: user.email,
        };
        next();
      } catch (err) {
        logger.error({ err }, "Error syncing Clerk user to MongoDB");
        apiError(res, "INTERNAL", "Failed to sync user session", 500);
      }
    } else {
      logger.warn("Unauthenticated request blocked by Clerk middleware");
      apiError(res, "UNAUTHORIZED", "Authentication required", 401);
    }
  });
}

