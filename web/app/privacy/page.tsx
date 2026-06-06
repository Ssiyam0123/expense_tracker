import Link from "next/link";

export const metadata = {
  title: "Privacy Policy & Terms — ExpenseTracker",
  description: "Read the Privacy Policy and Terms of Service for ExpenseTracker. Learn how we safeguard your financial records and ensure absolute data security.",
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-[#030303] text-[#f4f4f5] overflow-hidden font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Background patterns */}
      <style dangerouslySetInnerHTML={{ __html: `
        .grid-bg {
          background-image: radial-gradient(rgba(16, 185, 129, 0.07) 1px, transparent 0);
          background-size: 24px 24px;
        }
      ` }} />
      <div className="absolute inset-0 grid-bg pointer-events-none z-0 opacity-70" />
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.03] blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#030303]/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-lg" />
              <img src="/logo.png" alt="ExpenseTracker Logo" className="relative w-7 h-7 rounded-lg border border-white/[0.08]" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              ExpenseTracker
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-white/5 border border-white/[0.08] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="border-b border-white/[0.06] pb-8 mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-4">
            Legal Protocols
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm">
            Last Updated: June 6, 2026. Review our Privacy Policy, Security Standards, and Terms of Use.
          </p>
        </div>

        <div className="space-y-12">
          
          {/* Section 1: Privacy Policy */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-emerald-400">01.</span> Privacy Policy
            </h2>
            <div className="text-zinc-400 text-xs md:text-sm leading-relaxed space-y-4 font-light">
              <p>
                At ExpenseTracker, we are committed to safeguarding your personal and financial details. This Privacy Policy details how we collect, process, and store your transactional records.
              </p>
              <p>
                <strong>Information Collection:</strong> We collect only the information required to run your account. This includes your name, email address, profile picture (from Google OAuth), and any custom categories, payment methods, budgets, and transactions you explicitly create.
              </p>
              <p>
                <strong>Data Sharing:</strong> We maintain a strict zero-sharing policy. We do not sell, rent, lease, or distribute your financial logs, email list, or identity metrics to any third-party marketing services or commercial data brokers.
              </p>
            </div>
          </section>

          {/* Section 2: Terms & Conditions */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-emerald-400">02.</span> Terms & Conditions
            </h2>
            <div className="text-zinc-400 text-xs md:text-sm leading-relaxed space-y-4 font-light">
              <p>
                By accessing or using the ExpenseTracker web dashboard or native mobile application, you agree to comply with and be bound by the following Terms of Service.
              </p>
              <p>
                <strong>License & Use:</strong> ExpenseTracker is provided to you free of charge for personal use. You are granted a non-transferable, revocable license to access our platform on compatible devices. You agree not to exploit or disrupt our API backend or database services.
              </p>
              <p>
                <strong>Account Accountability:</strong> You are responsible for maintaining the confidentiality of your credentials (including login email, passwords, and JWT tokens). We are not liable for any unauthorized access resulting from compromised account keys.
              </p>
            </div>
          </section>

          {/* Section 3: Data Security */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-emerald-400">03.</span> Data Security Protocols
            </h2>
            <div className="text-zinc-400 text-xs md:text-sm leading-relaxed space-y-4 font-light">
              <p>
                We execute high-standard security procedures to protect your transactions from breach, loss, or alteration.
              </p>
              <p>
                <strong>Encryption:</strong> All payload communications between Next.js, mobile clients, and the Express backend server are secured using SSL/TLS protocols. Passwords stored in the MongoDB database are hashed using bcrypt (12 rounds).
              </p>
              <p>
                <strong>Mobile Storage Sandboxing:</strong> The companion app stores offline queue drafts in local AsyncStorage. This data is private to the application container and cannot be read by other installed software on your mobile device.
              </p>
            </div>
          </section>

          {/* Section 4: Deletion & Termination */}
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-emerald-400">04.</span> Account Deletion Rights
            </h2>
            <div className="text-zinc-400 text-xs md:text-sm leading-relaxed space-y-4 font-light">
              <p>
                You retain ultimate ownership of your financial entries. If you decide to stop using ExpenseTracker, you can request full account deletion. Once initiated, all your user profile details, budgets, payment configurations, and transactions will be immediately and permanently purged from the production database.
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] bg-black py-8 text-zinc-600 text-xs">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <p>© {new Date().getFullYear()} ExpenseTracker. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
