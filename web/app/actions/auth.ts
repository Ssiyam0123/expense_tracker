"use server";

import { logger } from "@/lib/logger";
import { signupSchema } from "@/schemas/auth";
import { ZodError } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      if (result.error && result.error.code === "VALIDATION") {
        if (result.error.message?.includes("exists")) {
          return {
            errors: { email: ["An account with this email already exists"] },
          };
        }
        return {
          errors: result.error.details || { _form: [result.error.message] },
        };
      }
      return {
        errors: { _form: [result.error?.message || "Signup failed"] },
      };
    }

    logger.info({ email: data.email }, "New user created via Express API signup");

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
    logger.error({ err }, "Signup error");
    return { errors: { _form: ["Something went wrong. Please try again."] } };
  }
}
