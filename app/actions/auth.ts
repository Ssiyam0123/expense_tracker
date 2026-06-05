"use server";

import bcrypt from "bcryptjs";
import { MongoServerError } from "mongodb";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { logger } from "@/lib/logger";
import { signupSchema } from "@/schemas/auth";
import { ZodError } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type SignupState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  try {
    const data = signupSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await connectDB();

    // Check for existing user
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return {
        errors: { email: ["An account with this email already exists"] },
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    await User.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      provider: "credentials",
    });

    logger.info({ email: data.email }, "New user created via credentials");

    // Automatically sign in the user and redirect to dashboard
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    if (err instanceof AuthError) {
      return {
        errors: { _form: ["Account created but failed to sign in automatically. Please sign in manually."] },
      };
    }
    if (err instanceof ZodError) {
      return { errors: err.flatten().fieldErrors };
    }
    if (err instanceof MongoServerError && err.code === 11000) {
      return {
        errors: { email: ["An account with this email already exists"] },
      };
    }
    // Detect MongoDB connection errors
    if (err instanceof Error && err.message?.includes("ECONNREFUSED")) {
      return {
        errors: { _form: ["Unable to connect to the database. Please try again later."] },
      };
    }
    if (err instanceof Error && err.name === "MongooseServerSelectionError") {
      return {
        errors: { _form: ["Unable to connect to the database. Please try again later."] },
      };
    }
    logger.error({ err }, "Signup error");
    return { errors: { _form: ["Something went wrong. Please try again."] } };
  }
}
