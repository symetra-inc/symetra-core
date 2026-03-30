import { LogOut } from "lucide-react";
import { signOut } from "@/auth";

interface HeaderProps {
  clinicName?: string;
}

export function Header({ clinicName = "Clínica Dra. Silva" }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Bem-vinda,</span>
        <span className="text-sm font-semibold text-white tracking-tight">{clinicName}</span>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-2 px-3 py-1.5 border border-white/[0.08] rounded-xl text-xs font-medium text-zinc-400 hover:border-red-500/20 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </form>
    </header>
  );
}
