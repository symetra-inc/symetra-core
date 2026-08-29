"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings, MessageSquare, Building2 } from "lucide-react";

type NavItem = { href: string; icon: React.ElementType; label: string; exact?: boolean };

const CLINIC_NAV: NavItem[] = [
  { href: "/dashboard",               icon: LayoutDashboard, label: "Visão Geral", exact: true },
  { href: "/dashboard/chat",          icon: MessageSquare,   label: "Inbox" },
  { href: "/dashboard/agenda",        icon: CalendarDays,    label: "Agenda" },
  { href: "/dashboard/pacientes",     icon: Users,           label: "Pacientes" },
  { href: "/dashboard/configuracoes", icon: Settings,        label: "Configurações" },
];

const AGENCY_NAV: NavItem[] = [
  { href: "/dashboard/agency", icon: Building2, label: "Portal do Operador", exact: true },
];

function navForRole(role: string): NavItem[] {
  if (role === "AGENCY_ADMIN") return AGENCY_NAV;
  return CLINIC_NAV;
}

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <nav className="flex-1 px-3 py-5 space-y-0.5">
      {items.map(({ href, icon: Icon, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[13px] font-ui font-medium transition-colors duration-150 ${
              isActive
                ? "bg-[rgba(197,160,89,0.10)] text-linen"
                : "text-ash hover:bg-[rgba(156,142,130,0.07)] hover:text-linen"
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? "text-gold" : "text-ash"
              }`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
