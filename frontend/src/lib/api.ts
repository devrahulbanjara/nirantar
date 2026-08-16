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

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status}).`;
  try {
    const errorBody = (await response.json()) as { detail?: unknown };
    const detail = errorBody.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          typeof item === "object" && item !== null && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : null,
        )
        .filter((msg): msg is string => Boolean(msg));
      if (messages.length > 0) return messages.join("; ");
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function apiMutate<T>(
  path: string,
  init: { method: "POST" | "PATCH" | "DELETE"; body?: unknown },
): Promise<ActionResult<T>> {
  const headers = await getApiAuthHeaders();
  if (!headers) {
    return { ok: false, status: 401, message: "Not signed in." };
  }

  try {
    const response = await fetch(getApiUrl(path), {
      method: init.method,
      headers: { ...headers, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: await extractErrorMessage(response),
      };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Could not reach the server. Check your connection and retry.",
    };
  }
}

export async function apiGet<T>(
  path: string,
): Promise<ActionResult<T>> {
  const headers = await getApiAuthHeaders();
  if (!headers) {
    return { ok: false, status: 401, message: "Not signed in." };
  }

  try {
    const response = await fetch(getApiUrl(path), {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: await extractErrorMessage(response),
      };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Could not reach the server. Check your connection and retry.",
    };
  }
}
