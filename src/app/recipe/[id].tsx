import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { shadow } from '../../theme/shadow';
import { Recipe } from '../../types/recipe';
import { deleteRecipe, fetchRecipe, getMyVote, saveVote } from '../../api/recipes';
import RecipePhoto from '../../components/RecipePhoto';

export default function RecipeDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [userId, setUserId] = useState('');
  const [vote, setVote] = useState<0 | 1 | -1>(0);
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState<number[]>([]);
  const pop = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const r = await fetchRecipe(id);
          if (!active) return;
          if (!r) {
            setStatus('missing');
            return;
          }
          const mine = user ? await getMyVote(id, user.id) : 0;
          if (!active) return;
          setUserId(user?.id ?? '');
          setRecipe(r);
          setScore(r.score);
          setVote(mine);
          setStatus('ready');
        } catch {
          if (active) setStatus('error');
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [id])
  );

  if (status !== 'ready' || !recipe) {
    return (
      <View style={[styles.container, styles.center]}>
        {status === 'loading' ? (
          <ActivityIndicator color={colors.orange} size="large" />
        ) : (
          <>
            <Text style={styles.emptyTitle}>
              {status === 'missing' ? 'Recipe not found' : "Couldn't load this recipe"}
            </Text>
            <Pressable style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Go back</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const isAuthor = !!recipe.authorId && recipe.authorId === userId;

  async function castVote(v: 1 | -1) {
    const next: 0 | 1 | -1 = vote === v ? 0 : v;
    const prevVote = vote;
    const prevScore = score;
    setScore(score - vote + next); // update the screen right away
    setVote(next);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.25, duration: 100, useNativeDriver: true }),
      Animated.timing(pop, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    try {
      await saveVote(recipe!.id, userId, next);
    } catch {
      setVote(prevVote); // roll back if it failed
      setScore(prevScore);
      Alert.alert('Vote not saved', 'Please check your connection and try again.');
    }
  }

  function toggle(i: number) {
    setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  }

  function onDelete() {
    Alert.alert('Delete recipe', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(recipe!.id);
            router.back();
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View>
          <RecipePhoto tone={recipe.tone} uri={recipe.imageUrl} style={styles.photo} />
          <Pressable
            style={[styles.back, { top: insets.top + 12 }]}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.brown} />
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>{recipe.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{recipe.category}</Text>
            </View>
            {recipe.isCurated ? (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                <Text style={styles.badgeText}>Curated</Text>
              </View>
            ) : (
              <View style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorInitial}>{(recipe.author ?? '?').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.authorText}>by {recipe.author}</Text>
              </View>
            )}
          </View>

          {recipe.description ? <Text style={styles.desc}>{recipe.description}</Text> : null}

          <View style={styles.actionRow}>
            <View style={styles.votePill}>
              <Pressable onPress={() => castVote(1)} hitSlop={8} accessibilityLabel="Upvote">
                <Ionicons
                  name={vote === 1 ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                  size={30}
                  color={vote === 1 ? colors.orange : colors.brown}
                />
              </Pressable>
              <Animated.Text style={[styles.score, { transform: [{ scale: pop }] }]}>{score}</Animated.Text>
              <Pressable onPress={() => castVote(-1)} hitSlop={8} accessibilityLabel="Downvote">
                <Ionicons
                  name={vote === -1 ? 'arrow-down-circle' : 'arrow-down-circle-outline'}
                  size={30}
                  color={vote === -1 ? colors.brown : colors.brownSoft}
                />
              </Pressable>
            </View>

            {isAuthor && (
              <View style={styles.authorActions}>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => router.push(`/edit/${recipe.id}`)}
                  accessibilityLabel="Edit recipe"
                >
                  <Ionicons name="create-outline" size={22} color={colors.brown} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={onDelete} accessibilityLabel="Delete recipe">
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
            )}
          </View>

          <Text style={styles.section}>Ingredients</Text>
          {recipe.ingredients.map((text, i) => {
            const done = checked.includes(i);
            return (
              <Pressable
                key={i}
                style={styles.ingRow}
                onPress={() => toggle(i)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
              >
                <View style={[styles.box, done && styles.boxDone]}>
                  {done && <Ionicons name="checkmark" size={16} color={colors.white} />}
                </View>
                <Text style={[styles.ingText, done && styles.ingDone]}>{text}</Text>
              </Pressable>
            );
          })}

          <Text style={styles.section}>Steps</Text>
          {recipe.steps.map((text, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 20, color: colors.brown },
  photo: { height: 290 },
  back: {
    position: 'absolute', left: 18, width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  sheet: {
    marginTop: -28, backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 24,
  },
  title: { fontFamily: 'Fredoka_700Bold', fontSize: 28, color: colors.brown, lineHeight: 34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  chip: { backgroundColor: colors.chipBg, borderRadius: 999, borderWidth: 1.5, borderColor: colors.line, paddingVertical: 6, paddingHorizontal: 13 },
  chipText: { color: colors.brown, fontWeight: '600', fontSize: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11 },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  authorInitial: { color: colors.white, fontWeight: '700', fontSize: 12 },
  authorText: { color: colors.brownSoft, fontSize: 14 },
  desc: { color: colors.brownSoft, fontSize: 15, lineHeight: 22, marginTop: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  votePill: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white,
    borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14, ...shadow,
  },
  score: { fontFamily: 'serif', fontSize: 20, fontWeight: '700', color: colors.brown, minWidth: 34, textAlign: 'center' },
  authorActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow },
  section: { fontFamily: 'Fredoka_700Bold', fontSize: 21, color: colors.brown, marginTop: 26, marginBottom: 8 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.brown, alignItems: 'center', justifyContent: 'center' },
  boxDone: { backgroundColor: colors.green, borderColor: colors.green },
  ingText: { flex: 1, color: colors.brown, fontSize: 16 },
  ingDone: { textDecorationLine: 'line-through', color: colors.brownSoft },
  step: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  stepText: { flex: 1, color: colors.brown, fontSize: 16, lineHeight: 23 },
  backLink: { marginTop: 14 },
  backLinkText: { color: colors.orangeDark, fontWeight: '700', fontSize: 16 },
});