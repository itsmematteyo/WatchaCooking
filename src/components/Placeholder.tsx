import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function placeholder({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'serif', fontSize: 26, fontWeight: '700', color: colors.brown },
  sub: { marginTop: 6, color: colors.brownSoft },
});