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
              const { lat, lon, type, name } = data[0];
              const latNum = parseFloat(lat);
              const lonNum = parseFloat(lon);
              
              // Determine zoom level based on result type
              let zoomLevel = 14; // Default higher zoom
              if (type === 'city' || type === 'town') {
                zoomLevel = 13; // Cities
              } else if (type === 'administrative') {
                zoomLevel = 12; // States/regions
              } else if (type === 'village' || type === 'hamlet') {
                zoomLevel = 18; // Villages zoom in closer
              } else if (type === 'house' || type === 'building' || type === 'amenity') {
                zoomLevel = 17; // Buildings/amenities zoom in very close
              } else if (type === 'street' || type === 'road') {
                zoomLevel = 16; // Streets
              }
              
              mapInstance.current.flyTo([latNum, lonNum], zoomLevel, { duration: 2 });
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
