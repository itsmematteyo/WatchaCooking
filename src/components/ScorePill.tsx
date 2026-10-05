import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function ScorePill({ score }: { score: number }) {
  return (
    <View style={styles.pill}>
      <Ionicons name="arrow-up" size={12} color={colors.orangeDark} />
      <Text style={styles.text}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2,
    backgroundColor: colors.orangeTint, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9,
  },
  text: { color: colors.orangeDark, fontWeight: '700', fontSize: 13 },
});