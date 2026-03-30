import { getPatients } from "./actions";
import { ChatClient } from "./_components/chat-client";

export const dynamic = "force-dynamic"; // Nunca cacheia — dados do DB sempre frescos

export default async function ChatPage() {
  const patients = await getPatients();
  return <ChatClient initialPatients={patients} />;
}
