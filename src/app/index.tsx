import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const APP_VERSION = '0.0.1';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function handleCameraPress() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setCameraVisible(true);
  }

  async function handleMapsPress() {
    setLocationError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Location permission denied.');
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setMapVisible(true);
    } catch {
      setLocationError('Could not retrieve location.');
    }
  }

  function handleLocateMe() {
    if (location == null) return;
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }

  const bottomPad = insets.bottom + BottomTabInset + Spacing.three;

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: bottomPad,
            paddingLeft: insets.left + Spacing.four,
            paddingRight: insets.right + Spacing.four,
          },
        ]}
      >
        <ThemedText style={styles.title}>Civic Pulse Citizen</ThemedText>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.button} onPress={handleCameraPress}>
            <Text style={styles.buttonText}>Test Camera</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={handleMapsPress}>
            <Text style={styles.buttonText}>Test Maps</Text>
          </Pressable>

          {locationError != null && (
            <ThemedText type="small" style={styles.error}>
              {locationError}
            </ThemedText>
          )}
        </View>

        <ThemedText type="small" style={styles.version}>
          v{APP_VERSION}
        </ThemedText>
      </View>

      {/* Camera Modal */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.fullScreen}>
          {cameraPermission?.granted && (
            <CameraView style={StyleSheet.absoluteFill} facing="back" />
          )}
          <View
            style={[
              styles.mapTopOverlay,
              { paddingTop: insets.top + Spacing.two },
            ]}
          >
            <Pressable style={styles.closeButton} onPress={() => setCameraVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Maps Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={styles.fullScreen}>
          {location != null && (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
            >
              <Marker coordinate={location} title="You are here" />
            </MapView>
          )}

          {/* Close button — top right */}
          <View
            style={[
              styles.mapTopOverlay,
              { paddingTop: insets.top + Spacing.two },
            ]}
          >
            <Pressable style={styles.closeButton} onPress={() => setMapVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          {/* Locate me button — bottom right */}
          <View
            style={[
              styles.mapBottomRight,
              { paddingBottom: insets.bottom + Spacing.three },
            ]}
          >
            <Pressable style={styles.locateButton} onPress={handleLocateMe}>
              <Text style={styles.locateButtonText}>⊙</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonGroup: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#d9534f',
    textAlign: 'center',
  },
  version: {
    opacity: 0.4,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
  },
  mapBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingRight: Spacing.three,
    alignItems: 'flex-end',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  locateButton: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  locateButtonText: {
    fontSize: 22,
    color: '#208AEF',
  },
});
