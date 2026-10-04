import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const MIN_SPLASH_MS = 1500;

function Dot({ delay }: { delay: number }) {
    const y = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(y, { toValue: -8, duration: 300, useNativeDriver: true }),
                Animated.timing(y, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.delay(400 - delay),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [delay, y]);

    return <Animated.View style={[styles.dot, { transform: [{ translateY: y }] }]} />;
}

export default function Splash() {
    const router = useRouter();

    useEffect(() => {
        let active = true;

        async function start() {
            // wait for the session check AND a minimum splash time
            const [{ data }] = await Promise.all([
                supabase.auth.getSession(),
                new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS)),
            ]);
            if (!active) return;
            router.replace('/auth/welcome');
        }

        start();
        return () => {
            active = false;
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* PLACEHOLDER: replace with the real logo image later */}
            <View style={styles.logoBox}>
                <Text style={styles.logoText}>Logo</Text>
            </View>

            <Text style={styles.title}>Watcha Cooking?</Text>

            <View style={styles.dots}>
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
            </View>

            <Text style={styles.tagline}>What's on the table today?</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    logoBox: {
        width: 110,
        height: 110,
        borderRadius: 28,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.brownSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logoText: { color: colors.brownSoft, fontSize: 14 },
    title: {
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
        fontSize: 34,
        fontWeight: '700',
        color: colors.brown,
        marginBottom: 24,
    },
    dots: { flexDirection: 'row', gap: 8, marginBottom: 16, height: 20, alignItems: 'flex-end' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
    tagline: { fontSize: 14, color: colors.brownSoft },
});