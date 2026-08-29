"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Phone, Clock, CheckCircle, Calendar } from "lucide-react";
import { AppointmentBlock, HOUR_HEIGHT_PX, GRID_START_HOUR, PX_PER_MINUTE } from "./AppointmentBlock";
import type { AgendaAppointment } from "./AppointmentBlock";

const GRID_END_HOUR = 18;
const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => GRID_START_HOUR + i,
);
const DAYS_LONG = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_LABEL: Record<string, string> = {
  PAID: "Pago",
  COMPLETED: "Concluído",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
};

const STATUS_CLASS: Record<string, string> = {
  PAID: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PENDING: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border border-red-500/20",
};

interface Props {
  appointments: AgendaAppointment[];
  /** ISO date string — Sunday of the displayed week (midnight UTC) */
  weekStart: string;
}

export function WeeklyCalendar({ appointments, weekStart }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<AgendaAppointment | null>(null);
  // On mobile we show one day at a time
  const [mobileDay, setMobileDay] = useState<number>(() => new Date().getDay());

  const weekStartDate = new Date(weekStart);

  // Build one Date per column (Sun=0 … Sat=6)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  // ── Navigation ──────────────────────────────────────────────────────────────
  function navigate(offsetDays: number) {
    const next = new Date(weekStartDate);
    next.setUTCDate(next.getUTCDate() + offsetDays);
    router.push(`/dashboard/agenda?week=${next.toISOString().split("T")[0]}`);
  }

  // ── Group appointments by day-of-week index ──────────────────────────────
  const byDay: Record<number, AgendaAppointment[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const appt of appointments) {
    const apptDate = new Date(appt.scheduledAt);
    // Match by calendar date within the week
    for (let i = 0; i < 7; i++) {
      if (
        apptDate.getUTCFullYear() === days[i].getUTCFullYear() &&
        apptDate.getUTCMonth() === days[i].getUTCMonth() &&
        apptDate.getUTCDate() === days[i].getUTCDate()
      ) {
        byDay[i].push(appt);
        break;
      }
    }
  }

  // ── Format week label ────────────────────────────────────────────────────
  const weekLabel = `${days[0].getUTCDate()} — ${days[6].getUTCDate()} de ${days[6].toLocaleString("pt-BR", { month: "long", timeZone: "UTC" })} de ${days[6].getUTCFullYear()}`;

  // ── Grid height = hours * HOUR_HEIGHT_PX ────────────────────────────────
  const gridHeight = HOURS.length * HOUR_HEIGHT_PX;

  const today = new Date();

  function isDayToday(day: Date) {
    return (
      day.getUTCFullYear() === today.getFullYear() &&
      day.getUTCMonth() === today.getMonth() &&
      day.getUTCDate() === today.getDate()
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-7)}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-zinc-300 min-w-[220px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => navigate(7)}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            aria-label="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile day navigation */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => setMobileDay((d) => Math.max(0, d - 1))}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-xs text-zinc-400 font-mono px-2">
            {DAYS_LONG[mobileDay]} {days[mobileDay].getUTCDate()}
          </span>
          <button
            onClick={() => setMobileDay((d) => Math.min(6, d + 1))}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Desktop grid ─────────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
        <div className="min-w-[720px]">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-zinc-800">
            <div className="bg-zinc-950" />
            {days.map((day, i) => (
              <div
                key={i}
                className={`py-2 px-1 text-center border-l border-zinc-800 ${
                  isDayToday(day) ? "bg-amber-500/5" : "bg-zinc-950"
                }`}
              >
                <p className="text-[10px] text-zinc-500 uppercase">{DAYS_LONG[i]}</p>
                <p
                  className={`text-sm font-semibold ${
                    isDayToday(day) ? "text-amber-400" : "text-zinc-300"
                  }`}
                >
                  {day.getUTCDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: gridHeight }}>
            {/* Hour labels column */}
            <div className="relative border-r border-zinc-800 bg-zinc-950">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-start justify-end pr-2"
                  style={{ top: (h - GRID_START_HOUR) * HOUR_HEIGHT_PX - 8 }}
                >
                  <span className="text-[10px] font-mono text-zinc-600">
                    {String(h).padStart(2, "0")}h
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, i) => (
              <div
                key={i}
                className={`relative border-l border-zinc-800 ${
                  isDayToday(day) ? "bg-amber-500/[0.02]" : "bg-zinc-950"
                }`}
              >
                {/* Hour separator lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-zinc-800/50"
                    style={{ top: (h - GRID_START_HOUR) * HOUR_HEIGHT_PX }}
                  />
                ))}

                {/* Appointment blocks */}
                {byDay[i].map((appt) => (
                  <AppointmentBlock key={appt.id} appointment={appt} onClick={setSelected} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile single-day view ────────────────────────────────────────── */}
      <div className="md:hidden rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
          <span className="text-xs text-zinc-500 uppercase">{DAYS_LONG[mobileDay]}</span>
          <span
            className={`text-sm font-semibold ${
              isDayToday(days[mobileDay]) ? "text-amber-400" : "text-zinc-300"
            }`}
          >
            {days[mobileDay].getUTCDate()}
          </span>
        </div>

        <div className="grid grid-cols-[40px_1fr]" style={{ height: gridHeight }}>
          {/* Hour labels */}
          <div className="relative border-r border-zinc-800 bg-zinc-950">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start justify-end pr-1"
                style={{ top: (h - GRID_START_HOUR) * HOUR_HEIGHT_PX - 8 }}
              >
                <span className="text-[9px] font-mono text-zinc-600">
                  {String(h).padStart(2, "0")}h
                </span>
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div className={`relative ${isDayToday(days[mobileDay]) ? "bg-amber-500/[0.02]" : "bg-zinc-950"}`}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-zinc-800/50"
                style={{ top: (h - GRID_START_HOUR) * HOUR_HEIGHT_PX }}
              />
            ))}
            {byDay[mobileDay].map((appt) => (
              <AppointmentBlock key={appt.id} appointment={appt} onClick={setSelected} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
          <Calendar className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum agendamento confirmado nesta semana.</p>
        </div>
      )}

      {/* ── Detail Sheet ─────────────────────────────────────────────────── */}
      <div
        onClick={() => setSelected(null)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          selected ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-zinc-950 border-l border-white/[0.06] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && (
          <>
            <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{selected.patient.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{selected.procedureName}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-3 shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="Telefone" value={selected.patient.whatsappPhone} mono />
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Procedimento" value={selected.procedureName} />
              <DetailRow
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Duração"
                value={`${selected.durationMinutes} min`}
                mono
              />
              <DetailRow
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Horário"
                value={new Date(selected.scheduledAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                mono
              />
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs rounded-xl font-mono font-medium ${
                      STATUS_CLASS[selected.status] ?? STATUS_CLASS.PENDING
                    }`}
                  >
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-zinc-600 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm text-zinc-200 ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
