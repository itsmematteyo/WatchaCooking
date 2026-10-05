import { useEffect, useRef, useState } from 'react';
import {
    FlatList, Image, NativeScrollEvent, NativeSyntheticEvent,
    Pressable, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const SLIDES = [require('../../../assets/chicken.jpg'), require('../../../assets/pasta.jpg'), require('../../../assets/salad.jpg')];
const AUTO_MS = 3500;

export default function Welcome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const listRef = useRef<FlatList>(null);
    const [index, setIndex] = useState(0);
    const [dragging, setDragging] = useState(false);

    const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        setDragging(false);
    };

    useEffect(() => {
        if (SLIDES.length < 2 || dragging) return;
        const t = setTimeout(() => {
            const next = (index + 1) % SLIDES.length;
            listRef.current?.scrollToIndex({ index: next, animated: true });
            setIndex(next);
        }, AUTO_MS);
        return () => clearTimeout(t);
    }, [index, dragging]);

    return (
        <View style={styles.container}>
            <View style={styles.photo}>
                <FlatList
                    ref={listRef}
                    data={SLIDES}
                    keyExtractor={(_, i) => String(i)}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScrollBeginDrag={() => setDragging(true)}
                    onMomentumScrollEnd={onScrollEnd}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    style={{ width }}
                    renderItem={({ item }) => (
                        <Image source={item} style={{ width, height: '100%' }} resizeMode="cover" />
                    )}
                />
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => (
                        <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                    ))}
                </View>
            </View>
            <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
                <View>
                    <Text style={styles.title}>Cook what your family loves</Text>
                    <Text style={styles.subtitle}>
                        Find, share and vote on home-cooked recipes.
                    </Text>
                </View>

                <View style={styles.buttons}>
                    <Pressable
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.btn, styles.btnFilled, pressed && styles.pressed]}
                        onPress={() => router.push('/auth/sign-up')}
                    >
                        <Text style={styles.btnFilledText}>Sign up</Text>
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]}
                        onPress={() => router.push('/auth/log-in')}
                    >
                        <Text style={styles.btnOutlineText}>Log in</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    photo: {
        flex: 1,
        backgroundColor: colors.creamDark,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    photoText: { color: colors.brownSoft, fontSize: 14 },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 28,
        justifyContent: 'space-between',
    },
    title: {
        fontFamily: 'Fredoka_700Bold',
        fontSize: 30,
        color: colors.brown,
        marginBottom: 8,
    },
    subtitle: { fontSize: 16, color: colors.brownSoft, lineHeight: 22 },
    buttons: { gap: 12 },
    btn: {
        paddingVertical: 15,
        borderRadius: 999,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.brown,
    },
    btnFilled: { backgroundColor: colors.brown },
    btnFilledText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    btnOutline: { backgroundColor: 'transparent' },
    btnOutlineText: { color: colors.brown, fontSize: 16, fontWeight: '700' },
    pressed: { opacity: 0.8 },
    dots: {
        position: 'absolute', bottom: 20, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
    dotActive: { width: 22, backgroundColor: colors.white },
});