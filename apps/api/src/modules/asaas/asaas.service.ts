import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL;


export interface PixChargeInput {
  clinicId: string;
  patientId: string;
  patientName: string;
  patientCpf: string;
  patientPhone: string;
  procedure: string;
  scheduledAt: Date;
  asaasApiKey: string;
  reservationFee: number;
}

export interface PixChargeResult {
  pixCode: string;
  appointmentId: string;
  asaasInvoiceId: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── PUBLIC API ──────────────────────────────────────────────────────────────

  async findOrCreateCustomer(cpf: string, name: string, phone: string, asaasApiKey: string): Promise<string> {
    const headers = { access_token: asaasApiKey };

    try {
      const searchRes = await axios.get(`${ASAAS_BASE_URL}/customers`, {
        headers,
        params: { mobilePhone: phone },
      });

      const existing = searchRes.data?.data;
      if (Array.isArray(existing) && existing.length > 0) {
        const existingId = existing[0].id as string;
        this.logger.log(`[ASAAS] Customer existente encontrado: ${existingId}`);

        if (cpf) {
          try {
            await axios.post(`${ASAAS_BASE_URL}/customers/${existingId}`, { cpfCnpj: cpf }, { headers });
            this.logger.log(`[ASAAS] CPF actualizado no Customer ${existingId}`);
          } catch (updateError) {
            const details = this.extractErrorDetails(updateError);
            this.logger.error(`[ASAAS] Erro ao actualizar CPF do Customer ${existingId}: ${details}`);
            throw new HttpException(
              `Asaas: falha ao atualizar CPF — ${details}`,
              updateError.response?.status ?? HttpStatus.BAD_GATEWAY,
            );
          }
        }

        return existingId;
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // search failed — proceed to create
    }

    try {
      const createRes = await axios.post(
        `${ASAAS_BASE_URL}/customers`,
        { name, mobilePhone: phone, cpfCnpj: cpf },
        { headers },
      );
      this.logger.log(`[ASAAS] Novo Customer criado: ${createRes.data.id}`);
      return createRes.data.id as string;
    } catch (error) {
      const details = this.extractErrorDetails(error);
      this.logger.error(`[ASAAS] Erro ao criar Customer (CPF possivelmente inválido): ${details}`);
      throw new HttpException(
        `Asaas: falha ao criar customer — ${details}`,
        error.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async createPayment(
    customerId: string,
    value: number,
    asaasApiKey: string,
    options?: { dueDate?: string; description?: string; externalReference?: string },
  ): Promise<string> {
    const headers = { access_token: asaasApiKey };
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = options?.dueDate ?? tomorrow.toISOString().split('T')[0];

    try {
      const paymentRes = await axios.post(
        `${ASAAS_BASE_URL}/payments`,
        {
          customer: customerId,
          billingType: 'PIX',
          value,
          dueDate,
          ...(options?.description && { description: options.description }),
          ...(options?.externalReference && { externalReference: options.externalReference }),
        },
        { headers },
      );
      const paymentId = paymentRes.data.id as string;
      this.logger.log(`[ASAAS] Payment criado: ${paymentId}`);
      return paymentId;
    } catch (error) {
      const details = this.extractErrorDetails(error);
      this.logger.error(`[ASAAS] Erro ao criar Payment: ${details}`);
      throw new HttpException(
        `Asaas: falha ao criar payment — ${details}`,
        error.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getPix(paymentId: string, asaasApiKey: string): Promise<string> {
    const headers = { access_token: asaasApiKey };
    try {
      const qrCodeRes = await axios.get(`${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, { headers });
      const pixCode = qrCodeRes.data.payload as string;
      if (!pixCode) {
        throw new HttpException(
          `Asaas não retornou o payload do Pix para o pagamento ${paymentId}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      this.logger.log(`[ASAAS] Pix Copia e Cola obtido para ${paymentId}`);
      return pixCode;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const details = this.extractErrorDetails(error);
      this.logger.error(`[ASAAS] Erro ao obter Pix QR Code: ${details}`);
      throw new HttpException(
        `Asaas: falha ao obter pixQrCode — ${details}`,
        error.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── HIGH-LEVEL COMPOSITE (usado pela Serena) ────────────────────────────────

  async deletePayment(paymentId: string, asaasApiKey: string): Promise<void> {
    const headers = { access_token: asaasApiKey.trim() };
    try {
      await axios.delete(`${ASAAS_BASE_URL}/payments/${paymentId}`, { headers });
      this.logger.log(`[ASAAS] Payment ${paymentId} deletado com sucesso.`);
    } catch (error) {
      const details = this.extractErrorDetails(error);

      if (error.response?.status === 404) {
        this.logger.log(`[ASAAS] Payment ${paymentId} já deletado.`);
        return;
      }

      if (error.response?.status === 400) {
        this.logger.warn(`[ASAAS] Payment ${paymentId} não pôde ser deletado (estado incompatível): ${details}`);
        return;
      }

      this.logger.error(`[ASAAS] Erro ao deletar Payment ${paymentId}: ${details}`);
      throw new HttpException(
        `Asaas: falha ao deletar payment — ${details}`,
        error.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async createPixCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const {
      clinicId, patientId, patientName, patientCpf, patientPhone,
      procedure, scheduledAt, asaasApiKey, reservationFee,
    } = input;

    if (!asaasApiKey || asaasApiKey.trim() === '') {
      throw new HttpException('API Key do Asaas ausente na Clínica', HttpStatus.BAD_REQUEST);
    }

    const sanitizedKey = asaasApiKey.trim();

    const customerId = await this.findOrCreateCustomer(patientCpf, patientName, patientPhone, sanitizedKey);

    const asaasInvoiceId = await this.createPayment(customerId, reservationFee, sanitizedKey, {
      description: `Reserva de Horário - ${procedure}`,
      externalReference: `${clinicId}:${patientId}`,
    });

    const pixCode = await this.getPix(asaasInvoiceId, sanitizedKey);

    // Salvar Agendamento no banco com trava de 15 minutos
    const appointment = await this.prisma.appointment.create({
      data: {
        clinicId,
        patientId,
        procedureName: procedure,
        scheduledAt,
        status: 'PENDING',
        lockedUntil: new Date(Date.now() + 15 * 60_000),
        asaasInvoiceId,
      },
    });

    this.logger.log(`[DB] Agendamento ${appointment.id} criado — status: PENDING, expira: ${appointment.lockedUntil}`);

    return { pixCode, appointmentId: appointment.id, asaasInvoiceId };
  }

  // ── PRIVATE HELPERS ─────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractErrorDetails(error: any): string {
    return error.response?.data ? JSON.stringify(error.response.data) : error.message;
  }
}
