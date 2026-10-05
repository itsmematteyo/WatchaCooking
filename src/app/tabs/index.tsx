import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { shadow } from '../../theme/shadow';
import { Recipe } from '../../types/recipe';
import { Category, fetchCategories, fetchPicks, fetchTop, searchRecipes } from '../../api/recipes';
import SkeletonRow from '../../components/SkeletonRow';
import RecipeCard from '../../components/RecipeCard';
import RecipeRow from '../../components/RecipeRow';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const fade = useRef(new Animated.Value(0)).current;

  const [picks, setPicks] = useState<Recipe[]>([]);
  const [topRated, setTopRated] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadHome() {
    try {
      // throw new Error('Network request failed'); // TEMP: remove after testing
      const [p, t, c] = await Promise.all([fetchPicks(0, 4), fetchTop(0, 4), fetchCategories()]);
      setPicks(p);
      setTopRated(t);
      setCategories(c);
      setError('');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    }
  }

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (data) setUsername(data.username);
    });
  }, []);

  // reload every time Home comes back into view (new recipes, new votes)
  useFocusEffect(
    useCallback(() => {
      loadHome().then(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    setLoading(true);
    await loadHome();
    setLoading(false);
    setRefreshing(false);
  }

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  // search the database 300 ms after the user stops typing
  useEffect(() => {
    if (!q) {
      setResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    let active = true;
    const timer = setTimeout(async () => {
      let data: Recipe[] = [];
      try {
        data = await searchRecipes(q);
      } catch { }
      if (!active) return;
      setResults(data);
      setSearchLoading(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  function submit() {
    if (q && !recent.includes(q)) setRecent([q, ...recent].slice(0, 5));
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade, paddingTop: insets.top + 12 }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.orange}
            colors={[colors.orange]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Good day,</Text>
            <Text style={styles.name}>{username || 'Chef'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(username || 'C').charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={[styles.search, focused && styles.searchFocused]}>
          <Ionicons name="search" size={20} color={colors.brownSoft} />
          <TextInput
            style={styles.input}
            placeholder="Search recipes"
            placeholderTextColor="#A38B77"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={submit}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={colors.brownSoft} />
            </Pressable>
          )}
        </View>

        {searching ? (
          searchLoading ? (
            <View style={{ marginTop: 18 }}>
              <SkeletonRow count={3} />
            </View>
          ) : results.length > 0 ? (
            <View style={{ marginTop: 18 }}>
              {results.map((r) => <RecipeRow key={r.id} recipe={r} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyCircle}>
                <Ionicons name="restaurant-outline" size={34} color={colors.brown} />
              </View>
              <Text style={styles.emptyTitle}>No recipes found.</Text>
              <Text style={styles.emptySub}>Try another word</Text>
            </View>
          )
        ) : focused && recent.length > 0 ? (
          <View style={{ marginTop: 18 }}>
            <Text style={styles.small}>Recent searches</Text>
            <View style={styles.wrap}>
              {recent.map((t) => (
                <Pressable key={t} style={styles.chip} onPress={() => setQuery(t)}>
                  <Text style={styles.chipText}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : error && !loading && picks.length === 0 && topRated.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="cloud-offline-outline" size={34} color={colors.error} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.error }]}>Couldn't load recipes</Text>
            <Text style={styles.emptySub}>Check your internet connection, then try again.</Text>
            <Pressable style={styles.retry} onPress={onRefresh}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {['All', ...categories.map((c) => c.name)].map((c) => {
                const active = c === 'All';
                return (
                  <Pressable
                    key={c}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => !active && router.push(`/category/${c}`)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionRow}>
              <Text style={styles.section}>Chef's picks</Text>
              <Pressable style={styles.seeAllBtn} onPress={() => router.push('/list/picks')} hitSlop={8}>
                <Text style={styles.seeAll}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.orangeDark} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.skCards}>
                {[1, 2].map((i) => <View key={i} style={styles.skCard} />)}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20, paddingBottom: 14 }}
                style={styles.carousel}
              >
                {picks.map((r) => <RecipeCard key={r.id} recipe={r} badge />)}
              </ScrollView>
            )}

            <View style={styles.sectionRow}>
              <Text style={styles.section}>Top rated</Text>
              <Pressable style={styles.seeAllBtn} onPress={() => router.push('/list/top')} hitSlop={8}>
                <Text style={styles.seeAll}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.orangeDark} />
              </Pressable>
            </View>

            {loading ? (
              <SkeletonRow count={3} />
            ) : topRated.length === 0 ? (
              <Text style={styles.emptySub}>No recipes yet.</Text>
            ) : (
              topRated.map((r) => <RecipeRow key={r.id} recipe={r} />)
            )}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  hello: { color: colors.brownSoft, fontSize: 14 },
  name: { fontFamily: 'Fredoka_700Bold', fontSize: 27, color: colors.brown },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white,
    borderRadius: 16, height: 52, paddingHorizontal: 15, borderWidth: 2, borderColor: 'transparent', ...shadow,
  },
  searchFocused: { borderColor: colors.orange },
  input: { flex: 1, fontSize: 16, color: colors.brown },
  chips: { gap: 8, paddingVertical: 16 },
  chip: { backgroundColor: colors.chipBg, borderRadius: 999, borderWidth: 1.5, borderColor: colors.line, paddingVertical: 8, paddingHorizontal: 15 },
  chipActive: { backgroundColor: colors.brown, borderColor: colors.brown },
  chipText: { color: colors.brown, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.white },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 12 },
  section: { fontFamily: 'Fredoka_700Bold', fontSize: 20, color: colors.brown },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { color: colors.orangeDark, fontWeight: '700', fontSize: 14 },
  carousel: { marginHorizontal: -20, paddingLeft: 20 },
  skCards: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  skCard: { width: 164, height: 190, borderRadius: 22, backgroundColor: colors.creamDark },
  small: { color: colors.brownSoft, fontSize: 13 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 56 },
  emptyCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.creamDark, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 19, color: colors.brown, marginTop: 14 },
  emptySub: { color: colors.brownSoft, marginTop: 3 },
  retry: { marginTop: 16, backgroundColor: colors.brown, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 },
  retryText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});