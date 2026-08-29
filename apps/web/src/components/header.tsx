import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";

export async function Header() {
  const session = await auth();
  const name = session?.user?.name ?? "Operador";

  return (
    <header className="h-14 border-b border-[rgba(156,142,130,0.12)] bg-ink/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="font-data text-[10px] text-ash tracking-[0.12em] uppercase">
          {name}
        </span>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(156,142,130,0.18)] rounded-[3px] font-ui text-[12px] text-ash hover:border-[rgba(156,142,130,0.4)] hover:text-linen transition-all duration-200"
        >
          <LogOut className="w-3 h-3" />
          Sair
        </button>
      </form>
    </header>
  );
}
