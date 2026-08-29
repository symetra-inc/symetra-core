import { auth } from "@/auth";
import { getPatients } from "@/lib/api";
import { PatientsTable } from "./PatientsTable";

export default async function PacientesPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  const patients = clinicId ? await getPatients(clinicId) : [];

  const sorted = [...patients].sort((a, b) => {
    const dateA = a.appointments[0]?.scheduledAt ?? a.createdAt;
    const dateB = b.appointments[0]?.scheduledAt ?? b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="max-w-[1160px] mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-[28px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
            <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
              Pacientes
            </span>
          </div>
          <h1 className="font-display font-bold text-linen text-[2rem] tracking-[-0.025em] leading-none">
            Base de Pacientes
          </h1>
        </div>
        <span className="font-data text-[10px] text-ash border border-[rgba(156,142,130,0.18)] rounded-full px-3 py-1 self-start mt-1">
          {sorted.length} registros
        </span>
      </div>

      <PatientsTable patients={sorted} />
    </div>
  );
}
