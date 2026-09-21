import { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { compressImage } from '@/lib/image';

export type NicFile = {
  uri: string;
  name: string;
  mimeType: string;
};

/**
 * On Android, the gallery/document pickers often hand back a `content://` URI
 * (the system Photo Picker in particular) rather than a plain file path.
 * Those preview and read back fine, but React Native's networking layer
 * can't turn them into a multipart upload part ("Unsupported FormDataPart
 * implementation"). Copying into our own cache dir gives us a guaranteed
 * local file:// path that uploads reliably, and also doubles as an
 * existence check — copyAsync throws if the source can't be read.
 */
async function copyToLocalCache(sourceUri: string, filename: string): Promise<string> {
  const destUri = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

type NicPhotoPickerProps = {
  label: string;
  value: NicFile | null;
  onChange: (file: NicFile | null) => void;
  error?: string | null;
};

export function NicPhotoPicker({ label, value, onChange, error }: NicPhotoPickerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleTakePhoto() {
    setSheetOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'CivicPulse needs camera access to photograph your NIC.');
      return;
    }

    // Full quality out of the camera — compressImage below owns resizing and
    // compression in one pass, instead of double-compressing through both.
    const result = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const compressed = await compressImage(asset.uri, { width: asset.width, height: asset.height });
        const filename = 'nic-photo.jpg';
        const localUri = await copyToLocalCache(compressed.uri, filename);
        onChange({ uri: localUri, name: filename, mimeType: 'image/jpeg' });
      } catch {
        Alert.alert('Unable to use this photo', 'Please try taking the photo again.');
      }
    }
  }

  async function handleChooseFromLibrary() {
    setSheetOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'CivicPulse needs access to your photos to upload your NIC.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const compressed = await compressImage(asset.uri, { width: asset.width, height: asset.height });
        const filename = 'nic-photo.jpg';
        const localUri = await copyToLocalCache(compressed.uri, filename);
        onChange({ uri: localUri, name: filename, mimeType: 'image/jpeg' });
      } catch {
        Alert.alert('Unable to use this photo', 'Please try selecting it again.');
      }
    }
  }

  async function handleUploadDocument() {
    setSheetOpen(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'application/octet-stream';
      try {
        const localUri = await copyToLocalCache(asset.uri, asset.name);
        onChange({ uri: localUri, name: asset.name, mimeType });
      } catch {
        Alert.alert('Unable to use this document', 'Please try selecting it again.');
      }
    }
  }

  const isImage = value?.mimeType.startsWith('image/');

  return (
    <View>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {value ? (
        <View>
          {isImage ? (
            <Image source={{ uri: value.uri }} style={styles.preview} />
          ) : (
            <View style={[styles.docPreview, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Ionicons name="document-text-outline" size={22} color={theme.accent} />
              <Text style={[styles.docName, { color: theme.text }]} numberOfLines={1}>
                {value.name}
              </Text>
            </View>
          )}
          <Pressable onPress={() => onChange(null)} style={styles.removePhoto}>
            <Ionicons name="close-circle" size={26} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setSheetOpen(true)}
          style={[
            styles.uploadButton,
            { borderColor: error ? theme.error : theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Ionicons name="card-outline" size={20} color={theme.accent} />
          <Text style={[styles.uploadText, { color: theme.text }]}>{label}</Text>
        </Pressable>
      )}
      {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.three },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{label}</Text>

            <SheetOption icon="camera-outline" text="Take Photo" onPress={handleTakePhoto} color={theme.accent} />
            <SheetOption
              icon="images-outline"
              text="Choose from Library"
              onPress={handleChooseFromLibrary}
              color={theme.accent}
            />
            <SheetOption
              icon="document-text-outline"
              text="Upload Document"
              onPress={handleUploadDocument}
              color={theme.accent}
            />

            <Pressable
              onPress={() => setSheetOpen(false)}
              style={[styles.cancelButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SheetOption({
  icon,
  text,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.optionText, { color }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: FontFamily.medium, marginBottom: 8 },
  uploadButton: { borderWidth: 1, borderRadius: Radius, alignItems: 'center', paddingVertical: 18 },
  uploadText: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 6 },
  preview: { width: '100%', height: 140, borderRadius: Radius },
  docPreview: {
    width: '100%',
    height: 140,
    borderRadius: Radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  docName: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 6 },
  errorText: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 6 },
  removePhoto: { position: 'absolute', top: 8, right: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  sheetTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  optionText: { fontSize: 16, fontFamily: FontFamily.semiBold },
  cancelButton: {
    marginTop: Spacing.two,
    borderTopWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontFamily: FontFamily.medium },
});
