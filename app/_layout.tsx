import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AchievementSheet } from '@/components/achievement-sheet';
import { AppProvider, useFocusDay } from '@/context/focus-day-context';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootNavigator() {
  const { achievementPrompt, dismissAchievementPrompt } = useFocusDay();

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#F7F2EA' },
          headerShadowVisible: false,
          headerTintColor: '#221B16',
          contentStyle: { backgroundColor: '#F7F2EA' },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task-editor" options={{ presentation: 'modal', title: '任务编辑' }} />
        <Stack.Screen name="task/[id]" options={{ title: '任务详情' }} />
      </Stack>
      <AchievementSheet achievement={achievementPrompt} onDismiss={dismissAchievementPrompt} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
