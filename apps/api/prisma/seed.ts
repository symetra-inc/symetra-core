import { PrismaClient, UserRole, PersonaType } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Symetra123", 10);

  // 1. Agência
  const agency = await prisma.agency.create({
    data: {
      name: "Agência Demo",
      cnpj: "12345678000100",
      commissionRate: 0.2,
    },
  });

  // 2. Clínica (vinculada à agência)
  const clinic = await prisma.clinic.create({
    data: {
      agencyId: agency.id,
      name: "Clínica Demo",
      doctorName: "Dr. João Silva",
      whatsappNumberId: "997298506807975",
      asaasApiKey:
        "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmViNjM5ZDg4LWZkMTQtNGE2NC05YmIwLWFjNWQ5MmY0OWFkYzo6JGFhY2hfZTI0NTkwM2ItNTBmZC00YjU4LWE4YzgtNzA0MGIxOWY0Mjlh",
      persona: PersonaType.SOFISTICADA,
      knowledgeBase: "Base de conhecimento da clínica demo para testes.",
      catalog: {
        procedures: [
          { name: "Botox", price: 1200 },
          { name: "Preenchimento Labial", price: 2500 },
          { name: "Limpeza de Pele", price: 350 },
        ],
      },
      reservationFee: 100.0,
      receptionistPhone: "5511999999999",
      receptionistName: "Maria",
    },
  });

  // 3. Usuários — um de cada role
  const users = [
    {
      name: "Master Symetra",
      email: "master@email.com",
      role: UserRole.MASTER,
      clinicId: null,
      agencyId: null,
    },
    {
      name: "Admin Agência",
      email: "agencia@email.com",
      role: UserRole.AGENCY_ADMIN,
      clinicId: null,
      agencyId: agency.id,
    },
    {
      name: "Admin Clínica",
      email: "clinica@email.com",
      role: UserRole.CLINIC_ADMIN,
      clinicId: clinic.id,
      agencyId: null,
    },
    {
      name: "Recepcionista",
      email: "recepcionista@email.com",
      role: UserRole.RECEPTIONIST,
      clinicId: clinic.id,
      agencyId: null,
    },
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        role: u.role,
        clinicId: u.clinicId,
        agencyId: u.agencyId,
      },
    });
  }

  console.log("✅ Seed concluído!");
  console.log(`   Agência:  ${agency.id}`);
  console.log(`   Clínica:  ${clinic.id}`);
  console.log(`   Usuários: master | agencia | clinica | recepcionista`);
  console.log(`   Senha:    Symetra123`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());