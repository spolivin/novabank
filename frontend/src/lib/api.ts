import { supabase } from "@/lib/supabase";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export const fetchChatHistory = async (): Promise<HistoryMessage[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("No active session");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/history`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
};

export const sendChatMessage = async (message: string): Promise<string> => {
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
    body: JSON.stringify({ message }),
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
