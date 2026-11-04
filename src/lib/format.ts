/** Danish display formatting. Always render in Danish time. */
const dateTime = new Intl.DateTimeFormat("da-DK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Copenhagen",
});
const dateOnly = new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeZone: "Europe/Copenhagen" });

export function formatDateTime(value: Date): string {
  return dateTime.format(value);
}

export function formatDate(value: Date): string {
  return dateOnly.format(value);
}
