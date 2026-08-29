"use client";

import type { AppointmentResponse } from "@/lib/api";

// 1 pixel = 1 minute, base hour height = 60px
const PX_PER_MINUTE = 1;
const HOUR_HEIGHT_PX = 60;
const GRID_START_HOUR = 8;

export interface AgendaAppointment extends AppointmentResponse {
  scheduledAt: string; // ISO string
}

interface Props {
  appointment: AgendaAppointment;
  onClick: (a: AgendaAppointment) => void;
}

export function AppointmentBlock({ appointment, onClick }: Props) {
  const date = new Date(appointment.scheduledAt);
  const minutesFromGridStart =
    (date.getHours() - GRID_START_HOUR) * 60 + date.getMinutes();

  // Height in pixels reflects duration; min 24px so very short slots are still readable
  const heightPx = Math.max(appointment.durationMinutes * PX_PER_MINUTE, 24);
  const topPx = minutesFromGridStart * PX_PER_MINUTE;

  const timeLabel = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      onClick={() => onClick(appointment)}
      title={`${appointment.patient.name} — ${appointment.procedureName}`}
      style={{ top: topPx, height: heightPx }}
      className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 text-left overflow-hidden
        bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-colors
        group cursor-pointer z-10"
    >
      <p className="text-[10px] font-semibold text-amber-300 leading-tight truncate">
        {appointment.patient.name}
      </p>
      {heightPx >= 36 && (
        <p className="text-[9px] text-amber-400/70 truncate leading-tight mt-0.5">
          {appointment.procedureName}
        </p>
      )}
      {heightPx >= 48 && (
        <p className="text-[9px] font-mono text-amber-500/60 leading-tight mt-0.5">
          {timeLabel}
        </p>
      )}
    </button>
  );
}

export { HOUR_HEIGHT_PX, GRID_START_HOUR, PX_PER_MINUTE };
