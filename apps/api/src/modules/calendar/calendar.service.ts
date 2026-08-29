import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { format } from 'date-fns';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getOAuth2Client() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
    return oauth2Client;
  }

  async getAvailableSlots(dateFrom: string, dateTo: string, durationMinutes = 60): Promise<string[]> {
    this.logger.log(`[CALENDAR] Consultando disponibilidade de ${dateFrom} até ${dateTo} (duração: ${durationMinutes}min)`);

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      this.logger.warn('[CALENDAR] Credenciais OAuth2 ausentes. Retornando Mock.');
      return ['2026-04-31 10:00', '2026-04-31 14:00', '2026-05-01 09:00'];
    }

    try {
      const auth = this.getOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth });

      const eventsResponse = await calendar.events.list({
        calendarId,
        timeMin: dateFrom,
        timeMax: dateTo,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = eventsResponse.data.items || [];
      this.logger.log(`[CALENDAR] ${events.length} evento(s) encontrado(s) no período.`);

      // Slots ocupados por eventos do Google Calendar
      const busyIntervals = events
        .filter(e => e.start?.dateTime && e.end?.dateTime)
        .map(e => ({
          start: new Date(e.start!.dateTime!),
          end: new Date(e.end!.dateTime!),
        }));

      // Estende o início da query para capturar agendamentos que começaram antes
      // de dateFrom mas se estendem para dentro do período
      const extendedFrom = new Date(new Date(dateFrom).getTime() - 8 * 60 * 60 * 1000);

      // Slots travados por Appointments PENDING (com lock ativo) ou PAID
      const pendingAppointments = await this.prisma.appointment.findMany({
        where: {
          scheduledAt: {
            gte: extendedFrom,
            lte: new Date(dateTo),
          },
          OR: [
            { status: 'PENDING', lockedUntil: { gt: new Date() } },
            { status: 'PAID' },
          ],
        },
        select: { scheduledAt: true, durationMinutes: true },
      });

      const pendingLocks = pendingAppointments.map(a => ({
        start: a.scheduledAt,
        end: new Date(a.scheduledAt.getTime() + (a.durationMinutes ?? 60) * 60 * 1000),
      }));

      this.logger.log(`[CALENDAR] ${pendingLocks.length} slot(s) bloqueado(s) por agendamentos.`);

      const allBusy = [...busyIntervals, ...pendingLocks];
      const durationMs = durationMinutes * 60 * 1000;

      // Gera slots disponíveis com granularidade de 1h
      const availableSlots: string[] = [];
      const windowStart = new Date(dateFrom);
      const windowEnd = new Date(dateTo);

      const cursor = new Date(windowStart);
      cursor.setHours(0, 0, 0, 0);

      while (cursor <= windowEnd) {
        for (let hour = 9; hour < 18; hour++) {
          const slotStart = new Date(cursor);
          slotStart.setHours(hour, 0, 0, 0);

          const slotEnd = new Date(slotStart.getTime() + durationMs);

          // Slot fora da janela de busca ou ultrapassa 18h
          if (slotStart < windowStart || slotStart >= windowEnd) continue;
          if (slotEnd > new Date(new Date(cursor).setHours(18, 0, 0, 0))) continue;

          const isBusy = allBusy.some(
            busy => slotStart < busy.end && slotEnd > busy.start,
          );

          if (!isBusy) {
            availableSlots.push(format(slotStart, 'yyyy-MM-dd HH:mm'));
          }
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      this.logger.log(`[CALENDAR] ${availableSlots.length} horário(s) livre(s) encontrado(s).`);
      return availableSlots;
    } catch (error) {
      this.logger.error(`[CALENDAR] Falha ao consultar Google Calendar: ${error.message}`);
      return [];
    }
  }

  /**
   * Cria um evento no Google Calendar para o agendamento confirmado.
   * Retorna o eventId para persistir no Appointment.
   */
  async createEvent(appointment: {
    patientName: string;
    patientPhone: string;
    procedureName: string;
    scheduledAt: Date;
    durationMinutes?: number;
  }): Promise<string | null> {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      this.logger.warn('[CALENDAR] Credenciais OAuth2 ausentes. Evento não criado.');
      return null;
    }

    try {
      const auth = this.getOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth });

      const startTime = appointment.scheduledAt;

      // Coerção explícita: protege contra null (appointments antigos) e serialização como string
      const rawDuration = appointment.durationMinutes;
      const durationMinutes = Number(rawDuration) || 60;
      if (!rawDuration) {
        this.logger.warn(
          `[CALENDAR] durationMinutes ausente para ${appointment.patientName}/${appointment.procedureName} — usando fallback 60min`,
        );
      }

      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `${appointment.patientName} - ${appointment.procedureName}`,
          description: `Telefone: ${appointment.patientPhone}`,
          start: { dateTime: startTime.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: endTime.toISOString(), timeZone: 'America/Sao_Paulo' },
        },
      });

      const eventId = response.data.id ?? null;
      this.logger.log(`[CALENDAR] Evento criado: ${eventId} para ${appointment.patientName}`);
      return eventId;
    } catch (error) {
      this.logger.error(`[CALENDAR] Falha ao criar evento: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove um evento do Google Calendar pelo eventId.
   * Idempotente: não lança erro se o evento não existir.
   */
  async deleteEvent(eventId: string): Promise<void> {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      this.logger.warn('[CALENDAR] Credenciais OAuth2 ausentes. Evento não removido.');
      return;
    }

    try {
      const auth = this.getOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({ calendarId, eventId });
      this.logger.log(`[CALENDAR] Evento ${eventId} removido.`);
    } catch (error) {
      // 410 Gone = já deletado, 404 = não existe — ambos são OK
      if (error.code === 410 || error.code === 404) {
        this.logger.warn(`[CALENDAR] Evento ${eventId} não encontrado (já deletado). Ignorando.`);
        return;
      }
      this.logger.error(`[CALENDAR] Falha ao deletar evento ${eventId}: ${error.message}`);
    }
  }
}
