export function getApiUrl(path: string): string {
  const baseUrl = process.env.NIRANTAR_API_URL ?? "http://127.0.0.1:8000";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}
