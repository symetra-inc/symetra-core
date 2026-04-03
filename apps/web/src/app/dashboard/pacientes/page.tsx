import { Users } from "lucide-react";
import { auth } from "@/auth";
import { getPatients } from "@/lib/api";
import { PatientsTable } from "./PatientsTable";

export default async function PacientesPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  const patients = clinicId ? await getPatients(clinicId) : [];

  // Ordena por data do último agendamento (mais recente primeiro)
  const sorted = [...patients].sort((a, b) => {
    const dateA = a.appointments[0]?.scheduledAt ?? a.createdAt;
    const dateB = b.appointments[0]?.scheduledAt ?? b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-zinc-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Pacientes</h2>
            <p className="text-xs text-zinc-500">Lista de pacientes cadastrados</p>
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-500 border border-white/[0.06] rounded-xl px-3 py-1">
          {sorted.length} registros
        </span>
      </div>

      <PatientsTable patients={sorted} />
    </div>
  );
}
