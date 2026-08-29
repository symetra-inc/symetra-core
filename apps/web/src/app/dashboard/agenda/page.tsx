import { auth } from "@/auth";
import { getAppointments } from "@/lib/api";
import { WeeklyCalendar } from "@/components/agenda/WeeklyCalendar";

function getWeekSundayUTC(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().split("T")[0];
}

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const { week } = await searchParams;

  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-data text-[11px] text-ash tracking-[0.1em] uppercase">
          Sem clínica vinculada
        </p>
      </div>
    );
  }

  const weekStartStr = week ?? getWeekSundayUTC(new Date());
  const [year, month, day] = weekStartStr.split("-").map(Number);
  const weekStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  weekEndDate.setUTCHours(23, 59, 59, 999);

  const all = await getAppointments(clinicId, {
    startDate: weekStartDate.toISOString(),
    endDate: weekEndDate.toISOString(),
  });
  const appointments = all.filter(
    (a) => a.status === "PAID" || a.status === "COMPLETED",
  );

  return (
    <div className="max-w-[1160px] mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-[28px] h-[0.5px] bg-[rgba(197,160,89,0.5)]" />
          <span className="font-data text-[9px] text-[rgba(197,160,89,0.65)] tracking-[0.2em] uppercase">
            Agenda
          </span>
        </div>
        <h1 className="font-display font-bold text-linen text-[2rem] tracking-[-0.025em] leading-none">
          Agenda Semanal
        </h1>
        <p className="font-ui text-[12px] text-ash mt-1">Pix confirmados e concluídos</p>
      </div>

      <WeeklyCalendar
        appointments={appointments}
        weekStart={weekStartDate.toISOString()}
      />
    </div>
  );
}
