import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { format } from 'date-fns';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  /**
   * Consulta os horários livres na agenda do Google Calendar.
   * Horário de atendimento: 09:00 às 18:00, slots de 1 hora.
   * Credenciais via Service Account (GOOGLE_CREDENTIALS_PATH).
   */
  async getAvailableSlots(dateFrom: string, dateTo: string): Promise<string[]> {
    this.logger.log(`[CALENDAR] Consultando disponibilidade de ${dateFrom} até ${dateTo}`);

    try {
      const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;

      if (!credentialsPath || !calendarId) {
        this.logger.warn('[CALENDAR] Sem credenciais. Retornando Mock.');
        // O Bypass real vai aqui!
        return [
          '2026-03-31 10:00', 
          '2026-03-31 14:00', 
          '2026-04-01 09:00'
        ];
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });

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

      // Monta os intervalos ocupados
      const busyIntervals = events
        .filter(e => e.start?.dateTime && e.end?.dateTime)
        .map(e => ({
          start: new Date(e.start!.dateTime!),
          end: new Date(e.end!.dateTime!),
        }));

      // Itera dia a dia e gera slots das 09:00 às 17:00 (último slot termina às 18:00)
      const availableSlots: string[] = [];
      const windowStart = new Date(dateFrom);
      const windowEnd = new Date(dateTo);

      const cursor = new Date(windowStart);
      cursor.setHours(0, 0, 0, 0);

      while (cursor <= windowEnd) {
        for (let hour = 9; hour < 18; hour++) {
          const slotStart = new Date(cursor);
          slotStart.setHours(hour, 0, 0, 0);

          const slotEnd = new Date(cursor);
          slotEnd.setHours(hour + 1, 0, 0, 0);

          // Ignora slots fora da janela solicitada
          if (slotStart < windowStart || slotStart >= windowEnd) continue;

          // Verifica sobreposição com eventos existentes
          const isBusy = busyIntervals.some(
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
}
