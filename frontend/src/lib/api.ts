import "server-only";

import { auth } from "@clerk/nextjs/server";

export function getApiUrl(path: string): string {
  const baseUrl = process.env.NIRANTAR_API_URL ?? "http://127.0.0.1:8000";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function getApiAuthHeaders(): Promise<HeadersInit | null> {
  const { getToken, isAuthenticated } = await auth();
  if (!isAuthenticated) return null;

  const token = await getToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}
