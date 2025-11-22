'use client';

import { useEffect, useRef, useState } from 'react';

interface MapProps {
  location: string;
  zoom: number;
}

export default function MapComponent({ location, zoom }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce location input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedLocation(location);
    }, 800);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [location]);

  // Initialize and update map
  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = () => {
      if (typeof window === 'undefined' || !(window as any).L) {
        setTimeout(initMap, 100);
        return;
      }

      const L = (window as any).L;

      // Initialize map if not already done
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapContainer.current).setView([51.1657, 10.4515], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);
      }

      // Update map location
      if (debouncedLocation && debouncedLocation.toLowerCase() !== 'germany') {
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedLocation)}&limit=1`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              const { lat, lon, name } = data[0];
              mapInstance.current.flyTo([parseFloat(lat), parseFloat(lon)], zoom, { duration: 2 });
            }
          })
          .catch((err) => console.error('Geocoding error:', err));
      } else {
        // Reset to Germany
        mapInstance.current.flyTo([51.1657, 10.4515], 4, { duration: 2 });
      }
    };

    initMap();
  }, [debouncedLocation, zoom]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '1.5rem',
      }}
    />
  );
}
