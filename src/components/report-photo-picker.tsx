import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import { FontFamily, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/context/language-context';
import { compressImage } from '@/lib/image';

export type ReportPhoto = {
  uri: string;
  name: string;
  mimeType: string;
};

// See nic-photo-picker.tsx for why this copy step is needed — Android's photo
// picker can hand back a content:// URI that the upload layer can't read.
async function copyToLocalCache(sourceUri: string, filename: string): Promise<string> {
  const destUri = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

type ReportPhotoPickerProps = {
  value: ReportPhoto | null;
  onChange: (file: ReportPhoto | null) => void;
  error?: string | null;
};

/**
 * Camera-only by design — a report is meant to reflect what the citizen sees
 * right now, not an old or unrelated photo from their library.
 */
export function ReportPhotoPicker({ value, onChange, error }: ReportPhotoPickerProps) {
  const theme = useTheme();
  const { t } = useLanguage();

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('newReport.cameraNeededTitle'), t('newReport.cameraNeededBody'));
      return;
    }

    // Full quality out of the camera — compressImage below owns resizing and
    // compression in one pass, instead of double-compressing through both.
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const compressed = await compressImage(asset.uri, { width: asset.width, height: asset.height });
        const filename = 'report-photo.jpg';
        const localUri = await copyToLocalCache(compressed.uri, filename);
        onChange({ uri: localUri, name: filename, mimeType: 'image/jpeg' });
      } catch {
        Alert.alert(t('newReport.unusablePhotoTitle'), t('newReport.unusablePhotoBody'));
      }
    }
  }

  return (
    <View>
      <Text style={[styles.label, { color: theme.text }]}>{t('newReport.photoLabel')}</Text>
      {value ? (
        <View>
          <Image source={{ uri: value.uri }} style={styles.preview} />
          <Pressable onPress={() => onChange(null)} style={styles.removePhoto}>
            <Ionicons name="close-circle" size={26} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleTakePhoto}
          style={[
            styles.uploadButton,
            { borderColor: error ? theme.error : theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Ionicons name="camera-outline" size={22} color={theme.accent} />
          <Text style={[styles.uploadText, { color: theme.text }]}>{t('newReport.takePhoto')}</Text>
        </Pressable>
      )}
      {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: FontFamily.medium, marginBottom: 8 },
  uploadButton: { borderWidth: 1, borderRadius: Radius, alignItems: 'center', paddingVertical: 22 },
  uploadText: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 6 },
  preview: { width: '100%', height: 180, borderRadius: Radius },
  errorText: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 6 },
  removePhoto: { position: 'absolute', top: 8, right: 8 },
});
