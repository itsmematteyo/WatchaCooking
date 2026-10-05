import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { shadow } from '../../theme/shadow';
import { Recipe } from '../../types/recipe';
import { fetchMine } from '../../api/recipes';
import SkeletonRow from '../../components/SkeletonRow';
import PressableScale from '../../components/PressableScale';
import RecipeRow from '../../components/RecipeRow';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
    const [mine, setMine] = useState<Recipe[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [{ data }, recipes] = await Promise.all([
          supabase.from('profiles').select('username').eq('id', user.id).single(),
          fetchMine(user.id).catch(() => [] as Recipe[]),
        ]);
        if (!active) return;
        if (data) setUsername(data.username);
        setMine(recipes);
        setLoadingMine(false);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  // Sample data for now: recipes written by this username.
  // Later this becomes a Supabase query on author_id.
  const votes = mine.reduce((sum, r) => sum + r.score, 0);

  function confirmLogOut() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/welcome');
        },
      },
    ]);
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: 32 }}
      >
        <View style={styles.top}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(username || '?').charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.name}>{username || ' '}</Text>
          <Text style={styles.sub}>Home cook</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{mine.length}</Text>
            <Text style={styles.statLabel}>{mine.length === 1 ? 'Recipe' : 'Recipes'}</Text>
          </View>
          <View style={styles.stat}>
            <View style={styles.voteRow}>
              <Ionicons name="arrow-up" size={18} color={colors.orangeDark} />
              <Text style={styles.statNum}>{votes}</Text>
            </View>
            <Text style={styles.statLabel}>Votes received</Text>
          </View>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipText}>My Recipes</Text>
        </View>

        {loadingMine ? (
          <SkeletonRow count={2} />
        ) : mine.length > 0 ? (
          mine.map((r) => <RecipeRow key={r.id} recipe={r} />)
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="book-outline" size={34} color={colors.brown} />
            </View>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySub}>Share the first dish you cooked at home.</Text>
            <PressableScale style={styles.addBtn} onPress={() => router.push('/tabs/add')} accessibilityRole="button">
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addBtnText}>Add your first recipe</Text>
            </PressableScale>
          </View>
        )}

        <PressableScale style={styles.logout} onPress={confirmLogOut} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={colors.brown} />
          <Text style={styles.logoutText}>Log out</Text>
        </PressableScale>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  top: { alignItems: 'center', marginBottom: 20 },
  avatarRing: {
    width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontFamily: 'Fredoka_700Bold', fontSize: 40 },
  name: { fontFamily: 'Fredoka_700Bold', fontSize: 27, color: colors.brown, marginTop: 12 },
  sub: { color: colors.brownSoft, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: 20, paddingVertical: 14, alignItems: 'center', ...shadow },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statNum: { fontFamily: 'Fredoka_700Bold', fontSize: 24, color: colors.brown },
  statLabel: { color: colors.brownSoft, fontSize: 13, marginTop: 2 },
  chip: { alignSelf: 'flex-start', backgroundColor: colors.brown, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 14 },
  chipText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.creamDark, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 20,  color: colors.brown, marginTop: 14 },
  emptySub: { color: colors.brownSoft, marginTop: 4, textAlign: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18,
    backgroundColor: colors.orange, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 22,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24,
    borderWidth: 2, borderColor: colors.brown, borderRadius: 999, paddingVertical: 14,
  },
  logoutText: { color: colors.brown, fontWeight: '700', fontSize: 16 },
});