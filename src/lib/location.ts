import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

export type CurrentLocationResult = {
  coords: Coords;
  city: string | null;
};

export type LocationFailureCode = 'permission-denied' | 'services-disabled' | 'timeout' | 'unknown';

export class LocationFailure extends Error {
  code: LocationFailureCode;
  canAskAgain: boolean;

  constructor(code: LocationFailureCode, canAskAgain = true) {
    super(code);
    this.code = code;
    this.canAskAgain = canAskAgain;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new LocationFailure('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Resolves a human-readable city/town name from coordinates using
 * OpenStreetMap's free Nominatim reverse-geocoding API — no Google Maps
 * API key or billing account required.
 */
async function reverseGeocodeCity(coords: Coords): Promise<string | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coords.latitude),
    lon: String(coords.longitude),
    zoom: '14',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: {
      // Nominatim's usage policy requires a way to identify the requesting app.
      'User-Agent': 'CivicPulse (civic issue reporting app)',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) return null;

  const json = await response.json();
  const address = json?.address ?? {};

  return address.city ?? address.town ?? address.municipality ?? address.village ?? address.county ?? null;
}

export async function getCurrentCityAndCoords(): Promise<CurrentLocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new LocationFailure('permission-denied', permission.canAskAgain);
  }

  // Permission can be granted while the device's Location/GPS toggle is still off —
  // in that case getCurrentPositionAsync would just hang waiting for a fix.
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new LocationFailure('services-disabled');
  }

  // A fresh GPS fix can take a while (and can time out) on real hardware,
  // especially right after a previous request — the OS still has a recent fix
  // cached, so check that first and only fall back to a slow fresh request
  // when there isn't one. This is what makes "retry" fast and reliable.
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60000, requiredAccuracy: 200 }).catch(() => null);

  // No location fix (e.g. an emulator with no GPS mocked) would otherwise hang
  // getCurrentPositionAsync forever — expo-location has no built-in timeout for it.
  const position = lastKnown ?? (await withTimeout(Location.getCurrentPositionAsync({}), 20000));
  const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
  const city = await reverseGeocodeCity(coords).catch(() => null);

  return { coords, city };
}

/**
 * Prompts the Android system dialog to turn Location on. No-op on other
 * platforms, where the user must use Settings instead.
 */
export async function promptEnableLocationServices(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Location.enableNetworkProviderAsync();
}
