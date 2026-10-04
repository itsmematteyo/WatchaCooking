import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = TextInputProps & {
  label: string;
  error?: string;
  secure?: boolean; // adds the Show/Hide toggle
};

export default function TextField({ label, error, secure, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, focused && styles.focused, !!error && styles.errorBox]}>
        <TextInput
          {...rest}
          style={styles.input}
          placeholderTextColor="#A38B77"
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: colors.brown, marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 15,
    height: 52,
  },
  focused: { borderColor: colors.orange },
  errorBox: { borderColor: colors.error },
  input: { flex: 1, fontSize: 16, color: colors.brown },
  toggle: { color: colors.brownSoft, fontWeight: '700', fontSize: 14 },
  error: { color: colors.error, fontSize: 13, fontWeight: '600', marginTop: 5 },
});