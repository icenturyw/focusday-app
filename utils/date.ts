import { ActiveTimer } from '@/types/app';

const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' });

export function toDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateKey(value: string | null | undefined, fallback = toDateKey(new Date())) {
  if (!value) {
    return fallback;
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return fallback;
  }

  const [, year, month, day] = match;
  const normalized = `${year}-${month}-${day}`;
  const candidate = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(candidate.getTime()) ? fallback : normalized;
}

export function enumerateDateKeys(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dates: string[] = [];

  if (start.getTime() > end.getTime()) {
    return [startDate];
  }

  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function formatFriendlyDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${weekdayFormatter.format(date)}`;
}

export function formatDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatMinutes(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
  }
  return `${minutes}m`;
}

export function getGreeting(reference = new Date()) {
  const hour = reference.getHours();
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getElapsedSeconds(timer: ActiveTimer) {
  if (!timer.isRunning) {
    return Math.min(timer.elapsedBeforePauseSeconds, timer.plannedDurationSeconds);
  }
  const elapsedSeconds = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
  return Math.min(timer.elapsedBeforePauseSeconds + elapsedSeconds, timer.plannedDurationSeconds);
}

export function getRemainingSeconds(timer: ActiveTimer) {
  return Math.max(timer.plannedDurationSeconds - getElapsedSeconds(timer), 0);
}

export function formatClock(totalSeconds: number) {
  const minutes = `${Math.floor(totalSeconds / 60)}`.padStart(2, '0');
  const seconds = `${totalSeconds % 60}`.padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function getPeriodLabel(hour: number) {
  if (hour < 6) return '深夜';
  if (hour < 12) return '上午';
  if (hour < 18) return '下午';
  return '晚上';
}
