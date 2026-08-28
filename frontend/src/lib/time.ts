export const KATHMANDU_TIMEZONE = "Asia/Kathmandu";
export const KATHMANDU_OFFSET = "+05:45";

export function getKathmanduDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: KATHMANDU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function nowAsKathmanduInputValue(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KATHMANDU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function isoToKathmanduInputValue(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KATHMANDU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}


export function kathmanduInputValueToIso(value: string): string {
  return `${value}:00${KATHMANDU_OFFSET}`;
}

export function formatKathmanduTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatKathmanduDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function getKathmanduLocalDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: KATHMANDU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatDurationSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function formatDurationBetween(start: string, end: string | null): string {
  if (!end) return "In progress";
  const totalMinutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );
  return formatDurationSeconds(totalMinutes * 60);
}

export function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return utcDate.toISOString().slice(0, 10);
}

export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T00:00:00${KATHMANDU_OFFSET}`));
}

export function formatDateFullLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00${KATHMANDU_OFFSET}`));
}

export function formatDateShortLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00${KATHMANDU_OFFSET}`));
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDayParam(raw: string | undefined, fallback: string): string {
  if (!raw || !DAY_PATTERN.test(raw)) return fallback;
  return raw;
}

/** Current Kathmandu clock time on a chosen civil date, as a datetime-local value. */
export function nowOnKathmanduDate(date: string, now = new Date()): string {
  return `${date}T${nowAsKathmanduInputValue(now).slice(11)}`;
}

export function dayHeading(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === addDaysToDateString(today, -1)) return "Yesterday";
  if (date === addDaysToDateString(today, 1)) return "Tomorrow";
  return formatDateLabel(date);
}

/** Elapsed session clock from check-in, as `m:ss` or `h:mm:ss`. */
export function formatElapsedClock(startIso: string, nowMs = Date.now()): string {
  const elapsed = Math.max(0, Math.floor((nowMs - new Date(startIso).getTime()) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

export function dayHref(
  basePath: string,
  date: string,
  today: string,
  extraParams?: Record<string, string>,
): string {
  const search = new URLSearchParams(extraParams);
  if (date !== today) search.set("date", date);
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
