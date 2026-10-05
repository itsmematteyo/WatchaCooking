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
import LoadingOverlay from '../../components/LoadingOverlay';

type Errors = {
    username?: string;
    email?: string;
    password?: string;
    confirm?: string;
    form?: string;
};

export default function SignUp() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(false);

    function validate(): Errors {
        const e: Errors = {};
        const name = username.trim();
        if (name.length < 3) e.username = 'Use at least 3 characters.';
        else if (!/^[a-zA-Z0-9_]+$/.test(name)) e.username = 'Use letters, numbers and underscores only.';
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a full email, like maria@email.com';
        if (password.length < 8) e.password = 'Use at least 8 characters.';
        if (confirm !== password) e.confirm = "Passwords don't match.";
        return e;
    }

    async function onSubmit() {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { username: username.trim() },
            },
        });
        setLoading(false);

        if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('already registered')) {
                setErrors({ email: 'This email already has an account. Log in instead.' });
            } else if (msg.includes('database error')) {
                setErrors({ username: 'That username is taken. Try another.' });
            } else {
                setErrors({ form: error.message });
            }
            return;
        }

        if (data.user && data.user.identities?.length === 0) {
            setErrors({ email: 'This email already has an account. Log in instead.' });
            return;
        }

        if (router.canDismiss()) router.dismissAll();
        router.replace('/tabs');
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
             {/* <LoadingOverlay visible={loading} label="Creating your account..." /> */}
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
                keyboardShouldPersistTaps="handled"
            >
                <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
                    <Text style={styles.backText}>‹</Text>
                </Pressable>

                <Text style={styles.title}>Create your account</Text>

                <TextField
                    label="Username"
                    placeholder="e.g. lutongbahay"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    error={errors.username}
                />
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
                    placeholder="At least 8 characters"
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    secure
                    error={errors.password}
                />
                <TextField
                    label="Confirm password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChangeText={setConfirm}
                    autoCapitalize="none"
                    secure
                    error={errors.confirm}
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
                        <Text style={styles.btnText}>Create account</Text>
                    )}
                </Pressable>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Pressable onPress={() => router.replace('/auth/log-in')}>
                        <Text style={styles.link}>Log in</Text>
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
        fontFamily: 'Fredoka_700Bold', fontSize: 28,
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