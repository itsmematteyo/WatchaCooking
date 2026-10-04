import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

export default function Welcome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* PLACEHOLDER: replace with a real photo, for example
          <Image source={require('../../../assets/welcome.jpg')} style={styles.photo} /> */}
            <View style={styles.photo}>
                <Text style={styles.photoText}>Food photo</Text>
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
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
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
        fontFamily: 'serif',
        fontSize: 30,
        fontWeight: '700',
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
});