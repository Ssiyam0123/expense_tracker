import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
  title: "ExpenseTracker — Premium Personal Finance Engine",
  description: "Experience hyper-fast transaction logging, smart category budgets, and offline-first mobile sync. 100% private, free, and designed for ultimate speed.",
};

export default async function PremiumLandingPage() {
  const { userId } = await auth();


  return (
    <div className="relative min-h-screen bg-[#030303] text-[#f4f4f5] overflow-hidden font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Premium Embedded Custom CSS for Grid Background and Glowing Effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        .grid-bg {
          background-image: radial-gradient(rgba(16, 185, 129, 0.07) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .glow-button {
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glow-button::after {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(90deg, #10b981, #059669, #34d399);
          border-radius: inherit;
          z-index: -1;
          opacity: 0.4;
          transition: opacity 0.3s ease;
        }
        .glow-button:hover::after {
          opacity: 1;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.01);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(16, 185, 129, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px -12px rgba(16, 185, 129, 0.08);
        }
        .badge-premium {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
      ` }} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-bg pointer-events-none z-0 opacity-70" />

      {/* Radial Gradient Glow Blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/[0.03] blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#030303]/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-lg group-hover:bg-emerald-500/30 transition-all" />
              <img src="/logo.png" alt="ExpenseTracker Logo" className="relative w-7 h-7 rounded-lg border border-white/[0.08]" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              ExpenseTracker
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden sm:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#mobile" className="hidden sm:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors">Mobile App</a>
            <a href="#privacy" className="hidden sm:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors">Privacy</a>
            
            <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

            {userId ? (
              <Link
                href="/dashboard"
                id="cta-dashboard-link"
                className="glow-button rounded-xl bg-white/5 border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  id="cta-login-link"
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  id="cta-signup-link"
                  className="glow-button rounded-xl bg-white text-black px-4 py-2 text-xs font-bold shadow-lg shadow-white/5 active:scale-95 hover:bg-zinc-100 transition-all"
                >
                  <span className="hidden sm:inline">Start Tracking Free</span>
                  <span className="inline sm:hidden">Start Free</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 text-center">
        <div className="inline-flex items-center gap-2 badge-premium rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Offline-First Sync Engine Configured
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white max-w-4xl mx-auto leading-[0.95] mb-6">
          Take absolute control <br />
          of your cash flow.
        </h1>
        
        <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-10 font-normal">
          Log spending in milliseconds, set dynamic category boundaries, and keep your data stored locally or backed up automatically. Beautifully simple, secure, and free.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={userId ? "/dashboard" : "/signup"}
            id="hero-start-cta"
            className="rounded-xl bg-emerald-500 px-6 py-3.5 text-xs font-bold text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            Create Your Account
          </Link>
          <a
            href="#mobile"
            className="rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] px-6 py-3.5 text-xs font-semibold text-white active:scale-[0.98] transition-all"
          >
            Launch Companion App
          </a>
        </div>

        {/* Dashboard UI Preview Container */}
        <div className="mt-20 relative mx-auto max-w-5xl rounded-[24px] border border-white/[0.06] bg-zinc-950/40 p-3 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-emerald-500/[0.05] rounded-full blur-[60px] pointer-events-none" />
          
          <div className="rounded-2xl overflow-hidden border border-white/[0.04] bg-black/80 aspect-[16/9] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent z-10" />
            
            {/* Visual Glassmorphic Dashboard Details */}
            <div className="z-20 text-center max-w-lg px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-white text-lg font-bold tracking-tight mb-2">Beautiful Expense Breakdowns</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Seamlessly monitor your category thresholds, monthly trend lines, and recent balances in real time. Designed for maximum information density with clean, clutter-free aesthetics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="relative z-10 border-t border-white/[0.04] bg-black/40 py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-none mb-4">
              Everything you need to optimize your savings
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm">
              Powerful tools built with the performance and UX standards of modern fintech products.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-6">
                ⚡
              </div>
              <h3 className="text-white font-semibold text-base mb-3 tracking-tight">Ultra-Fast Logging</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Log purchases in seconds using the keyboard-first input flow. Quick inputs let you record categories, payments, and timestamps instantly.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-6">
                🔄
              </div>
              <h3 className="text-white font-semibold text-base mb-3 tracking-tight">Bi-Directional Sync</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Synchronize details perfectly across web and mobile. Changes made offline on your phone sync securely as soon as you connect to the network.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-6">
                🎨
              </div>
              <h3 className="text-white font-semibold text-base mb-3 tracking-tight">Category Customization</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Manage budgets your way. Personalize your budget categories with custom colors, visual icons, and specific monthly consumption thresholds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section id="mobile" className="relative z-10 border-t border-white/[0.04] py-28">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          {/* Text and QR */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 badge-premium rounded-full px-3.5 py-1 text-xs text-emerald-400 font-medium">
              📱 Native Companion
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
              Your finances, <br />always in reach.
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
              Scan the developer QR code below to launch the companion application in Expo Go. Track category allocations, view cash flows, and sync data in the background.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-zinc-300 text-xs">
                <span className="text-emerald-400 mt-0.5">✔</span>
                <div>
                  <h4 className="font-semibold text-white">Offline-First Engine</h4>
                  <p className="text-zinc-500 mt-0.5 text-[11px]">Automatically retries failed queries and merges data seamlessly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-zinc-300 text-xs">
                <span className="text-emerald-400 mt-0.5">✔</span>
                <div>
                  <h4 className="font-semibold text-white">Full Category Customizer</h4>
                  <p className="text-zinc-500 mt-0.5 text-[11px]">Create new transaction structures, pick emoji symbols, and adjust budget settings.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-6">
              <div className="bg-white p-2.5 rounded-2xl shadow-xl shadow-emerald-500/5 border border-emerald-500/10 inline-block">
                {/* Visual Minimalist QR Code representation */}
                <div className="w-24 h-24 bg-zinc-950 p-2 rounded-xl flex flex-wrap items-center justify-center">
                  <div className="grid grid-cols-4 gap-1 w-full h-full text-zinc-400 text-[6px] font-mono select-none opacity-80 leading-none overflow-hidden">
                    <div>■ ■ □ ■</div>
                    <div>■ □ ■ ■</div>
                    <div>□ ■ □ ■</div>
                    <div>■ ■ ■ □</div>
                    <div>■ □ ■ ■</div>
                    <div>□ ■ □ ■</div>
                    <div>■ ■ ■ □</div>
                    <div>□ ■ □ ■</div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-white font-bold">Expo Developer Build</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">Compatible with Android and iOS devices running Expo Go.</p>
              </div>
            </div>
          </div>

          {/* Interactive Phone Layout Mockup */}
          <div className="flex-1 w-full max-w-sm">
            <div className="relative mx-auto rounded-[48px] border-8 border-zinc-900 bg-black p-4 shadow-[0_0_80px_rgba(16,185,129,0.05)] aspect-[9/18.5] overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-zinc-900 rounded-full z-20" />
              
              <div className="h-full w-full rounded-[36px] border border-white/[0.04] bg-[#030303] p-5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-40] left-[-40] w-[140] h-[140] bg-emerald-500/[0.06] rounded-full blur-2xl" />
                
                {/* UI Mobile Header */}
                <div className="flex justify-between items-center z-10">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="" className="w-5 h-5 rounded-md" />
                    <span className="text-white text-[10px] font-black tracking-tight">ExpenseTracker</span>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-medium">Sync Active</div>
                </div>

                {/* Balance display */}
                <div className="my-auto space-y-5 z-10">
                  <div className="text-center">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Net Balance</span>
                    <h4 className="text-white text-2xl font-black tracking-tight mt-1">৳ 72,500</h4>
                  </div>
                  
                  {/* Category Progress Mockups */}
                  <div className="space-y-3">
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                      <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="text-zinc-300 font-medium">🍕 Food & Dining</span>
                        <span className="text-emerald-400 font-semibold">20% Used</span>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[20%]" />
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                      <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="text-zinc-300 font-medium">🚗 Transport</span>
                        <span className="text-red-400 font-semibold">85% Used</span>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-[85%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigator Simulation */}
                <div className="flex justify-around border-t border-white/[0.04] pt-3 mt-auto">
                  <span className="text-xs text-emerald-400">🏠</span>
                  <span className="text-xs text-zinc-600">📊</span>
                  <span className="text-xs text-zinc-600">➕</span>
                  <span className="text-xs text-zinc-600">⚙</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy & Terms Section */}
      <section id="privacy" className="relative z-10 border-t border-white/[0.04] bg-black/60 py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-none mb-3">
              Privacy & Security Protocols
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm">
              How we secure your financial credentials and transaction information.
            </p>
          </div>

          <div className="space-y-8 text-zinc-400 text-xs md:text-sm leading-relaxed border border-white/[0.04] bg-white/[0.01] p-8 md:p-10 rounded-[24px] backdrop-blur-xl">
            <div>
              <h3 className="text-white font-bold text-sm mb-2.5">1. Zero Third-Party Sharing</h3>
              <p className="font-light">
                All monthly budgets, custom categorizations, and expense lists are encrypted in transit using SSL/TLS protocols. We maintain strict compliance checks to ensure your data is never sold, analyzed, or shared with commercial advertisement engines.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm mb-2.5">2. Secure Offline Storage</h3>
              <p className="font-light">
                Our React Native companion application saves transaction drafts in sandboxed local directories. Once online, database entries are synchronized with the central Express server utilizing unique user authentication tokens.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm mb-2.5">3. Google Authentication</h3>
              <p className="font-light">
                Next.js integrates Google Identity services exclusively to identify your account (email, name, profile image). We have no permission, storage capability, or access rights to any other items in your Google account.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm mb-2.5">4. Complete Account Deletion</h3>
              <p className="font-light">
                We believe you should control your database footprint. You can initiate a deletion routine at any time. When triggered, all transactional data and account info are erased from our databases with zero remnants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] bg-black py-10 text-zinc-600 text-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} ExpenseTracker. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
