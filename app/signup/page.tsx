"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupAction, type SignupState } from "@/app/actions/auth";

const initialState: SignupState = {};

export default function SignupPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signupAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=true");
    }
  }, [state.success, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-1 text-2xl font-bold tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-muted">
              Track your expenses with ease
            </p>
          </div>

          <form action={action} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-xs text-muted"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted/50 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {state.errors?.name && (
                <p className="mt-1 text-xs text-expense">
                  {state.errors.name[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs text-muted"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted/50 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {state.errors?.email && (
                <p className="mt-1 text-xs text-expense">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs text-muted"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Min 8 chars, upper + lower + number"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted/50 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {state.errors?.password && (
                <ul className="mt-1 list-inside list-disc text-xs text-expense">
                  {state.errors.password.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>

            {state.errors?._form && (
              <div className="rounded-lg bg-expense/10 px-3 py-2 text-xs text-expense">
                {state.errors._form[0]}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-all hover:bg-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
