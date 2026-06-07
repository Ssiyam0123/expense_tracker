import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to Home
        </Link>
        <div className="flex justify-center">
          <SignIn
            path="/login"
            signUpUrl="/signup"
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "#10b981",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
