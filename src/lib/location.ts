import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

export type CurrentLocationResult = {
  coords: Coords;
  city: string | null;
  /** A short, human-readable address built from the reverse-geocoded street/area — used to prefill the report's address field. */
  address: string | null;
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

type ReverseGeocodeResult = { city: string | null; address: string | null };

/**
 * Builds a short "street, area" string from Nominatim's address parts —
 * concise enough to prefill the report's address field, unlike its verbose
 * `display_name` (which also spells out postcode, district, country, etc.).
 */
function formatDetectedAddress(address: Record<string, string | undefined>): string | null {
  const parts = [
    address.road ?? address.pedestrian ?? address.footway,
    address.suburb ?? address.neighbourhood ?? address.quarter,
    address.city ?? address.town ?? address.municipality ?? address.village,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Resolves a human-readable city/town name and a short street-level address
 * from coordinates using OpenStreetMap's free Nominatim reverse-geocoding
 * API — no Google Maps API key or billing account required.
 */
async function reverseGeocode(coords: Coords): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coords.latitude),
    lon: String(coords.longitude),
    zoom: '18',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: {
      // Nominatim's usage policy requires a way to identify the requesting app.
      'User-Agent': 'CivicPulse (civic issue reporting app)',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) return { city: null, address: null };

  const json = await response.json();
  const address = json?.address ?? {};

  return {
    city: address.city ?? address.town ?? address.municipality ?? address.village ?? address.county ?? null,
    address: formatDetectedAddress(address),
  };
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
  const { city, address } = await reverseGeocode(coords).catch(() => ({ city: null, address: null }));

  return { coords, city, address };
}

/**
 * Prompts the Android system dialog to turn Location on. No-op on other
 * platforms, where the user must use Settings instead.
 */
export async function promptEnableLocationServices(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Location.enableNetworkProviderAsync();
}
