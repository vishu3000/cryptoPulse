import TopNav from "@/components/TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopNav />
      <div className="max-w-[1600px] mx-auto px-5 py-5">{children}</div>
    </div>
  );
}
