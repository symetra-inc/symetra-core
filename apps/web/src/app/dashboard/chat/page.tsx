import { getPatients } from "./actions";
import { ChatClient } from "./_components/chat-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { patientId } = await searchParams;
  const patients = await getPatients();
  return <ChatClient initialPatients={patients} initialPatientId={patientId ?? null} />;
}
