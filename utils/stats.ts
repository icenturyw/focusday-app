import { DailyStats, FocusSession, StatsDimension, Task } from '@/types/app';
import { formatDateKey, getPeriodLabel, toDateKey } from '@/utils/date';

function isCompletedFocus(session: FocusSession) {
  return session.type === 'focus' && session.status === 'completed';
}

export function getTaskScheduledDate(task: Task) {
  return task.scheduledDate ?? toDateKey(task.createdAt);
}

export function getTodayTasks(tasks: Task[]) {
  const today = toDateKey(new Date());
  return tasks
    .filter((task) => getTaskScheduledDate(task) === today)
    .sort((left, right) => left.sortIndex - right.sortIndex);
}

export function getCurrentStreak(sessions: FocusSession[]) {
  const completedDays = new Set(
    sessions.filter(isCompletedFocus).map((session) => toDateKey(session.endedAt))
  );

  if (!completedDays.has(toDateKey(new Date()))) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();
  while (completedDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function buildDailyStats(tasks: Task[], sessions: FocusSession[]): DailyStats {
  const todayKey = toDateKey(new Date());
  const todayTasks = tasks.filter((task) => getTaskScheduledDate(task) === todayKey);
  const todaySessions = sessions.filter(
    (session) => isCompletedFocus(session) && toDateKey(session.endedAt) === todayKey
  );
  const focusMinutes = Math.round(
    todaySessions.reduce((sum, session) => sum + session.actualDuration, 0) / 60
  );

  return {
    date: todayKey,
    taskTotal: todayTasks.length,
    taskCompleted: todayTasks.filter((task) => task.status === 'completed').length,
    pomodoroCompleted: todaySessions.length,
    focusMinutes,
    streakDays: getCurrentStreak(sessions),
  };
}

type ChartPoint = {
  label: string;
  value: number;
};

export type StatsView = {
  rangeLabel: string;
  taskTotal: number;
  taskCompleted: number;
  pomodoroCompleted: number;
  focusMinutes: number;
  streakDays: number;
  summary: string;
  chart: ChartPoint[];
  taskDistribution: { taskId: string; title: string; pomodoros: number; minutes: number }[];
};

function getRangeDates(dimension: StatsDimension) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  if (dimension === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (dimension === 'week') {
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

function inRange(dateText: string, start: Date, end: Date) {
  const value = new Date(dateText).getTime();
  return value >= start.getTime() && value <= end.getTime();
}

export function buildStatsView(
  tasks: Task[],
  sessions: FocusSession[],
  dimension: StatsDimension
): StatsView {
  const { start, end } = getRangeDates(dimension);
  const completedFocusSessions = sessions.filter(
    (session) => isCompletedFocus(session) && inRange(session.endedAt, start, end)
  );
  const relevantTasks = tasks.filter((task) =>
    inRange(`${getTaskScheduledDate(task)}T00:00:00`, start, end)
  );
  const completedTasks = relevantTasks.filter((task) => task.status === 'completed');
  const focusMinutes = Math.round(
    completedFocusSessions.reduce((sum, session) => sum + session.actualDuration, 0) / 60
  );

  const distributionMap = new Map<string, { taskId: string; pomodoros: number; minutes: number }>();
  for (const session of completedFocusSessions) {
    const current = distributionMap.get(session.taskId) ?? {
      taskId: session.taskId,
      pomodoros: 0,
      minutes: 0,
    };
    current.pomodoros += 1;
    current.minutes += Math.round(session.actualDuration / 60);
    distributionMap.set(session.taskId, current);
  }

  const taskDistribution = Array.from(distributionMap.values())
    .map((item) => ({
      ...item,
      title: tasks.find((task) => task.id === item.taskId)?.title ?? '已删除任务',
    }))
    .sort((left, right) => right.pomodoros - left.pomodoros)
    .slice(0, 5);

  return {
    rangeLabel:
      dimension === 'today' ? '今天' : dimension === 'week' ? '过去 7 天' : '过去 30 天',
    taskTotal: relevantTasks.length,
    taskCompleted: completedTasks.length,
    pomodoroCompleted: completedFocusSessions.length,
    focusMinutes,
    streakDays: getCurrentStreak(sessions),
    summary:
      completedFocusSessions.length === 0
        ? `${dimension === 'today' ? '今天' : '这一段时间'}还没有专注记录，先完成一个番茄再回来复盘。`
        : `${dimension === 'today' ? '今天' : '这段时间'}完成 ${completedTasks.length}/${relevantTasks.length} 个任务，累计专注 ${focusMinutes} 分钟，${getBestPeriod(completedFocusSessions)}效率最高。`,
    chart: buildChartPoints(completedFocusSessions, dimension),
    taskDistribution,
  };
}

function buildChartPoints(sessions: FocusSession[], dimension: StatsDimension): ChartPoint[] {
  if (dimension === 'today') {
    const buckets = [
      { label: '深夜', start: 0, end: 5 },
      { label: '上午', start: 6, end: 11 },
      { label: '下午', start: 12, end: 17 },
      { label: '晚上', start: 18, end: 23 },
    ];
    return buckets.map((bucket) => ({
      label: bucket.label,
      value: Math.round(
        sessions
          .filter((session) => {
            const hour = new Date(session.endedAt).getHours();
            return hour >= bucket.start && hour <= bucket.end;
          })
          .reduce((sum, session) => sum + session.actualDuration, 0) / 60
      ),
    }));
  }

  if (dimension === 'week') {
    const points: ChartPoint[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const dateKey = toDateKey(date);
      points.push({
        label: formatDateKey(dateKey),
        value: Math.round(
          sessions
            .filter((session) => toDateKey(session.endedAt) === dateKey)
            .reduce((sum, session) => sum + session.actualDuration, 0) / 60
        ),
      });
    }
    return points;
  }

  const points: ChartPoint[] = [];
  for (let index = 3; index >= 0; index -= 1) {
    const rangeEnd = new Date();
    rangeEnd.setDate(rangeEnd.getDate() - index * 7);
    const rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeEnd.getDate() - 6);
    points.push({
      label: formatDateKey(toDateKey(rangeStart)),
      value: Math.round(
        sessions
          .filter((session) => inRange(session.endedAt, rangeStart, rangeEnd))
          .reduce((sum, session) => sum + session.actualDuration, 0) / 60
      ),
    });
  }
  return points;
}

function getBestPeriod(sessions: FocusSession[]) {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    const label = getPeriodLabel(new Date(session.endedAt).getHours());
    totals.set(label, (totals.get(label) ?? 0) + session.actualDuration);
  }

  return Array.from(totals.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? '今天';
}
