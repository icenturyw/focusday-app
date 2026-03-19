import {
  AchievementId,
  AchievementProgress,
  AchievementRecord,
  FocusSession,
  Task,
} from '@/types/app';
import { formatMinutes } from '@/utils/date';
import { getCurrentStreak } from '@/utils/stats';

type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  target: number;
  measure: (tasks: Task[], sessions: FocusSession[]) => number;
  formatProgress: (value: number, target: number) => string;
};

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first_pomodoro',
    title: '起步番茄',
    description: '完成第一个完整番茄。',
    icon: 'timer-check-outline',
    target: 1,
    measure: (_tasks, sessions) => getCompletedPomodoros(sessions),
    formatProgress: (value, target) => `${Math.min(value, target)}/${target} 个番茄`,
  },
  {
    id: 'ten_pomodoros',
    title: '稳定输出',
    description: '累计完成 10 个完整番茄。',
    icon: 'fire-circle',
    target: 10,
    measure: (_tasks, sessions) => getCompletedPomodoros(sessions),
    formatProgress: (value, target) => `${Math.min(value, target)}/${target} 个番茄`,
  },
  {
    id: 'fifty_pomodoros',
    title: '深度沉浸',
    description: '累计完成 50 个完整番茄。',
    icon: 'rocket-launch-outline',
    target: 50,
    measure: (_tasks, sessions) => getCompletedPomodoros(sessions),
    formatProgress: (value, target) => `${Math.min(value, target)}/${target} 个番茄`,
  },
  {
    id: 'ten_hours',
    title: '十小时俱乐部',
    description: '累计专注时长达到 10 小时。',
    icon: 'clock-check-outline',
    target: 600,
    measure: (_tasks, sessions) => getCompletedFocusMinutes(sessions),
    formatProgress: (value, target) =>
      `${formatMinutes(Math.min(value, target))} / ${formatMinutes(target)}`,
  },
  {
    id: 'seven_day_streak',
    title: '七日连续',
    description: '连续 7 天至少完成 1 个番茄。',
    icon: 'calendar-star',
    target: 7,
    measure: (_tasks, sessions) => getCurrentStreak(sessions),
    formatProgress: (value, target) => `${Math.min(value, target)}/${target} 天`,
  },
  {
    id: 'twenty_tasks',
    title: '清单终结者',
    description: '累计完成 20 个任务。',
    icon: 'check-decagram-outline',
    target: 20,
    measure: (tasks) => getCompletedTasks(tasks),
    formatProgress: (value, target) => `${Math.min(value, target)}/${target} 个任务`,
  },
];

export function getCompletedPomodoros(sessions: FocusSession[]) {
  return sessions.filter((session) => session.type === 'focus' && session.status === 'completed').length;
}

export function getCompletedFocusMinutes(sessions: FocusSession[]) {
  return Math.round(
    sessions
      .filter((session) => session.type === 'focus' && session.status === 'completed')
      .reduce((sum, session) => sum + session.actualDuration, 0) / 60
  );
}

export function getCompletedTasks(tasks: Task[]) {
  return tasks.filter((task) => task.status === 'completed').length;
}

export function seedAchievementRecords(tasks: Task[], sessions: FocusSession[], timestamp: string) {
  return achievementDefinitions.map<AchievementRecord>((definition) => {
    const unlocked = definition.measure(tasks, sessions) >= definition.target;
    return {
      id: definition.id,
      unlockedAt: unlocked ? timestamp : null,
      seenAt: unlocked ? timestamp : null,
    };
  });
}

export function normalizeAchievementRecords(records: AchievementRecord[] | undefined) {
  const recordsById = new Map(records?.map((record) => [record.id, record]));
  return achievementDefinitions.map<AchievementRecord>((definition) => {
    const current = recordsById.get(definition.id);
    return {
      id: definition.id,
      unlockedAt: current?.unlockedAt ?? null,
      seenAt: current?.seenAt ?? null,
    };
  });
}

export function buildAchievementProgress(
  tasks: Task[],
  sessions: FocusSession[],
  records: AchievementRecord[]
) {
  const recordsById = new Map(records.map((record) => [record.id, record]));

  return achievementDefinitions.map<AchievementProgress>((definition) => {
    const progress = definition.measure(tasks, sessions);
    const record = recordsById.get(definition.id);
    const unlocked = Boolean(record?.unlockedAt) || progress >= definition.target;

    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      target: definition.target,
      progress,
      progressLabel: unlocked ? '已解锁' : definition.formatProgress(progress, definition.target),
      unlocked,
      unlockedAt: record?.unlockedAt ?? null,
    };
  });
}
