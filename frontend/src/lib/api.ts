import { supabase } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const sendChatMessage = async (messages: ChatMessage[]): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("No active session");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (response.status === 429) throw new Error("rate_limit_exceeded");
  if (!response.ok) throw new Error("Failed to get reply");

  const data = await response.json();
  return data.reply;
};

export const deleteAccount = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("No active session");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/user`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to delete account");
};
