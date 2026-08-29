import { auth } from "@/auth";
import { getClinic } from "@/lib/api";
import { ClinicSettingsForm } from "./ClinicSettingsForm";

export default async function ConfiguracoesPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-data text-[11px] text-ash tracking-[0.1em] uppercase">
          Nenhuma clínica vinculada a esta conta
        </p>
      </div>
    );
  }

  const clinic = await getClinic(clinicId);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-[28px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
          <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
            Configurações
          </span>
        </div>
        <h1 className="font-display font-bold text-linen text-[2rem] tracking-[-0.025em] leading-none">
          Dados da Clínica
        </h1>
        <p className="font-ui text-[12px] text-ash mt-1">Identidade, Serena e catálogo de procedimentos</p>
      </div>

      <ClinicSettingsForm clinic={clinic} />
    </div>
  );
}
