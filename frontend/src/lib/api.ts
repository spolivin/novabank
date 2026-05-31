import { supabase } from "@/lib/supabase";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No active session");
  return session.access_token;
}

export const fetchChatHistory = async (): Promise<HistoryMessage[]> => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
};

export const sendChatMessage = async (message: string): Promise<string> => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (response.status === 429) throw new Error("rate_limit_exceeded");
  if (!response.ok) throw new Error("Failed to get reply");

  const data = await response.json();
  return data.reply;
};

export const deleteAccount = async () => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/user`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to delete account");
};
