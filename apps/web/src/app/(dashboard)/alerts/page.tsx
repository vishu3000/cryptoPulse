"use client";
import { useState, useEffect } from "react";
import CoinIcon from "@/components/CoinIcon";
import { getAlerts, getMarkets, createAlert, updateAlert, deleteAlert, type Alert, type Coin } from "@/lib/api";
import { fmt } from "@/lib/staticData";
import { Bell, BellOff, Plus, Trash2, CheckCircle } from "lucide-react";

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ coinId: "bitcoin", condition: "above" as "above" | "below", targetPrice: "", email: "vishuyadav856@gmail.com" });

  const coinMap = new Map(coins.map((c) => [c.id, c]));

  useEffect(() => {
    Promise.all([getAlerts(), getMarkets(20)])
      .then(([a, m]) => { setAlerts(a); setCoins(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.targetPrice) return;
    const a = await createAlert(form.coinId, form.condition, Number(form.targetPrice), form.email).catch(console.error);
    if (a) setAlerts((p) => [...p, a]);
    setForm((f) => ({ ...f, targetPrice: "" }));
    setShowForm(false);
  }

  async function toggle(id: string, isActive: boolean) {
    setAlerts((p) => p.map((a) => a.id === id ? { ...a, isActive } : a));
    await updateAlert(id, { isActive }).catch(console.error);
  }

  async function del(id: string) {
    setAlerts((p) => p.filter((a) => a.id !== id));
    await deleteAlert(id).catch(console.error);
  }

  const active    = alerts.filter((a) => a.isActive && !a.triggeredAt);
  const triggered = alerts.filter((a) => a.triggeredAt);
  const paused    = alerts.filter((a) => !a.isActive && !a.triggeredAt);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm mono" style={{ color: "var(--muted)" }}>Loading alerts…</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Price Alerts</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Get emailed when a coin hits your target</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--cyan)", color: "#05070d", boxShadow: "0 0 20px rgba(0,240,255,0.35)" }}>
          <Plus size={15} /> New Alert
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ l: "Active", v: active.length, c: "var(--cyan)" }, { l: "Triggered", v: triggered.length, c: "var(--gold)" }, { l: "Paused", v: paused.length, c: "var(--muted)" }].map((s) => (
          <div key={s.l} className="dc-card p-[18px]">
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{s.l}</p>
            <p className="text-3xl font-extrabold mono" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="dc-card p-5">
          <p className="text-sm font-bold mb-4">Create New Alert</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>COIN</label>
              <select value={form.coinId} onChange={(e) => setForm((f) => ({ ...f, coinId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }}>
                {coins.map((c) => <option key={c.id} value={c.id} style={{ background: "#0d1322" }}>{c.symbol} – {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>CONDITION</label>
              <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as "above" | "below" }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }}>
                <option value="above" style={{ background: "#0d1322" }}>Goes above</option>
                <option value="below" style={{ background: "#0d1322" }}>Goes below</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>TARGET ($)</label>
              <input type="number" value={form.targetPrice} onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))} placeholder="70000"
                className="w-full px-3 py-2.5 rounded-xl text-sm mono outline-none placeholder:text-white/30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>EMAIL</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-white/30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }} />
            </div>
          </div>
          <button onClick={handleCreate} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "var(--cyan)", color: "#05070d" }}>Create Alert</button>
        </div>
      )}

      {active.length > 0 && (
        <Section title="ACTIVE ALERTS" color="var(--cyan)">
          {active.map((a) => {
            const c = coinMap.get(a.coinId);
            const diff = c ? ((a.targetPrice - c.price) / c.price) * 100 : 0;
            return (
              <div key={a.id} className="dc-card flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {c && <CoinIcon coin={c} size={36} />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {a.coinId.toUpperCase()} <span style={{ color: "var(--muted)" }}>goes</span>{" "}
                      <span style={{ color: a.condition === "above" ? "var(--cyan)" : "var(--pink)" }}>{a.condition}</span>{" "}
                      <span className="mono font-bold">{fmt(a.targetPrice)}</span>
                    </p>
                    {c && (
                      <p className="text-xs mono mt-0.5" style={{ color: "var(--muted)" }}>
                        Current {fmt(c.price)} · {Math.abs(diff).toFixed(1)}% {diff > 0 ? "away" : "past"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs mono hidden sm:inline" style={{ color: "var(--muted)" }}>{a.email}</span>
                  <button onClick={() => toggle(a.id, false)} className="w-10 h-6 rounded-full relative" style={{ background: "var(--cyan)" }}>
                    <span className="absolute top-0.5 left-[18px] w-5 h-5 rounded-full bg-white" />
                  </button>
                  <button onClick={() => del(a.id)}><Trash2 size={15} style={{ color: "rgba(255,45,123,0.5)" }} /></button>
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {triggered.length > 0 && (
        <Section title="TRIGGERED" color="var(--gold)">
          {triggered.map((a) => (
            <div key={a.id} className="dc-card flex items-center justify-between px-4 py-3.5" style={{ background: "rgba(255,214,102,0.05)" }}>
              <div className="flex items-center gap-3">
                <CheckCircle size={18} style={{ color: "var(--gold)" }} />
                <div>
                  <p className="text-sm font-semibold">{a.coinId.toUpperCase()} {a.condition} {fmt(a.targetPrice)}</p>
                  <p className="text-xs mono mt-0.5" style={{ color: "var(--muted)" }}>
                    Triggered {a.triggeredAt ? new Date(a.triggeredAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => del(a.id)}><Trash2 size={15} style={{ color: "rgba(255,45,123,0.4)" }} /></button>
            </div>
          ))}
        </Section>
      )}

      {paused.length > 0 && (
        <Section title="PAUSED" color="var(--muted)">
          {paused.map((a) => (
            <div key={a.id} className="dc-card flex items-center justify-between px-4 py-3.5 opacity-60">
              <div className="flex items-center gap-3">
                <BellOff size={16} style={{ color: "var(--muted)" }} />
                <p className="text-sm">{a.coinId.toUpperCase()} {a.condition} {fmt(a.targetPrice)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(a.id, true)} className="w-10 h-6 rounded-full relative" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white" />
                </button>
                <button onClick={() => del(a.id)}><Trash2 size={15} style={{ color: "rgba(255,45,123,0.4)" }} /></button>
              </div>
            </div>
          ))}
        </Section>
      )}

      {alerts.length === 0 && (
        <div className="dc-card flex flex-col items-center justify-center py-16 gap-3">
          <Bell size={40} style={{ color: "rgba(255,255,255,0.12)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>No alerts yet</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--cyan-soft)", color: "var(--cyan)" }}>Create your first alert</button>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-widest mb-2" style={{ color }}>{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
