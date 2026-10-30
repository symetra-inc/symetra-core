import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { THEME_COOKIE } from "./theme";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Segunda trava além do middleware: sem sessão válida, nada do painel é renderizado.
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Claro é o padrão; o escuro fica como opção no cabeçalho.
  const dark = (await cookies()).get(THEME_COOKIE)?.value === "dark";

  return (
    <div className={`${dark ? "" : "theme-light"} min-h-screen flex bg-ink text-linen`}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <Header dark={dark} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
