import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { connectDB } from "../utils/db";
import { User } from "../models/User";
import { logger } from "../utils/logger";
import { apiSuccess, apiError } from "../utils/response";
import { signToken } from "../utils/jwt";
import { signupSchema, loginSchema } from "../schemas/auth";

const router = Router();

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }
    const data = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      apiError(res, "VALIDATION", "An account with this email already exists", 400);
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const createdUser = await User.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      provider: "credentials",
    });

    logger.info({ email: createdUser.email }, "New user created via API signup");

    apiSuccess(res, {
      id: createdUser._id.toString(),
      name: createdUser.name,
      email: createdUser.email,
      token: signToken({ userId: createdUser._id.toString(), email: createdUser.email }),
    });
  } catch (err) {
    logger.error({ err }, "Signup error");
    apiError(res, "INTERNAL", "Something went wrong during signup", 500);
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      apiError(res, "VALIDATION", "Invalid input", 400, parsed.error.flatten().fieldErrors);
      return;
    }
    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email, provider: "credentials" }).select("+password");
    if (!user || !user.password) {
      apiError(res, "UNAUTHORIZED", "Invalid email or password", 401);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      apiError(res, "UNAUTHORIZED", "Invalid email or password", 401);
      return;
    }

    logger.info({ email: user.email }, "User logged in");
    apiSuccess(res, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      token: signToken({ userId: user._id.toString(), email: user.email }),
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    apiError(res, "INTERNAL", "Something went wrong during login", 500);
  }
});

// POST /api/auth/google-login
router.post("/google-login", async (req: Request, res: Response) => {
  try {
    const { email, name, image, providerId } = req.body;
    if (!email) {
      apiError(res, "VALIDATION", "Email is required", 400);
      return;
    }

    await connectDB();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        image,
        provider: "google",
        providerId,
      });
      logger.info({ email }, "New user created via API Google Login");
    } else {
      await User.updateOne(
        { email },
        {
          $set: {
            name: name || user.name,
            image: image || user.image,
            provider: "google",
            providerId: providerId || user.providerId,
            updatedAt: new Date(),
          },
        }
      );
      user = await User.findOne({ email });
    }

    if (!user) {
      apiError(res, "INTERNAL", "User sync failed", 500);
      return;
    }

    apiSuccess(res, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      token: signToken({ userId: user._id.toString(), email: user.email }),
    });
  } catch (err) {
    logger.error({ err }, "Google login error");
    apiError(res, "INTERNAL", "Something went wrong during Google login", 500);
  }
});

// GET /api/auth/user-by-email
router.get("/user-by-email", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      apiError(res, "VALIDATION", "Email is required", 400);
      return;
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      apiError(res, "NOT_FOUND", "User not found", 404);
      return;
    }

    apiSuccess(res, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    logger.error({ err }, "User by email error");
    apiError(res, "INTERNAL", "Something went wrong", 500);
  }
});

export default router;
