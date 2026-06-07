import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Navbar } from "@/components/Navbar";
import Script from "next/script";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const user = await currentUser();


  return (
    <div className="flex min-h-screen flex-col">
      {/* Inject user ID for client-side API client */}
      <Script
        id="user-id-setup"
        dangerouslySetInnerHTML={{
          __html: `window.__USER_ID__ = "${userId}";`,
        }}
      />

      <Navbar
        userImage={user?.imageUrl || null}
        userName={user?.fullName || null}
      />

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
