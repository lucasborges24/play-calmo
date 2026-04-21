export function isoDurationToSeconds(iso: string): number {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

  if (!match) {
    return 0;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToLabel(sec: number): string {
  const safeSeconds = Math.max(0, Math.floor(sec));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours) {
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  }

  if (minutes) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  return `0:${String(seconds).padStart(2, '0')}`;
}
