import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const baseUrl = 'http://127.0.0.1:4173';
const outputDir = path.join(process.cwd(), 'assets', 'screenshots');
const storageKey = 'focusday::state::v1';

const now = new Date();
const today = toDateKey(now);
const yesterday = toDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
const twoDaysAgo = toDateKey(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
const tomorrow = toDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));

const state = {
  tasks: [
    makeTask({
      id: 'task-focus-writing',
      title: 'Write landing page copy',
      scheduledDate: today,
      priority: 'high',
      estimatedPomodoros: 4,
      completedPomodoros: 2,
      note: 'Draft hero, pricing, and FAQ blocks.',
      deadline: `${today} 18:00`,
      sortIndex: 0,
    }),
    makeTask({
      id: 'task-bug-triage',
      title: 'Review bug backlog',
      scheduledDate: today,
      priority: 'medium',
      estimatedPomodoros: 2,
      completedPomodoros: 1,
      note: 'Close duplicates and tag release blockers.',
      sortIndex: 1,
    }),
    makeTask({
      id: 'task-reading',
      title: 'Read product research notes',
      scheduledDate: today,
      priority: 'low',
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      note: 'Extract three actionable findings.',
      sortIndex: 2,
    }),
    makeTask({
      id: 'task-series-1',
      title: 'Daily English listening',
      scheduledDate: today,
      priority: 'medium',
      estimatedPomodoros: 1,
      completedPomodoros: 1,
      status: 'completed',
      recurringTaskId: 'series-language',
      sortIndex: 3,
      completedAt: new Date().toISOString(),
    }),
    makeTask({
      id: 'task-series-2',
      title: 'Daily English listening',
      scheduledDate: tomorrow,
      priority: 'medium',
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      recurringTaskId: 'series-language',
      sortIndex: 0,
    }),
  ],
  sessions: [
    makeSession({ id: 'session-1', taskId: 'task-focus-writing', endedAt: `${today}T09:25:00.000Z` }),
    makeSession({ id: 'session-2', taskId: 'task-focus-writing', endedAt: `${today}T10:10:00.000Z` }),
    makeSession({ id: 'session-3', taskId: 'task-bug-triage', endedAt: `${today}T14:25:00.000Z` }),
    makeSession({ id: 'session-4', taskId: 'task-series-1', endedAt: `${yesterday}T09:25:00.000Z` }),
    makeSession({ id: 'session-5', taskId: 'task-series-1', endedAt: `${twoDaysAgo}T09:25:00.000Z` }),
  ],
  settings: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartNextRound: false,
    taskReminderEnabled: true,
    sessionReminderEnabled: true,
    eveningReviewReminderEnabled: false,
    vibrationEnabled: true,
    whiteNoiseMode: 'rain',
  },
  achievements: [
    { id: 'first_pomodoro', unlockedAt: now.toISOString(), seenAt: now.toISOString() },
    { id: 'ten_pomodoros', unlockedAt: now.toISOString(), seenAt: now.toISOString() },
    { id: 'fifty_pomodoros', unlockedAt: null, seenAt: null },
    { id: 'ten_hours', unlockedAt: null, seenAt: null },
    { id: 'seven_day_streak', unlockedAt: null, seenAt: null },
    { id: 'twenty_tasks', unlockedAt: null, seenAt: null },
  ],
};

const shots = [
  { name: 'home', route: '/' },
  { name: 'focus', route: '/focus' },
  { name: 'stats', route: '/stats' },
  { name: 'profile', route: '/profile' },
];

fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices['iPhone 13'],
  locale: 'en-US',
  colorScheme: 'light',
});

await context.addInitScript(
  ({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  { key: storageKey, value: state }
);

for (const shot of shots) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}${shot.route}`, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: path.join(outputDir, `${shot.name}.png`),
    fullPage: true,
  });
  await page.close();
}

await browser.close();

function toDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function makeTask({
  id,
  title,
  scheduledDate,
  priority,
  estimatedPomodoros,
  completedPomodoros,
  note,
  deadline = null,
  recurringTaskId = null,
  sortIndex = 0,
  status = 'pending',
  completedAt = null,
}) {
  const timestamp = `${scheduledDate}T08:00:00.000Z`;
  return {
    id,
    title,
    priority,
    estimatedPomodoros,
    completedPomodoros,
    scheduledDate,
    deadline,
    note,
    status,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt,
    recurringTaskId,
    sortIndex,
  };
}

function makeSession({ id, taskId, endedAt }) {
  const startedAt = new Date(new Date(endedAt).getTime() - 25 * 60 * 1000).toISOString();
  return {
    id,
    taskId,
    type: 'focus',
    plannedDuration: 1500,
    actualDuration: 1500,
    status: 'completed',
    startedAt,
    endedAt,
  };
}
