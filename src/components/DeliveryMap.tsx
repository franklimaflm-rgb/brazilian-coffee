import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FyYWgyMDA5IiwiYSI6ImNtZWU5dXh0MzBqZTAybHM5ZHk4cGFjbnEifQ.eAX9kvVinXThpyuNOUPhAw';

interface DeliveryMapProps {
  businessLocation: [number, number];
  customerLocation?: [number, number];
  deliveryRadius: number; // in kilometers
}

export const DeliveryMap = ({
  businessLocation,
  customerLocation,
  deliveryRadius
}: DeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Validate Mapbox token
      if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('example')) {
        throw new Error('Invalid Mapbox token');
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: businessLocation,
        zoom: 12,
        attributionControl: true,
        // Mobile-friendly settings
        touchZoomRotate: true,
        touchPitch: false,
        dragRotate: false,
        pitchWithRotate: false,
        // Performance optimizations
        antialias: false,
        preserveDrawingBuffer: false
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true,
        visualizePitch: false
      }), 'top-right');

      // Add fullscreen control for better mobile experience
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
        setIsLoading(false);

        if (!map.current) return;

        // Add business location marker
        const businessMarker = new mapboxgl.Marker({
          color: '#ef4444',
          scale: 1.2
        })
          .setLngLat(businessLocation)
          .setPopup(new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            maxWidth: '300px'
          }).setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-base text-gray-900 mb-2">Distribution Centre</h3>
              <div class="space-y-1 text-sm text-gray-600">
                <p>📍 Main Street, 68</p>
                <p>Lubenham, Market Harborough</p>
                <p>Leicestershire, LE16 9TG</p>
                <p class="mt-2 text-xs text-blue-600">📞 +44 7386797734</p>
              </div>
            </div>
          `))
          .addTo(map.current);

        // Create delivery radius circle
        const center = businessLocation;
        const radiusInKm = deliveryRadius;
        const points = 64;
        const coords: [number, number][] = [];

        for (let i = 0; i < points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusInKm * Math.cos(angle) / 111.32; // Convert km to degrees (approximate)
          const dy = radiusInKm * Math.sin(angle) / 110.54;
          coords.push([center[0] + dx, center[1] + dy]);
        }
        coords.push(coords[0]); // Close the circle

        map.current.addSource('delivery-radius', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coords]
            },
            properties: {}
          }
        });

        map.current.addLayer({
          id: 'delivery-radius-fill',
          type: 'fill',
          source: 'delivery-radius',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.1
          }
        });

        map.current.addLayer({
          id: 'delivery-radius-border',
          type: 'line',
          source: 'delivery-radius',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });

        // Add customer location marker if provided
        if (customerLocation) {
          new mapboxgl.Marker({
            color: '#22c55e',
            scale: 1.0
          })
            .setLngLat(customerLocation)
            .setPopup(new mapboxgl.Popup({
              offset: 25,
              closeButton: true,
              closeOnClick: false,
              maxWidth: '250px'
            }).setHTML(`
              <div class="p-3">
                <h3 class="font-semibold text-base text-gray-900 mb-2">Your Location</h3>
                <div class="text-sm text-gray-600">
                  <p>📍 Delivery address</p>
                  <p class="mt-2 text-xs text-green-600">✓ Within delivery area</p>
                </div>
              </div>
            `))
            .addTo(map.current);

          // Fit map to show both business and customer locations with responsive padding
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(businessLocation);
          bounds.extend(customerLocation);

          // Use different padding for mobile vs desktop
          const isMobile = window.innerWidth < 768;
          const padding = isMobile ? 30 : 50;

          map.current.fitBounds(bounds, {
            padding: padding,
            maxZoom: 14
          });
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError(true);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Failed to initialize Mapbox:', error);
      setMapError(true);
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [businessLocation, deliveryRadius]);

  // Handle customer location updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing customer markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker[data-customer="true"]');
    existingMarkers.forEach(marker => marker.remove());

    if (customerLocation) {
      const customerMarker = new mapboxgl.Marker({
        color: '#22c55e',
        scale: 1.0
      })
        .setLngLat(customerLocation)
        .setPopup(new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '250px'
        }).setHTML(`
          <div class="p-3">
            <h3 class="font-semibold text-base text-gray-900 mb-2">Your Location</h3>
            <div class="text-sm text-gray-600">
              <p>📍 Delivery address</p>
              <p class="mt-2 text-xs text-green-600">✓ Within delivery area</p>
            </div>
          </div>
        `))
        .addTo(map.current);

      // Add data attribute to identify customer markers
      const markerElement = customerMarker.getElement();
      markerElement.setAttribute('data-customer', 'true');

      // Fit map to show both business and customer locations with responsive padding
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(businessLocation);
      bounds.extend(customerLocation);

      // Use different padding for mobile vs desktop
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 30 : 50;

      map.current.fitBounds(bounds, {
        padding: padding,
        maxZoom: 14
      });
    }
  }, [customerLocation, mapLoaded, businessLocation]);

  // Fallback placeholder implementation for when Mapbox fails to load
  const renderFallbackMap = () => {
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 relative rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Distribution Centre</h3>
          <p className="text-sm text-gray-600 mb-4">Lubenham, Market Harborough</p>
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            5km Delivery Radius
          </div>
          {customerLocation && (
            <div className="mt-4">
              <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600">Your Location</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div
        ref={mapContainer}
        className="w-full h-80 md:h-96 rounded-lg border border-border overflow-hidden shadow-sm relative"
        style={{ minHeight: '320px' }}
      >
        {isLoading && !mapError && (
          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
        {mapError && renderFallbackMap()}
      </div>

      {mapError && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Map temporarily unavailable.</strong> Showing simplified delivery area visualization.
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>Delivery Coverage:</strong> We deliver within a 5km radius of our distribution centre in Lubenham.
        </p>
        <p>
          <strong>Areas Covered:</strong> Market Harborough, Lubenham, Great Bowden, Little Bowden, and surrounding villages.
        </p>
        {mapLoaded && !mapError && (
          <p className="mt-2 text-xs text-green-600">
            ✓ Interactive map loaded successfully. Click markers for more information.
          </p>
        )}
      </div>
    </div>
  );
};
