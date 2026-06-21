"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, ChevronDown, Activity } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/markets", label: "Markets" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/alerts", label: "Alerts" },
];

export default function TopNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 px-5 py-3"
      style={{ background: "rgba(10,14,26,0.82)", borderBottom: "1px solid var(--card-border)", backdropFilter: "blur(16px)" }}>
      <div className="flex items-center gap-5 max-w-[1600px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: "var(--cyan)", boxShadow: "0 0 18px rgba(0,240,255,0.45)" }}>
            <Activity size={18} strokeWidth={2.5} style={{ color: "#05070d" }} />
          </div>
          <span className="text-[17px] font-extrabold tracking-tight">Crypto Pulse</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV.map(({ href, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: active ? "var(--cyan)" : "var(--muted)",
                  background: active ? "var(--cyan-soft)" : "transparent",
                }}>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div className="relative flex-1 max-w-md ml-auto hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input placeholder="Search markets, coins, pairs…"
            className="w-full pl-9 pr-12 py-2 rounded-xl text-sm outline-none placeholder:text-white/35"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }} />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded mono"
            style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted)" }}>⌘K</kbd>
        </div>

        {/* Bell */}
        <Link href="/alerts" className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }}>
          <Bell size={16} style={{ color: "var(--muted-2)" }} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "var(--pink)", color: "#fff" }}>2</span>
        </Link>

        {/* User */}
        <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }}>
          <div className="w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg,#00f0ff,#ff2d7b)" }} />
          <span className="text-sm font-semibold hidden sm:inline">Alex</span>
          <ChevronDown size={14} style={{ color: "var(--muted)" }} />
        </button>
      </div>
    </header>
  );
}
