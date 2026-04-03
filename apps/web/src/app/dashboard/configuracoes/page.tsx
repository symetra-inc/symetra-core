import { Settings } from "lucide-react";
import { auth } from "@/auth";
import { getClinic } from "@/lib/api";
import { ClinicSettingsForm } from "./ClinicSettingsForm";

export default async function ConfiguracoesPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-zinc-600 text-sm">
        Nenhuma clínica vinculada a esta conta.
      </div>
    );
  }

  const clinic = await getClinic(clinicId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-zinc-400" />
        <div>
          <h2 className="text-lg font-semibold text-white">Configurações</h2>
          <p className="text-xs text-zinc-500">Dados da clínica e integração</p>
        </div>
      </div>

      <ClinicSettingsForm clinic={clinic} />
    </div>
  );
}
