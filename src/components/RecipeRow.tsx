import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { shadow } from '../theme/shadow';
import { Recipe } from '../types/recipe';
import PressableScale from './PressableScale';
import RecipePhoto from './RecipePhoto';
import ScorePill from './ScorePill';

export default function RecipeRow({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  return (
    <PressableScale
      style={styles.row}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      <RecipePhoto tone={recipe.tone} uri={recipe.imageUrl} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.cat}>{recipe.category}</Text>
      </View>
      <ScorePill score={recipe.score} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white,
    borderRadius: 20, padding: 10, marginBottom: 12, ...shadow,
  },
  thumb: { width: 68, height: 68, borderRadius: 16 },
  info: { flex: 1 },
  title: { color: colors.brown, fontSize: 15, fontFamily: 'Fredoka_700Bold' },
  cat: { color: colors.brownSoft, fontSize: 13, marginTop: 2 },
});