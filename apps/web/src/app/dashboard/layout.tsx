import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-zinc-950 text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)]">
          {children}
        </main>
      </div>
    </div>
  );
}
