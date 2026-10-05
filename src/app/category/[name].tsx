import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadow } from '../../theme/shadow';
import { usePagedList } from '../../hooks/usePagedList';
import { fetchByCategory } from '../../api/recipes';
import SkeletonRow from '../../components/SkeletonRow';
import RecipeCard from '../../components/RecipeCard';

export default function Category() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name: string }>();
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const [sort, setSort] = useState<'top' | 'new'>('top');

  const { items, loading, loadMore } = usePagedList(
    (from, to) => fetchByCategory(name, sort, from, to),
    [name, sort]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.top}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={colors.brown} />
        </Pressable>
        <Text style={styles.title}>{name}</Text>
      </View>

      <View style={styles.sortRow}>
        {([['top', 'Top rated'], ['new', 'Newest']] as const).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.chip, sort === key && styles.chipActive]}
            onPress={() => setSort(key)}
          >
            <Text style={[styles.chipText, sort === key && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <View style={{ flex: 1, marginBottom: 12 }}>
            <RecipeCard recipe={item} width="100%" />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <SkeletonRow />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptySub}>Be the first to post a {name} recipe.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && items.length > 0 ? (
            <ActivityIndicator color={colors.orange} style={{ marginVertical: 16 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 14 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow },
  title: { fontFamily: 'Fredoka_700Bold', fontSize: 27, color: colors.brown },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  chip: { backgroundColor: colors.chipBg, borderRadius: 999, borderWidth: 1.5, borderColor: colors.line, paddingVertical: 8, paddingHorizontal: 15 },
  chipActive: { backgroundColor: colors.brown, borderColor: colors.brown },
  chipText: { color: colors.brown, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.white },
  empty: { alignItems: 'center', marginTop: 56 },
  emptyTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 19, color: colors.brown },
  emptySub: { color: colors.brownSoft, marginTop: 4 },
});