import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { shadow } from '../theme/shadow';
import { Recipe } from '../types/recipe';
import PressableScale from './PressableScale';
import RecipePhoto from './RecipePhoto';
import ScorePill from './ScorePill';

type Props = { recipe: Recipe; width?: number | '100%'; badge?: boolean };

export default function RecipeCard({ recipe, width = 164, badge }: Props) {
  const router = useRouter();
  return (
    <PressableScale
      style={[styles.card, { width }]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
     <RecipePhoto tone={recipe.tone} uri={recipe.imageUrl} style={styles.photo} />
      <View style={styles.body}>
        {badge && recipe.isCurated ? (
          <View style={styles.badge}><Text style={styles.badgeText}>Curated</Text></View>
        ) : (
          <Text style={styles.cat}>{recipe.category}</Text>
        )}
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        <ScorePill score={recipe.score} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 22, overflow: 'hidden', ...shadow },
  photo: { height: 108 },
  body: { padding: 11, gap: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.green, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  cat: { color: colors.brownSoft, fontSize: 13 },
    title: { color: colors.brown, fontSize: 15, fontFamily: 'Fredoka_700Bold', minHeight: 38 },
});