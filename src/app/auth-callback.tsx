import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

export default function AuthCallback() {
  const router = useRouter();
  const url = Linking.useURL();

  useEffect(() => {
    if (!url) return;

    async function handle(link: string) {
      const [beforeHash, hash = ''] = link.split('#');
      const query = beforeHash.split('?')[1] ?? '';
      const fromHash = new URLSearchParams(hash);
      const fromQuery = new URLSearchParams(query);

      const code = fromQuery.get('code');
      const accessToken = fromHash.get('access_token');
      const refreshToken = fromHash.get('refresh_token');

      let ok = false;
      if (code) {
        ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
      } else if (accessToken && refreshToken) {
        ok = !(await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })).error;
      }
      router.replace(ok ? '/(tabs)' : '/(auth)/log-in');
    }

    handle(url);
  }, [url]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.orange} />
    </View>
  );
}