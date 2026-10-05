import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadow } from '../../theme/shadow';
import { usePagedList } from '../../hooks/usePagedList';
import { fetchPicks, fetchTop } from '../../api/recipes';
import SkeletonRow from '../../components/SkeletonRow';
import RecipeCard from '../../components/RecipeCard';
import RecipeRow from '../../components/RecipeRow';

export default function SeeAll() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type: string }>();
  const type = Array.isArray(params.type) ? params.type[0] : params.type;

  const isPicks = type === 'picks';
  const title = isPicks ? "Chef's picks" : 'Top rated';
  const { items, loading, loadMore } = usePagedList(
    (from, to) => (isPicks ? fetchPicks(from, to) : fetchTop(from, to)),
    [type]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.top}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={colors.brown} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      <FlatList
        key={type}
        data={items}
        keyExtractor={(r) => r.id}
        numColumns={isPicks ? 2 : 1}
        columnWrapperStyle={isPicks ? { gap: 12 } : undefined}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) =>
          isPicks ? (
            <View style={{ flex: 1, marginBottom: 12 }}>
              <RecipeCard recipe={item} width="100%" badge />
            </View>
          ) : (
            <RecipeRow recipe={item} />
          )
        }
        ListEmptyComponent={loading ? <SkeletonRow /> : null}
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
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow },
  title: { fontFamily: 'Fredoka_700Bold', fontSize: 27, color: colors.brown },
});