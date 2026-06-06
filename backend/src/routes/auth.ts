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

// GET /api/auth/google
router.get("/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    logger.error("GOOGLE_CLIENT_ID environment variable is missing");
    res.status(500).send("Google OAuth configuration is missing on server");
    return;
  }
  // Determine redirect URI
  const host = req.get("host") || "localhost:5000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=openid%20profile%20email` +
    `&prompt=consent`;
    
  res.redirect(authUrl);
});

// GET /api/auth/google/callback
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send("Authorization code missing");
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      logger.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing");
      res.status(500).send("Google OAuth configuration is missing on server");
      return;
    }
    const host = req.get("host") || "localhost:5000";
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      logger.error({ errorText }, "Google token exchange failed");
      res.status(500).send("Token exchange failed");
      return;
    }

    const tokens = (await tokenRes.json()) as { access_token: string };

    // 2. Retrieve user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      res.status(500).send("Failed to retrieve user profile");
      return;
    }

    const profile = (await userRes.json()) as { sub: string; email: string; name: string; picture?: string };

    if (!profile.email) {
      res.status(400).send("Email not provided by Google");
      return;
    }

    await connectDB();

    // 3. Find or create user
    let user = await User.findOne({ email: profile.email });
    if (!user) {
      user = await User.create({
        email: profile.email,
        name: profile.name,
        image: profile.picture,
        provider: "google",
        providerId: profile.sub,
      });
      logger.info({ email: profile.email }, "New user created via direct Google OAuth");
    } else {
      await User.updateOne(
        { email: profile.email },
        {
          $set: {
            name: profile.name || user.name,
            image: profile.picture || user.image,
            provider: "google",
            providerId: profile.sub || user.providerId,
            updatedAt: new Date(),
          },
        }
      );
      user = await User.findOne({ email: profile.email });
    }

    if (!user) {
      res.status(500).send("User sync failed");
      return;
    }

    // 4. Generate JWT
    const token = signToken({ userId: user._id.toString(), email: user.email });

    // 5. Redirect back to mobile app deep link
    res.redirect(`mobile://?token=${encodeURIComponent(token)}`);
  } catch (err) {
    logger.error({ err }, "Google callback error");
    res.status(500).send("Google auth failed");
  }
});

export default router;
