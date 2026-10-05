import { Stack } from 'expo-router';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

export default function RootLayout() {
  const [loaded] = useFonts({ Fredoka_700Bold });
  if (!loaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}