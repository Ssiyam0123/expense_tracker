import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { logger } from "@/lib/logger";
import { signupSchema } from "@/schemas/auth";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    let name = "";
    let email = "";
    let password = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      name = params.get("name") || "";
      email = params.get("email") || "";
      password = params.get("password") || "";
    } else {
      const body = await req.json();
      name = body.name || "";
      email = body.email || "";
      password = body.password || "";
    }

    // Validate input using Zod schema
    const data = signupSchema.parse({ name, email, password });

    await connectDB();

    // Check for existing user
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION", message: "An account with this email already exists", details: null }, meta: {} },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const createdUser = await User.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      provider: "credentials",
    });

    logger.info({ email: data.email }, "New user created via API credentials signup");

    return NextResponse.json({
      data: {
        id: createdUser._id.toString(),
        name: createdUser.name,
        email: createdUser.email,
      },
      error: null,
      meta: { success: true },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION", message: "Invalid input", details: err.flatten().fieldErrors }, meta: {} },
        { status: 400 }
      );
    }
    logger.error({ err }, "API Signup error");
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL", message: "Something went wrong during signup", details: null }, meta: {} },
      { status: 500 }
    );
  }
}
