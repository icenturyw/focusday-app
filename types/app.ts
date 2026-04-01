export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'completed';
export type FocusSessionType = 'focus' | 'shortBreak' | 'longBreak';
export type FocusSessionStatus = 'completed' | 'interrupted' | 'skipped';
export type StatsDimension = 'today' | 'week' | 'month';
export type WhiteNoiseMode = 'off' | 'rain' | 'cafe';
export type RecurringEditScope = 'single' | 'future' | 'all';
export type AchievementId =
  | 'first_pomodoro'
  | 'ten_pomodoros'
  | 'fifty_pomodoros'
  | 'ten_hours'
  | 'seven_day_streak'
  | 'twenty_tasks';

export type Task = {
  id: string;
  title: string;
  priority: TaskPriority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  scheduledDate: string;
  deadline: string | null;
  note: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  recurringTaskId?: string | null;
  sortIndex: number;
};

export type FocusSession = {
  id: string;
  taskId: string;
  type: FocusSessionType;
  plannedDuration: number;
  actualDuration: number;
  status: FocusSessionStatus;
  startedAt: string;
  endedAt: string;
};

export type DailyStats = {
  date: string;
  taskTotal: number;
  taskCompleted: number;
  pomodoroCompleted: number;
  focusMinutes: number;
  streakDays: number;
};

export type AppSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoStartNextRound: boolean;
  taskReminderEnabled: boolean;
  sessionReminderEnabled: boolean;
  eveningReviewReminderEnabled: boolean;
  vibrationEnabled: boolean;
  whiteNoiseMode: WhiteNoiseMode;
};

export type ActiveTimer = {
  id: string;
  taskId: string;
  phase: FocusSessionType;
  plannedDurationSeconds: number;
  elapsedBeforePauseSeconds: number;
  startedAt: string;
  isRunning: boolean;
  notificationIds?: string[] | null;
};

export type CompletionPrompt = {
  taskId: string;
  taskTitle: string;
  nextBreakType: Exclude<FocusSessionType, 'focus'>;
  completedPomodoros: number;
  estimatedPomodoros: number;
};

export type AchievementRecord = {
  id: AchievementId;
  unlockedAt: string | null;
  seenAt: string | null;
};

export type AchievementProgress = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  progressLabel: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type TaskDraft = Pick<
  Task,
  'title' | 'priority' | 'estimatedPomodoros' | 'deadline' | 'note'
> & {
  startDate: string;
  endDate: string;
};
