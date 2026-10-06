// Keep server-rendered activity text identical across locales and time zones.
// Stored ISO timestamps are unchanged; UTC is explicit in the displayed value.
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const pad = (value: number) => String(value).padStart(2, "0");
export function calendarDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return `${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
export function timestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return `${calendarDate(value)}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}
