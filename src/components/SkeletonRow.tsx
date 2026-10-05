import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export default function SkeletonRow({ count = 4 }: { count?: number }) {
  const o = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [o]);

  return (
    <Animated.View style={{ opacity: o }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.thumb} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.line, { width: '70%' }]} />
            <View style={[styles.line, { width: '40%', height: 11 }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  thumb: { width: 68, height: 68, borderRadius: 16, backgroundColor: colors.creamDark },
  line: { height: 14, borderRadius: 8, backgroundColor: colors.creamDark },
});