import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

import { FontFamily, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? theme.error : isFocused ? theme.accent : theme.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { borderColor, backgroundColor: theme.surface, color: theme.text },
          Platform.OS === 'web' && webNoOutlineStyle,
          style,
        ]}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  error: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
});

// react-native-web renders a browser default focus ring on <input> that would
// otherwise cover our accent-colored border on focus. Kept outside
// StyleSheet.create so this web-only prop doesn't widen the input style's type.
const webNoOutlineStyle = { outlineStyle: 'none' } as unknown as TextStyle;
