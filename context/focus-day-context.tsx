import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  buildAchievementProgress,
  normalizeAchievementRecords,
  seedAchievementRecords,
} from '@/utils/achievements';
import {
  ActiveTimer,
  AchievementProgress,
  AchievementRecord,
  AppSettings,
  CompletionPrompt,
  FocusSession,
  FocusSessionStatus,
  FocusSessionType,
  RecurringEditScope,
  Task,
  TaskDraft,
} from '@/types/app';
import {
  createId,
  enumerateDateKeys,
  getElapsedSeconds,
  normalizeDateKey,
  toDateKey,
} from '@/utils/date';
import {
  cancelTimerCompletionNotification,
  scheduleTimerCompletionNotification,
} from '@/utils/notifications';
import { getTaskScheduledDate } from '@/utils/stats';

const STORAGE_KEY = 'focusday::state::v1';

const defaultSettings: AppSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  autoStartNextRound: false,
  taskReminderEnabled: true,
  sessionReminderEnabled: true,
  eveningReviewReminderEnabled: false,
  vibrationEnabled: true,
  whiteNoiseMode: 'off',
};

type StoredState = {
  tasks: Task[];
  sessions: FocusSession[];
  settings: AppSettings;
  achievements?: AchievementRecord[];
};

type FocusDayContextValue = {
  isHydrated: boolean;
  tasks: Task[];
  sessions: FocusSession[];
  settings: AppSettings;
  achievements: AchievementProgress[];
  activeTimer: ActiveTimer | null;
  completionPrompt: CompletionPrompt | null;
  achievementPrompt: AchievementProgress | null;
  selectedTaskId: string | null;
  addTask: (draft: TaskDraft) => Task;
  updateTask: (taskId: string, draft: TaskDraft, scope?: RecurringEditScope) => void;
  deleteTask: (taskId: string, scope?: RecurringEditScope) => void;
  markTaskComplete: (taskId: string) => void;
  reopenTask: (taskId: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  selectTask: (taskId: string | null) => void;
  startFocus: (taskId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  endCurrentSession: () => void;
  skipBreak: () => void;
  startBreak: (taskId: string, breakType: Exclude<FocusSessionType, 'focus'>) => void;
  continueWithTask: (taskId: string) => void;
  dismissCompletionPrompt: () => void;
  dismissAchievementPrompt: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const FocusDayContext = createContext<FocusDayContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [isHydrated, setHydrated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [achievementRecords, setAchievementRecords] = useState<AchievementRecord[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [completionPrompt, setCompletionPrompt] = useState<CompletionPrompt | null>(null);
  const [achievementPromptId, setAchievementPromptId] = useState<string | null>(null);

  const tasksRef = useRef(tasks);
  const sessionsRef = useRef(sessions);
  const settingsRef = useRef(settings);
  const activeTimerRef = useRef(activeTimer);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    activeTimerRef.current = activeTimer;
  }, [activeTimer]);

  useEffect(() => {
    async function loadState() {
      try {
        const rawState = await AsyncStorage.getItem(STORAGE_KEY);
        if (!rawState) {
          setAchievementRecords(normalizeAchievementRecords([]));
          setHydrated(true);
          return;
        }

        const parsedState = JSON.parse(rawState) as StoredState;
        const hydratedTasks = (parsedState.tasks ?? []).map((task) => ({
          ...task,
          scheduledDate: task.scheduledDate ?? toDateKey(task.createdAt),
          recurringTaskId: task.recurringTaskId ?? null,
        }));
        const hydratedSessions = parsedState.sessions ?? [];
        const now = new Date().toISOString();

        setTasks(hydratedTasks);
        setSessions(hydratedSessions);
        setSettings({ ...defaultSettings, ...(parsedState.settings ?? {}) });
        setAchievementRecords(
          normalizeAchievementRecords(
            parsedState.achievements ?? seedAchievementRecords(hydratedTasks, hydratedSessions, now)
          )
        );
      } finally {
        setHydrated(true);
      }
    }

    loadState();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const state: StoredState = {
      tasks,
      sessions,
      settings,
      achievements: achievementRecords,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [achievementRecords, isHydrated, settings, sessions, tasks]);

  useEffect(() => {
    if (!isHydrated || activeTimer?.isRunning !== true) {
      return;
    }

    const timerId = setInterval(() => {
      const timer = activeTimerRef.current;
      if (!timer || !timer.isRunning) {
        return;
      }
      if (getElapsedSeconds(timer) >= timer.plannedDurationSeconds) {
        completeTimer(timer);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeTimer?.id, activeTimer?.isRunning, isHydrated]);

  useEffect(() => {
    if (!selectedTaskId && !activeTimer && tasks.length > 0) {
      const today = toDateKey(new Date());
      const firstPendingTask = tasks.find(
        (task) => task.status === 'pending' && getTaskScheduledDate(task) === today
      );
      if (firstPendingTask) {
        setSelectedTaskId(firstPendingTask.id);
      }
    }
  }, [activeTimer, selectedTaskId, tasks]);

  const achievements = useMemo(
    () => buildAchievementProgress(tasks, sessions, achievementRecords),
    [achievementRecords, sessions, tasks]
  );

  const achievementPrompt =
    achievements.find((achievement) => achievement.id === achievementPromptId) ?? null;

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const latestAchievements = buildAchievementProgress(tasks, sessions, achievementRecords);
    const pendingUnlocks = latestAchievements.filter(
      (achievement) =>
        achievement.progress >= achievement.target &&
        !achievementRecords.find((record) => record.id === achievement.id)?.unlockedAt
    );

    if (pendingUnlocks.length === 0) {
      return;
    }

    const unlockedAt = new Date().toISOString();
    setAchievementRecords((current) =>
      current.map((record) =>
        pendingUnlocks.some((achievement) => achievement.id === record.id)
          ? { ...record, unlockedAt, seenAt: null }
          : record
      )
    );
  }, [achievementRecords, isHydrated, sessions, tasks]);

  useEffect(() => {
    if (achievementPromptId) {
      return;
    }

    const nextPrompt = achievementRecords.find((record) => record.unlockedAt && !record.seenAt);
    if (nextPrompt) {
      setAchievementPromptId(nextPrompt.id);
    }
  }, [achievementPromptId, achievementRecords]);

  function persistSession(
    timer: ActiveTimer,
    status: FocusSessionStatus,
    actualDuration: number,
    endedAt = new Date().toISOString()
  ) {
    if (actualDuration <= 0) {
      return;
    }

    const session: FocusSession = {
      id: createId('session'),
      taskId: timer.taskId,
      type: timer.phase,
      plannedDuration: timer.plannedDurationSeconds,
      actualDuration,
      status,
      startedAt: timer.startedAt,
      endedAt,
    };

    setSessions((current) => [session, ...current]);
  }

  async function syncTimerNotification(timer: ActiveTimer) {
    if (!timer.isRunning || !settingsRef.current.sessionReminderEnabled) {
      return;
    }

    const taskTitle = tasksRef.current.find((task) => task.id === timer.taskId)?.title ?? '当前任务';
    const notificationIds = await scheduleTimerCompletionNotification({
      taskTitle,
      phase: timer.phase,
      seconds: Math.max(timer.plannedDurationSeconds - getElapsedSeconds(timer), 1),
      vibrationEnabled: settingsRef.current.vibrationEnabled,
    });

    if (!notificationIds) {
      return;
    }

    setActiveTimer((current) =>
      current?.id === timer.id ? { ...current, notificationIds } : current
    );
  }

  function launchTimer(taskId: string, phase: FocusSessionType) {
    const minutes =
      phase === 'focus'
        ? settingsRef.current.focusMinutes
        : phase === 'shortBreak'
          ? settingsRef.current.shortBreakMinutes
          : settingsRef.current.longBreakMinutes;

    setCompletionPrompt(null);
    setSelectedTaskId(taskId);
    const nextTimer: ActiveTimer = {
      id: createId('timer'),
      taskId,
      phase,
      plannedDurationSeconds: minutes * 60,
      elapsedBeforePauseSeconds: 0,
      startedAt: new Date().toISOString(),
      isRunning: true,
      notificationIds: null,
    };
    setActiveTimer(nextTimer);
    void syncTimerNotification(nextTimer);
  }

  function clearActiveTimer() {
    void cancelTimerCompletionNotification(activeTimerRef.current?.notificationIds);
    setActiveTimer(null);
  }

  function interruptTimer(recordStatus: FocusSessionStatus) {
    const timer = activeTimerRef.current;
    if (!timer) {
      return;
    }

    persistSession(timer, recordStatus, getElapsedSeconds(timer));
    clearActiveTimer();
  }

  function getNextBreakType() {
    const completedFocusCount =
      sessionsRef.current.filter(
        (session) => session.type === 'focus' && session.status === 'completed'
      ).length + 1;

    return completedFocusCount % 4 === 0 ? 'longBreak' : 'shortBreak';
  }

  function completeTimer(timer: ActiveTimer) {
    if (activeTimerRef.current?.id !== timer.id) {
      return;
    }

    void cancelTimerCompletionNotification(timer.notificationIds);
    const endedAt = new Date().toISOString();
    persistSession(timer, 'completed', timer.plannedDurationSeconds, endedAt);

    if (timer.phase === 'focus') {
      const targetTask = tasksRef.current.find((task) => task.id === timer.taskId);
      const completedPomodoros = (targetTask?.completedPomodoros ?? 0) + 1;

      setTasks((current) =>
        current.map((task) =>
          task.id === timer.taskId
            ? {
                ...task,
                completedPomodoros,
                updatedAt: endedAt,
              }
            : task
        )
      );
      clearActiveTimer();
      setCompletionPrompt({
        taskId: timer.taskId,
        taskTitle: targetTask?.title ?? '当前任务',
        nextBreakType: getNextBreakType(),
        completedPomodoros,
        estimatedPomodoros: targetTask?.estimatedPomodoros ?? completedPomodoros,
      });
      return;
    }

    if (settingsRef.current.autoStartNextRound) {
      launchTimer(timer.taskId, 'focus');
      return;
    }

    clearActiveTimer();
    setSelectedTaskId(timer.taskId);
  }

  function addTask(draft: TaskDraft) {
    const timestamp = new Date().toISOString();
    const today = toDateKey(timestamp);
    const startDate = normalizeDateKey(draft.startDate, today);
    const endDate = normalizeDateKey(draft.endDate, startDate);
    const scheduleDates = enumerateDateKeys(startDate, endDate);
    const recurringTaskId = scheduleDates.length > 1 ? createId('series') : null;
    const newTasks: Task[] = scheduleDates.map((scheduledDate) => ({
      id: createId('task'),
      title: draft.title.trim(),
      priority: draft.priority,
      estimatedPomodoros: draft.estimatedPomodoros,
      completedPomodoros: 0,
      scheduledDate,
      deadline: draft.deadline || null,
      note: draft.note.trim(),
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      recurringTaskId,
      sortIndex: 0,
    }));

    setTasks((current) => {
      const affectedDates = new Set(scheduleDates);
      const shiftedTasks = current.map((task) =>
        affectedDates.has(getTaskScheduledDate(task))
          ? { ...task, sortIndex: task.sortIndex + 1 }
          : task
      );
      return [...newTasks, ...shiftedTasks];
    });

    const selectedTask = newTasks.find((task) => task.scheduledDate === today) ?? newTasks[0];
    setSelectedTaskId(selectedTask.id);
    return selectedTask;
  }

  function updateTask(taskId: string, draft: TaskDraft, scope: RecurringEditScope = 'single') {
    const now = new Date().toISOString();
    setTasks((current) => {
      const sourceTask = current.find((task) => task.id === taskId);
      if (!sourceTask) {
        return current;
      }

      const appliesToTask = (task: Task) => {
        if (!sourceTask.recurringTaskId || scope === 'single') {
          return task.id === taskId;
        }
        if (scope === 'all') {
          return task.recurringTaskId === sourceTask.recurringTaskId;
        }
        return (
          task.recurringTaskId === sourceTask.recurringTaskId &&
          getTaskScheduledDate(task) >= getTaskScheduledDate(sourceTask)
        );
      };

      return current.map((task) =>
        appliesToTask(task)
          ? {
              ...task,
              title: draft.title.trim(),
              priority: draft.priority,
              estimatedPomodoros: draft.estimatedPomodoros,
              deadline: draft.deadline || null,
              note: draft.note.trim(),
              updatedAt: now,
            }
          : task
      );
    });
  }

  function deleteTask(taskId: string, scope: RecurringEditScope = 'single') {
    const sourceTask = tasksRef.current.find((task) => task.id === taskId);
    if (!sourceTask) {
      return;
    }

    const appliesToTask = (task: Task) => {
      if (!sourceTask.recurringTaskId || scope === 'single') {
        return task.id === taskId;
      }
      if (scope === 'all') {
        return task.recurringTaskId === sourceTask.recurringTaskId;
      }
      return (
        task.recurringTaskId === sourceTask.recurringTaskId &&
        getTaskScheduledDate(task) >= getTaskScheduledDate(sourceTask)
      );
    };

    const deletedTaskIds = new Set(
      tasksRef.current.filter((task) => appliesToTask(task)).map((task) => task.id)
    );

    if (activeTimerRef.current && deletedTaskIds.has(activeTimerRef.current.taskId)) {
      interruptTimer(activeTimerRef.current.phase === 'focus' ? 'interrupted' : 'skipped');
    }

    setTasks((current) => current.filter((task) => !deletedTaskIds.has(task.id)));
    setSelectedTaskId((current) => (current && deletedTaskIds.has(current) ? null : current));
    setCompletionPrompt((current) =>
      current && deletedTaskIds.has(current.taskId) ? null : current
    );
  }

  function markTaskComplete(taskId: string) {
    const now = new Date().toISOString();
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              completedAt: now,
              updatedAt: now,
            }
          : task
      )
    );
  }

  function reopenTask(taskId: string) {
    const now = new Date().toISOString();
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'pending',
              completedAt: null,
              updatedAt: now,
            }
          : task
      )
    );
  }

  function reorderTasks(taskIds: string[]) {
    const orderMap = new Map(taskIds.map((taskId, index) => [taskId, index]));
    const now = new Date().toISOString();
    setTasks((current) =>
      current.map((task) =>
        orderMap.has(task.id)
          ? {
              ...task,
              sortIndex: orderMap.get(task.id) ?? task.sortIndex,
              updatedAt: now,
            }
          : task
      )
    );
  }

  function selectTask(taskId: string | null) {
    setSelectedTaskId(taskId);
  }

  function startFocus(taskId: string) {
    if (activeTimerRef.current) {
      interruptTimer(activeTimerRef.current.phase === 'focus' ? 'interrupted' : 'skipped');
    }
    launchTimer(taskId, 'focus');
  }

  function pauseTimer() {
    void cancelTimerCompletionNotification(activeTimerRef.current?.notificationIds);
    setActiveTimer((current) =>
      current
        ? {
            ...current,
            elapsedBeforePauseSeconds: getElapsedSeconds(current),
            isRunning: false,
            notificationIds: null,
          }
        : current
    );
  }

  function resumeTimer() {
    const timer = activeTimerRef.current;
    if (!timer) {
      return;
    }

    const resumedTimer: ActiveTimer = {
      ...timer,
      startedAt: new Date().toISOString(),
      isRunning: true,
      notificationIds: null,
    };
    setActiveTimer(resumedTimer);
    void syncTimerNotification(resumedTimer);
  }

  function endCurrentSession() {
    const timer = activeTimerRef.current;
    if (!timer) {
      return;
    }
    interruptTimer(timer.phase === 'focus' ? 'interrupted' : 'skipped');
  }

  function skipBreak() {
    const timer = activeTimerRef.current;
    if (!timer || timer.phase === 'focus') {
      return;
    }
    interruptTimer('skipped');
    launchTimer(timer.taskId, 'focus');
  }

  function startBreak(taskId: string, breakType: Exclude<FocusSessionType, 'focus'>) {
    launchTimer(taskId, breakType);
  }

  function continueWithTask(taskId: string) {
    launchTimer(taskId, 'focus');
  }

  function dismissCompletionPrompt() {
    setCompletionPrompt(null);
  }

  function dismissAchievementPrompt() {
    if (!achievementPromptId) {
      return;
    }

    const seenAt = new Date().toISOString();
    setAchievementRecords((current) =>
      current.map((record) =>
        record.id === achievementPromptId ? { ...record, seenAt: record.seenAt ?? seenAt } : record
      )
    );
    setAchievementPromptId(null);
  }

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        return;
      }

      const timer = activeTimerRef.current;
      if (!timer || !timer.isRunning) {
        return;
      }

      if (getElapsedSeconds(timer) >= timer.plannedDurationSeconds) {
        completeTimer(timer);
      }
    });

    return () => subscription.remove();
  }, []);

  const value = useMemo<FocusDayContextValue>(
    () => ({
      isHydrated,
      tasks,
      sessions,
      settings,
      achievements,
      activeTimer,
      completionPrompt,
      achievementPrompt,
      selectedTaskId,
      addTask,
      updateTask,
      deleteTask,
      markTaskComplete,
      reopenTask,
      reorderTasks,
      selectTask,
      startFocus,
      pauseTimer,
      resumeTimer,
      endCurrentSession,
      skipBreak,
      startBreak,
      continueWithTask,
      dismissCompletionPrompt,
      dismissAchievementPrompt,
      updateSettings,
    }),
    [
      achievementPrompt,
      achievements,
      activeTimer,
      completionPrompt,
      isHydrated,
      selectedTaskId,
      sessions,
      settings,
      tasks,
    ]
  );

  return <FocusDayContext.Provider value={value}>{children}</FocusDayContext.Provider>;
}

export function useFocusDay() {
  const context = useContext(FocusDayContext);
  if (!context) {
    throw new Error('useFocusDay must be used within AppProvider.');
  }
  return context;
}
