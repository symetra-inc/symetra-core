import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="w-60 border-r border-white/[0.06] bg-zinc-900/60 backdrop-blur-xl flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center mr-3 shadow-[0_0_12px_rgba(255,255,255,0.15)]">
          <span className="text-zinc-950 font-bold text-sm leading-none">S</span>
        </div>
        <span className="font-semibold tracking-widest text-xs uppercase text-white">
          Symetra
        </span>
      </div>

      {/* Nav */}
      <SidebarNav />

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-zinc-600 tracking-widest uppercase">v1.0 · Symetra OS</p>
      </div>
    </aside>
  );
}
