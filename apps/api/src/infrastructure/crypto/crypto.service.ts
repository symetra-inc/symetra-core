import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  // A chave de 32 bytes (256 bits) tem de estar no .env como SYMETRA_ENCRYPTION_KEY
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = process.env.SYMETRA_ENCRYPTION_KEY as string;

  constructor() {
    if (!this.key || this.key.length !== 32) {
      throw new InternalServerErrorException('Falta a chave AES-256 no .env (SYMETRA_ENCRYPTION_KEY). Deve ter 32 caracteres.');
    }
  }

  /**
   * Encripta texto (ex: CPF) antes de guardar na base de dados (Prisma)
   */
  encrypt(plainText: string): string | null {
    if (!plainText) return null;

    // O IV (Initialization Vector) garante que o mesmo CPF gere hashes diferentes
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Guardamos o IV, o AuthTag e o conteúdo encriptado separados por ':'
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Desencripta o texto apenas quando for estritamente necessário (ex: Enviar para o Asaas)
   */
  decrypt(encryptedText: string): string | null {
    if (!encryptedText) return null;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) throw new Error('Formato encriptado inválido');

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedData = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('ALERTA DE SEGURANÇA: Falha ao desencriptar dado sensível.', error.message);
      return null;
    }
  }
}
