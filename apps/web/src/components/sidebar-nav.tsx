"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, Settings, MessageSquare } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Visão Geral", exact: true },
  { href: "/dashboard/chat", icon: MessageSquare, label: "Inbox" },
  { href: "/dashboard/agendamentos", icon: Calendar, label: "Agendamentos" },
  { href: "/dashboard/pacientes", icon: Users, label: "Pacientes" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-5 space-y-0.5">
      {navItems.map(({ href, icon: Icon, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-white/[0.08] text-white"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : ""}`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
