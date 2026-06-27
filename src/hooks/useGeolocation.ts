import { useState, useEffect, useCallback } from 'react';

export type GeolocationStatus = 'idle' | 'pending' | 'granted' | 'denied' | 'error';

export interface GeolocationState {
  lat: number;
  lng: number;
  accuracy: number | null;
  status: GeolocationStatus;
  error: string | null;
  requestPermission: () => void;
}

// Fallback city centers
export const CITY_FALLBACKS: Record<string, { lat: number; lng: number; label: string }> = {
  bengaluru: { lat: 12.9345, lng: 77.6265, label: 'Bengaluru (Koramangala)' },
  mumbai: { lat: 19.0596, lng: 72.8295, label: 'Mumbai (Bandra West)' },
  delhi: { lat: 28.6129, lng: 77.2295, label: 'Delhi (Connaught Place)' },
  gurgaon: { lat: 28.4595, lng: 77.0266, label: 'Gurgaon (Cyber City)' },
  noida: { lat: 28.5355, lng: 77.3910, label: 'Noida (Sector 18)' },
};

const DEFAULT_FALLBACK = CITY_FALLBACKS.bengaluru;

export function useGeolocation(): GeolocationState & { setFallbackCity: (key: string) => void } {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [lat, setLat] = useState<number>(DEFAULT_FALLBACK.lat);
  const [lng, setLng] = useState<number>(DEFAULT_FALLBACK.lng);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setLat(pos.coords.latitude);
    setLng(pos.coords.longitude);
    setAccuracy(pos.coords.accuracy);
    setStatus('granted');
    setError(null);
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    setStatus('denied');
    setError(err.message);
    // Keep previous coordinates (either last good GPS or fallback city)
  }, []);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setStatus('pending');
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  }, [onSuccess, onError]);

  // Watch position after granted for continuous updates
  useEffect(() => {
    if (status !== 'granted') return;
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [status, onSuccess, onError]);

  const setFallbackCity = useCallback((key: string) => {
    const city = CITY_FALLBACKS[key];
    if (city) {
      setLat(city.lat);
      setLng(city.lng);
    }
  }, []);

  return { lat, lng, accuracy, status, error, requestPermission, setFallbackCity };
}
