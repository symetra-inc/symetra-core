import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3';

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

  async createPixCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const {
      clinicId,
      patientId,
      patientName,
      patientCpf,
      patientPhone,
      procedure,
      scheduledAt,
      asaasApiKey,
      reservationFee,
    } = input;

    // Blindagem da chave — falha explícita antes de qualquer chamada HTTP
    if (!asaasApiKey || asaasApiKey.trim() === '') {
      throw new Error('API Key do Asaas ausente na Clínica');
    }

    const sanitizedKey = asaasApiKey.trim();
    const headers = { access_token: sanitizedKey };

    // 1. Verificar/Criar Customer no Asaas (com CPF)
    const customerId = await this.findOrCreateCustomer(patientName, patientPhone, patientCpf, headers);

    // 2. Criar Payment (PIX)
    const today = new Date().toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let paymentRes: { data: any };
    try {
      paymentRes = await axios.post(
        `${ASAAS_BASE_URL}/payments`,
        {
          customer: customerId,
          billingType: 'PIX',
          value: reservationFee,
          dueDate: today,
          description: `Reserva de Horário - ${procedure}`,
          externalReference: `${clinicId}:${patientId}`,
        },
        { headers },
      );
    } catch (error) {
      const errorDetails = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      this.logger.error(`[ASAAS] Erro ao criar Payment: ${errorDetails}`);
      throw error;
    }

    const asaasInvoiceId: string = paymentRes.data.id;
    this.logger.log(`[ASAAS] Payment criado: ${asaasInvoiceId}`);

    // 3. Obter Pix Copia e Cola
    const qrCodeRes = await axios.get(
      `${ASAAS_BASE_URL}/payments/${asaasInvoiceId}/pixQrCode`,
      { headers },
    );
    const pixCode: string = qrCodeRes.data.payload;

    if (!pixCode) {
      throw new Error(`Asaas não retornou o payload do Pix para o pagamento ${asaasInvoiceId}`);
    }

    this.logger.log(`[ASAAS] Pix Copia e Cola obtido para ${asaasInvoiceId}`);

    // 4. Salvar Agendamento no banco com trava de 15 minutos
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

  private async findOrCreateCustomer(
    name: string,
    phone: string,
    cpf: string,
    headers: Record<string, string>,
  ): Promise<string> {
    try {
      const searchRes = await axios.get(`${ASAAS_BASE_URL}/customers`, {
        headers,
        params: { mobilePhone: phone },
      });

      const existing = searchRes.data?.data;
      if (Array.isArray(existing) && existing.length > 0) {
        const existingId = existing[0].id as string;
        this.logger.log(`[ASAAS] Customer existente encontrado: ${existingId}`);

        // Atualiza o CPF no registo existente antes de gerar o Pix
        if (cpf) {
          try {
            await axios.post(
              `${ASAAS_BASE_URL}/customers/${existingId}`,
              { cpfCnpj: cpf },
              { headers },
            );
            this.logger.log(`[ASAAS] CPF actualizado no Customer ${existingId}`);
          } catch (updateError) {
            const errorDetails = updateError.response?.data
              ? JSON.stringify(updateError.response.data)
              : updateError.message;
            this.logger.error(`[ASAAS] Erro ao actualizar CPF do Customer ${existingId}: ${errorDetails}`);
            throw updateError;
          }
        }

        return existingId;
      }
    } catch {
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
      const errorDetails = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      this.logger.error(`[ASAAS] Erro ao criar Customer (CPF possivelmente inválido): ${errorDetails}`);
      throw error;
    }
  }
}
