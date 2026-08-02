import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { FontFamily, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading = false, disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary' ? theme.accent : variant === 'danger' ? theme.error : 'transparent';
  const borderColor = variant === 'ghost' ? theme.border : backgroundColor;
  const textColor = variant === 'ghost' ? theme.text : '#ffffff';

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, borderColor, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: Radius,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
});
