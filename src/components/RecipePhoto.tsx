import { Image, StyleSheet, View, StyleProp, ViewStyle, ImageStyle } from 'react-native';

const TONES = [
  { food: '#C9772E', dot: '#7C9C3E', ring: '#F3D9A8' },
  { food: '#B5472E', dot: '#E8B04A', ring: '#F1E0C0' },
  { food: '#6E8F3D', dot: '#D98A3A', ring: '#EAD7B0' },
  { food: '#8E5A3C', dot: '#E7A33F', ring: '#F4DDB6' },
  { food: '#D6A23C', dot: '#B5472E', ring: '#EFE0BF' },
];

type RecipePhotoStyle = StyleProp<ImageStyle> | StyleProp<ViewStyle>;

export default function RecipePhoto({ tone = 0, uri, style }: { tone?: number; uri?: string | null; style?: RecipePhotoStyle }) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.table, style as StyleProp<ImageStyle>]} resizeMode="cover" />;
  }
  const t = TONES[tone % TONES.length];
  return (
    <View style={[styles.table, style]}>
      <View style={styles.plate}>
        <View style={[styles.ring, { backgroundColor: t.ring }]}>
          <View style={[styles.food, { backgroundColor: t.food }]}>
            <View style={[styles.dot, { backgroundColor: t.dot, top: '14%', left: '18%' }]} />
            <View style={[styles.dot, { backgroundColor: '#4F7F32', top: '52%', left: '16%', width: '18%', height: '18%' }]} />
            <View style={[styles.dot, { backgroundColor: t.dot, top: '48%', left: '56%' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { backgroundColor: '#7A4E32', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plate: { height: '88%', aspectRatio: 1, borderRadius: 999, backgroundColor: '#FBF6EC', alignItems: 'center', justifyContent: 'center' },
  ring: { width: '86%', height: '86%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  food: { width: '82%', height: '82%', borderRadius: 999 },
  dot: { position: 'absolute', width: '28%', height: '28%', borderRadius: 999 },
});