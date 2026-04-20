export function formatMinutes(totalMinutes: number): string {
  const safeMinutes = Math.max(0, totalMinutes);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours === 0) {
    return `${safeMinutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function parseDurationToMinutes(duration: string): number {
  const parts = duration.split(':').map((value) => Number.parseInt(value, 10));

  if (parts.some((value) => Number.isNaN(value))) {
    return 0;
  }

  if (parts.length === 3) {
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const seconds = parts[2] ?? 0;
    return hours * 60 + minutes + (seconds > 0 ? 1 : 0);
  }

  if (parts.length === 2) {
    const minutes = parts[0] ?? 0;
    const seconds = parts[1] ?? 0;
    return minutes + (seconds > 0 ? 1 : 0);
  }

  return parts[0] ?? 0;
}

export function formatCalendarLabel(date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
