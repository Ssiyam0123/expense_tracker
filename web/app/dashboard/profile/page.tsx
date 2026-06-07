import { currentUser } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/server-api";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    return <div className="p-8 text-center text-muted">Please sign in to view your profile.</div>;
  }

  // Fetch summary and counts
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgetsRes, categoriesRes, transactionsRes] = await Promise.all([
    serverApi.get("/api/v1/budgets", { month, year }),
    serverApi.get("/api/v1/categories"),
    serverApi.get("/api/v1/transactions", { limit: "100" }),
  ]);

  const budgetsCount = Array.isArray(budgetsRes.data) ? budgetsRes.data.length : 0;
  const categoriesCount = Array.isArray(categoriesRes.data) ? categoriesRes.data.length : 0;
  const transactionsCount = Array.isArray(transactionsRes.data) ? transactionsRes.data.length : 0;

  const email = user.emailAddresses[0]?.emailAddress || "user@example.com";
  const fullName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  const imageUrl = user.imageUrl;
  
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Recently";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
        <p className="text-sm text-slate-400">Manage your account details and view system statistics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Avatar and Account summary */}
        <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 h-[2px] w-full bg-emerald-500/30" />
          
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={fullName} 
              className="w-24 h-24 rounded-full border-2 border-emerald-500/30 mb-4 object-cover" 
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mb-4">
              <span className="text-emerald-400 text-3xl font-bold">
                {fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <h2 className="text-lg font-semibold text-white mb-1">{fullName}</h2>
          <p className="text-sm text-slate-400 mb-6">{email}</p>

          <div className="w-full space-y-4 border-t border-white/[0.06] pt-5 text-left text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Member Since</span>
              <span className="text-white font-medium">{joinedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Authentication</span>
              <span className="text-white font-medium">Clerk Auth</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Stats & Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">💳</span>
              <span className="text-xl font-bold text-white">{transactionsCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">Transactions</span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🎯</span>
              <span className="text-xl font-bold text-white">{budgetsCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">Budgets</span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🏷️</span>
              <span className="text-xl font-bold text-white">{categoriesCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">Categories</span>
            </div>
          </div>

          {/* Preferences Settings List */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Application Settings</h3>
            </div>

            <div className="divide-y divide-white/[0.06] text-sm text-slate-400">
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                  <span>💵</span>
                  <span className="text-white font-medium">Primary Currency</span>
                </div>
                <span className="text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  BDT (৳)
                </span>
              </div>

              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                  <span>🎨</span>
                  <span className="text-white font-medium">Visual Theme</span>
                </div>
                <span className="text-slate-400 text-xs bg-white/5 px-2.5 py-1 rounded-full">
                  Dark Mode (Emerald)
                </span>
              </div>

              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                  <span>💻</span>
                  <span className="text-white font-medium">Deployment Platform</span>
                </div>
                <span className="text-slate-400 text-xs">Vercel Production</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex gap-4">
            <Link 
              href="/dashboard"
              className="flex-1 text-center py-2.5 rounded-xl border border-white/[0.08] bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              📊 Go to Dashboard
            </Link>
            <Link 
              href="/dashboard/transactions"
              className="flex-1 text-center py-2.5 rounded-xl border border-white/[0.08] bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              💳 Transactions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
