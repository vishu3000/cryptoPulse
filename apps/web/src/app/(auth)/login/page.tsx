"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle,rgba(0,240,255,0.1) 0%,transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 500, height: 500, background: "radial-gradient(circle,rgba(255,45,123,0.07) 0%,transparent 65%)", borderRadius: "50%" }} />
      </div>

      <div className="w-full max-w-md px-6 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--cyan)", boxShadow: "0 0 26px rgba(0,240,255,0.5)" }}>
            <Activity size={22} strokeWidth={2.5} style={{ color: "#05070d" }} />
          </div>
          <h1 className="text-2xl font-extrabold">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Sign in to your Crypto Pulse account</p>
        </div>

        <div className="dc-card p-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--muted)" }}>EMAIL</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:text-white/25" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>PASSWORD</label>
                <span className="text-xs" style={{ color: "var(--cyan)" }}>Forgot password?</span>
              </div>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none placeholder:text-white/25" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }} />
                <button onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <Link href="/" className="w-full py-3 rounded-xl text-sm font-bold text-center mt-1" style={{ background: "var(--cyan)", color: "#05070d", boxShadow: "0 0 20px rgba(0,240,255,0.35)" }}>
              Sign In
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>or continue with</span>
              <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Google", "GitHub"].map((p) => (
                <button key={p} className="py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/[0.06]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)", color: "var(--muted-2)" }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "var(--muted)" }}>
          Don&apos;t have an account? <Link href="/signup" className="font-semibold" style={{ color: "var(--cyan)" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
