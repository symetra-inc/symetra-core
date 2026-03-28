import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";
import { signOut } from "@/auth";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500"] });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen flex bg-[#0A0A0A] text-[#FAFAFA] ${inter.className}`}>
      
      {/* SIDEBAR (Barra Lateral) */}
      <aside className="w-64 border-r border-[#71717A]/30 bg-[#0A0A0A] flex flex-col">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-[#71717A]/30">
          <div className="w-8 h-8 border border-[#71717A] rounded-sm flex items-center justify-center bg-[#0A0A0A] mr-3">
            <span className={`text-[#FAFAFA] font-bold text-xl leading-none ${playfair.className}`}>S</span>
          </div>
          <span className="font-semibold tracking-widest text-xs uppercase text-[#FAFAFA]">Symetra</span>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-sm bg-[#FAFAFA]/10 text-[#FAFAFA] transition-colors text-sm font-medium">
            <LayoutDashboard className="w-4 h-4 text-[#A38A5E]" />
            Visão Geral
          </Link>
          {/*   
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-sm text-[#71717A] hover:bg-[#FAFAFA]/5 hover:text-[#FAFAFA] transition-colors text-sm font-medium">
            <Users className="w-4 h-4" />
            Leads Triados
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-sm text-[#71717A] hover:bg-[#FAFAFA]/5 hover:text-[#FAFAFA] transition-colors text-sm font-medium">
            <Settings className="w-4 h-4" />
            Configurações
          </Link>
          */}
        </nav>

        {/* User Area */}
        <div className="p-4 border-t border-[#71717A]/30">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-sm bg-[#27272A] flex items-center justify-center text-xs font-bold text-[#A38A5E]">
              DR
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Dr. Roberto</p>
              <p className="text-xs text-[#71717A] truncate">dr@clinica.com</p>
            </div>
          </div>
<form 
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }} 
            className="mt-2"
          >
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-[#71717A] hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" />
              Desconectar
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Superior */}
        <header className="h-20 border-b border-[#71717A]/30 flex items-center px-8 bg-[#0A0A0A]">
          <h1 className={`text-2xl text-[#FAFAFA] ${playfair.className}`}>Inteligência de Receita</h1>
        </header>
        
        {/* Área onde as páginas são injetadas */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA]/[0.02]">
          {children}
        </div>
      </main>

    </div>
  );
}