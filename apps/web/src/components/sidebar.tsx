import { auth } from "@/auth";
import { SidebarNav } from "./sidebar-nav";

export async function Sidebar() {
  const session = await auth();
  const role = session?.user?.role ?? "CLINIC_ADMIN";

  return (
    <aside className="w-56 border-r border-[rgba(156,142,130,0.12)] bg-ink2 flex flex-col shrink-0">
      {/* Wordmark */}
      <div className="h-16 flex items-center px-5 border-b border-[rgba(156,142,130,0.12)]">
        <span className="font-display font-bold text-linen text-[1.35rem] tracking-[-0.025em] leading-none">
          Syme
        </span>
        <span className="font-display italic font-light text-gold text-[1.35rem] tracking-[-0.025em] leading-none">
          tra
        </span>
      </div>

      {/* Nav */}
      <SidebarNav role={role} />

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[rgba(156,142,130,0.12)]">
        <p className="font-data text-[9px] text-ash/50 tracking-[0.2em] uppercase">
          v1.0 · Symetra OS
        </p>
      </div>
    </aside>
  );
}
