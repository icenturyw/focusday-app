import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { FocusSessionType } from '@/types/app';

const TIMER_CHANNEL_ID = 'focusday-timer';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureTimerChannel(vibrationEnabled: boolean) {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
    name: '专注提醒',
    importance: Notifications.AndroidImportance.MAX,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: vibrationEnabled,
    vibrationPattern: vibrationEnabled ? [0, 250, 250, 250] : [0],
    sound: 'default',
  });
}

export async function ensureLocalNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === 'granted';
}

export async function scheduleTimerCompletionNotification({
  taskTitle,
  phase,
  seconds,
  vibrationEnabled,
}: {
  taskTitle: string;
  phase: FocusSessionType;
  seconds: number;
  vibrationEnabled: boolean;
}) {
  if (seconds <= 0) {
    return null;
  }

  const granted = await ensureLocalNotificationPermission();
  if (!granted) {
    return null;
  }

  await ensureTimerChannel(vibrationEnabled);

  const title =
    phase === 'focus' ? '专注时间已结束' : phase === 'longBreak' ? '长休息结束' : '短休息结束';
  const body =
    phase === 'focus'
      ? `${taskTitle} 已完成一个番茄，回来处理下一步。`
      : `${taskTitle} 可以开始下一轮专注了。`;

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        taskTitle,
        phase,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: TIMER_CHANNEL_ID,
    },
  });
}

export async function cancelTimerCompletionNotification(notificationId?: string | null) {
  if (!notificationId) {
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
