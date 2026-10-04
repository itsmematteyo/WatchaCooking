    import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import TextField from '../../components/TextField';

type Errors = { email?: string; password?: string; form?: string };

export default function LogIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const e: Errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a full email, like maria@email.com';
    if (!password) e.password = 'Enter your password.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login')) {
        setErrors({ form: 'Email or password is incorrect.' });
      } else if (msg.includes('not confirmed')) {
        setErrors({ form: 'Confirm your email first, then log in.' });
      } else {
        setErrors({ form: error.message });
      }
      return;
    }

    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.title}>Welcome back</Text>

        <TextField
          label="Email"
          placeholder="you@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />
        <TextField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          secure
          error={errors.password}
        />

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.btn, (pressed || loading) && styles.pressed]}
          onPress={onSubmit}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Log in</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Pressable onPress={() => router.replace('/(auth)/sign-up')}>
            <Text style={styles.link}>Sign up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.cream },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  backText: { fontSize: 26, color: colors.brown, marginTop: -3 },
  title: {
    fontFamily: 'serif', fontSize: 28, fontWeight: '700',
    color: colors.brown, marginBottom: 18,
  },
  formError: { color: colors.error, fontWeight: '600', marginBottom: 10 },
  btn: {
    backgroundColor: colors.brown, borderRadius: 999, paddingVertical: 15,
    alignItems: 'center', marginTop: 6,
  },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  footerText: { fontSize: 14, color: colors.brownSoft },
  link: {
    fontSize: 14, fontWeight: '700', color: colors.brown,
    textDecorationLine: 'underline', textDecorationColor: colors.orange,
  },
});