import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { LANGUAGES, useLanguage } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';

/**
 * English / සිංහල / தமிழ் segmented control. Changing it re-renders every
 * screen in the chosen language and tells the API to answer in it too.
 */
export function LanguageSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  const theme = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={styles.wrapper}>
      {showLabel ? <Text style={[styles.label, { color: theme.textSecondary }]}>{t('language.label')}</Text> : null}
      <View style={[styles.group, { borderColor: theme.border, backgroundColor: theme.surface }]} accessibilityRole="radiogroup">
        {LANGUAGES.map(({ code, label }) => {
          const active = code === language;
          return (
            <Pressable
              key={code}
              onPress={() => setLanguage(code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.option, active && { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.optionText, { color: active ? '#fff' : theme.text }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, alignItems: 'center' },
  label: { fontSize: 12, fontFamily: FontFamily.medium },
  group: { flexDirection: 'row', borderWidth: 1, borderRadius: 20, padding: 3 },
  option: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  optionText: { fontSize: 13, fontFamily: FontFamily.medium },
});
