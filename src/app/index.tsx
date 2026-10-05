import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const LOGO = require('../../assets/font-without-logo.png');
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
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />

            <View style={styles.titleWrap}>
                <Text style={styles.title}>Watcha</Text>
                <Text style={styles.title}>
                    Cooking<Text style={styles.mark}>?</Text>
                </Text>
            </View>

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
    logo: { width: 420, height: 390, marginBottom: 0 },
    titleWrap: { alignItems: 'center', marginTop: -40, marginBottom: 26 },
    title: {
        fontFamily: 'Fredoka_700Bold',
        fontSize: 44,
        lineHeight: 46,
        color: colors.brown,
        textAlign: 'center',
    },
    mark: { color: colors.orange },
    dots: { flexDirection: 'row', gap: 8, marginBottom: 16, height: 20, alignItems: 'flex-end' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
    tagline: { fontSize: 14, color: colors.brownSoft },
});