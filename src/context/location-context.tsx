import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getCurrentCityAndCoords, LocationFailure, promptEnableLocationServices, type Coords } from '@/lib/location';

export type LocationStatus = 'locating' | 'resolved' | 'permission-denied' | 'services-disabled' | 'error';

type LocationContextValue = {
  status: LocationStatus;
  city: string | null;
  coords: Coords | null;
  /** Android only: whether the permission dialog can still be shown again. */
  canAskAgain: boolean;
  /** Re-checks permission/services and re-requests the current position. */
  refresh: () => void;
  /** Android: opens the system "turn on Location" dialog, then retries. */
  enableLocationServices: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * Resolves the device's location once per app session (mounted above the
 * tabs, so it survives switching screens) and shares it with every screen
 * that needs it — Home's chip and the report form read the same fix instead
 * of each re-requesting GPS on their own.
 *
 * `autoStart` gates the initial request: the location permission dialog and
 * the notification permission dialog can't both be shown at once, so the
 * caller only flips this on once the notification prompt has been answered.
 */
export function LocationProvider({ children, autoStart = true }: { children: ReactNode; autoStart?: boolean }) {
  const [status, setStatus] = useState<LocationStatus>('locating');
  const [city, setCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);

  // A slow request that's still in flight when a retry starts must not be
  // allowed to resolve later and clobber the retry's result.
  const requestId = useRef(0);

  const locate = useCallback(() => {
    const id = ++requestId.current;
    getCurrentCityAndCoords()
      .then((result) => {
        if (id !== requestId.current) return;
        setCoords(result.coords);
        setCity(result.city);
        setStatus('resolved');
      })
      .catch((error: unknown) => {
        if (id !== requestId.current) return;
        if (error instanceof LocationFailure) {
          setCanAskAgain(error.canAskAgain);
          setStatus(
            error.code === 'permission-denied' ? 'permission-denied' : error.code === 'services-disabled' ? 'services-disabled' : 'error'
          );
        } else {
          setStatus('error');
        }
      });
  }, []);

  useEffect(() => {
    if (autoStart) locate();
  }, [autoStart, locate]);

  const refresh = useCallback(() => {
    setStatus('locating');
    locate();
  }, [locate]);

  const enableLocationServices = useCallback(() => {
    setStatus('locating');
    promptEnableLocationServices()
      .then(() => locate())
      .catch(() => setStatus('services-disabled'));
  }, [locate]);

  const value = useMemo(
    () => ({ status, city, coords, canAskAgain, refresh, enableLocationServices }),
    [status, city, coords, canAskAgain, refresh, enableLocationServices]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useCurrentLocation(): LocationContextValue {
  const value = useContext(LocationContext);
  if (!value) throw new Error('useCurrentLocation must be used within a LocationProvider');
  return value;
}
