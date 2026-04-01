import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando injeção de dados do Symetra Protocol...');

  const passwordHash = await bcrypt.hash('symetra123', 10);

  // 1. Cria a Agência Parceira
  const agency = await prisma.agency.create({
    data: {
      name: 'Agência V8',
      tier: 'SILVER',
    },
  });

  // 2. Cria a Clínica (Vinculada à Agência)
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Instituto Facial',
      whatsapp_number_id: '5511999999999', // Fictício
      agency_id: agency.id,
    },
  });

  // 3. Cria o CEO (Sem vínculo, ele vê tudo)
  const admin = await prisma.user.create({
    data: {
      email: 'ceo@symetra.com',
      name: 'Guilherme (CEO)',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // 4. Cria o Usuário da Agência (Vinculado à Agência V8)
  const agencyUser = await prisma.user.create({
    data: {
      email: 'contato@agenciav8.com',
      name: 'Diretor V8',
      passwordHash,
      role: 'AGENCY',
      agency_id: agency.id,
    },
  });

  // 5. Cria o Usuário da Clínica (Vinculado ao Instituto Facial)
  const clinicUser = await prisma.user.create({
    data: {
      email: 'dr@institutofacial.com',
      name: 'Dr. Roberto',
      passwordHash,
      role: 'CLINIC',
      clinic_id: clinic.id,
    },
  });

  console.log('✅ Cofre abastecido com sucesso e Entidades Relacionadas!');
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Agência: ${agencyUser.email}`);
  console.log(`- Clínica: ${clinicUser.email}`);
  console.log('Senha padrão para todos: symetra123');
}

main()
  .catch((e) => {
    console.error('❌ Erro na injeção:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });