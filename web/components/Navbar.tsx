"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  userImage?: string | null;
  userName?: string | null;
  signOutAction: () => Promise<void>;
}

export function Navbar({ userImage, userName, signOutAction }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/transactions", label: "Transactions" },
    { href: "/dashboard/budgets", label: "Budgets" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-white hover:opacity-85 transition-opacity">
          ExpenseTracker
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Info / Logout */}
        <div className="hidden md:flex items-center gap-3">
          {userImage && (
            <img
              src={userImage}
              alt={userName || "User"}
              className="h-7 w-7 rounded-full ring-1 ring-white/10"
            />
          )}
          <button
            onClick={() => signOutAction()}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-expense transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-3">
          {userImage && (
            <img
              src={userImage}
              alt=""
              className="h-6 w-6 rounded-full ring-1 ring-white/10"
            />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-background/95 backdrop-blur-lg px-4 py-3 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="h-px bg-white/[0.08] my-2" />
          <button
            onClick={() => {
              setIsOpen(false);
              signOutAction();
            }}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-expense transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
