import { supabase } from "@/lib/supabase";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
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

export const clearChatHistory = async (): Promise<void> => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/history`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to clear history");
};

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch transactions");
  return response.json();
};

export interface DashboardSummary {
  balance: number;
  monthly_spending: number;
  savings_goal: number;
  savings_saved: number;
}

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch dashboard summary");
  return response.json();
};

export const updateSavingsGoal = async (savingsGoal: number): Promise<DashboardSummary> => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/savings-goal`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ savings_goal: savingsGoal }),
  });

  if (!response.ok) throw new Error("Failed to update savings goal");
  return response.json();
};

export const deleteAccount = async () => {
  const token = await getAccessToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to delete account");
};
