import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import Script from "next/script";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Inject user ID for client-side API client */}
      <Script
        id="user-id-setup"
        dangerouslySetInnerHTML={{
          __html: `window.__USER_ID__ = "${session.user.id}";`,
        }}
      />

      <Navbar
        userImage={session.user.image}
        userName={session.user.name}
        signOutAction={signOutAction}
      />

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
