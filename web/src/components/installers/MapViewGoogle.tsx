import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMaps } from '@/lib/google-maps-loader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Locate, RotateCcw } from 'lucide-react';
import p91LocationPinUrl from '@assets/P91 Location map-01_1761657473703.png';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface PartnerLocation {
  lat: number;
  lng: number;
}

interface PartnerAddress {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface PartnerContact {
  phone?: string;
  email?: string;
  whatsapp?: string;
}

interface MapPartner {
  id: string;
  name: string;
  type: 'DEALER' | 'DISTRIBUTOR' | 'STUDIO' | 'SERVICE_CENTER' | 'INSTALLER';
  services: string[];
  address: PartnerAddress;
  contact: PartnerContact;
  location: PartnerLocation;
}

interface MapViewGoogleProps {
  partners: MapPartner[];
  selectedPartner: MapPartner | null;
  onPartnerSelect: (partner: MapPartner) => void;
  userLocation: PartnerLocation | null;
}

// Clean light map with state and country boundaries
const LIGHT_MAP_STYLE = [
  // Light background
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e3f2fd" }] },
  
  // Show country borders (thick)
  { 
    featureType: "administrative.country", 
    elementType: "geometry.stroke", 
    stylers: [{ color: "#9e9e9e" }, { weight: 2 }] 
  },
  
  // Show state/province borders (thin)
  { 
    featureType: "administrative.province", 
    elementType: "geometry.stroke", 
    stylers: [{ color: "#bdbdbd" }, { weight: 1 }] 
  },
  
  // Hide most labels except country names
  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ visibility: "on" }, { color: "#757575" }] },
  
  // Hide ALL roads
  { featureType: "road", stylers: [{ visibility: "off" }] },
  
  // Hide ALL POIs
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  
  // Hide transit
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];


export function MapViewGoogle({ partners, selectedPartner, onPartnerSelect, userLocation }: MapViewGoogleProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);
  const [infoWindow, setInfoWindow] = useState<any | null>(null);
  const [userLocationMarker, setUserLocationMarker] = useState<any | null>(null);
  const [userLocationCircle, setUserLocationCircle] = useState<any | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) {
        console.warn('Map container not found');
        return;
      }

      try {
        // Load Google Maps API using centralized loader
        await loadGoogleMaps();
        
        const { Map } = await google.maps.importLibrary("maps") as any;
        
        const mapInstance = new Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India
          zoom: 5,
          styles: LIGHT_MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          backgroundColor: "#ffffff",
          zoomControl: true,
          scaleControl: true,

        });

        setMap(mapInstance);

        // Initialize InfoWindow  
        const infoWindowInstance = new window.google.maps.InfoWindow({
          maxWidth: 320,
        });
        setInfoWindow(infoWindowInstance);

      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
  }, []);

  // Update markers when partners change
  useEffect(() => {
    if (!map || !infoWindow) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }

    const installerPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="16" r="14" fill="#2563eb" stroke="#ffffff" stroke-width="2"/><path d="M20 32 L14 22 H26 Z" fill="#2563eb"/><text x="20" y="20" text-anchor="middle" dominant-baseline="central" fill="white" font-size="14" font-weight="bold">I</text></svg>`;
    const installerPinUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(installerPinSvg);

    const newMarkers = partners.map(partner => {
      const lat = Number((partner as any).lat || (partner as any).location?.lat);
      const lng = Number((partner as any).lng || (partner as any).location?.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for partner ${partner.name}: lat=${lat}, lng=${lng}`);
        return null;
      }

      const isInstaller = (partner as any).type === 'INSTALLER';
      
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: isInstaller ? 'P91 Installer' : partner.name,
        icon: {
          url: isInstaller ? installerPinUrl : p91LocationPinUrl,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        }
      });

      // Add click listener to marker
      marker.addListener("click", () => {
        onPartnerSelect(partner);
        showInfoWindow(partner, marker);
      });

      return marker;
    }).filter(Boolean); // Remove null markers

    setMarkers(newMarkers);

    // Create new marker clusterer
    if (newMarkers.length > 0) {
      const clusterer = new MarkerClusterer({
        map,
        markers: newMarkers,
        renderer: {
          render: ({ count, position }) => {
            // Create cluster marker showing count
            const clusterSize = Math.max(50, Math.min(70, 40 + count * 3));
            const clusterSvg = `
              <svg width="${clusterSize}" height="${clusterSize}" viewBox="0 0 ${clusterSize} ${clusterSize}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${clusterSize/2}" cy="${clusterSize/2}" r="${clusterSize/2 - 2}" fill="#4db848" stroke="#ffffff" stroke-width="3"/>
                <text x="${clusterSize/2}" y="${clusterSize/2}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${Math.max(16, Math.min(22, 14 + count))}px" font-weight="bold">${count}</text>
              </svg>
            `;
            return new window.google.maps.Marker({
              position,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(clusterSvg),
                scaledSize: new window.google.maps.Size(clusterSize, clusterSize),
                anchor: new window.google.maps.Point(clusterSize/2, clusterSize/2)
              },
              zIndex: 1000
            });
          }
        }
      });
      setMarkerClusterer(clusterer);
    }

    // Fit map to markers if available
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker) {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        }
      });
      
      if (userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      }
      
      map.fitBounds(bounds);
    }

  }, [map, partners, infoWindow, onPartnerSelect, userLocation]);

  const showInfoWindow = useCallback((partner: MapPartner, marker: any) => {
    if (!infoWindow) return;

    const isInstaller = (partner as any).type === 'INSTALLER';
    const lat = Number((partner as any).lat || (partner as any).location?.lat);
    const lng = Number((partner as any).lng || (partner as any).location?.lng);

    let contentString: string;

    if (isInstaller) {
      const cityName = (partner as any).address?.city || '';
      contentString = `
        <div class="p-3 max-w-sm bg-white rounded-lg">
          <div class="mb-2">
            <h3 class="font-semibold text-lg text-blue-700">P91 Installer</h3>
            ${cityName ? `<p class="text-sm text-gray-600">${cityName}</p>` : ''}
          </div>
          <div class="flex flex-wrap gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Installer
            </span>
          </div>
        </div>
      `;
    } else {
      const addressParts = [
        (partner as any).address?.line1,
        (partner as any).address?.city,
        (partner as any).address?.state,
        (partner as any).address?.country
      ].filter(Boolean);
      const fullAddress = addressParts.join(', ');

      contentString = `
        <div class="p-3 max-w-sm bg-white rounded-lg">
          <div class="mb-2">
            <h3 class="font-semibold text-lg text-gray-900">${partner.name}</h3>
            ${fullAddress ? `<p class="text-sm text-gray-600">${fullAddress}</p>` : ''}
          </div>
          <div class="flex flex-wrap gap-1 mb-3">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ${partner.type.charAt(0) + partner.type.slice(1).toLowerCase()}
            </span>
            ${partner.services.map(service => 
              `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">${service}</span>`
            ).join('')}
          </div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" 
             class="inline-flex items-center px-3 py-1.5 bg-green-600 text-xs rounded-md text-white hover:bg-green-700 w-full justify-center">
            🧭 Directions
          </a>
        </div>
      `;
    }

    infoWindow.setContent(contentString);
    infoWindow.open(map, marker);
  }, [infoWindow, map]);

  // Handle selected partner change from list
  useEffect(() => {
    if (!map || !selectedPartner) return;

    const marker = markers.find(m => {
      if (!m) return false;
      const position = m.getPosition();
      return position && 
        Math.abs(position.lat() - Number((selectedPartner as any).lat || (selectedPartner as any).location?.lat)) < 0.0001 &&
        Math.abs(position.lng() - Number((selectedPartner as any).lng || (selectedPartner as any).location?.lng)) < 0.0001;
    });

    if (marker) {
      map.panTo({ 
        lat: Number((selectedPartner as any).lat || (selectedPartner as any).location?.lat), 
        lng: Number((selectedPartner as any).lng || (selectedPartner as any).location?.lng) 
      });
      map.setZoom(Math.max(map.getZoom() || 10, 12));
      showInfoWindow(selectedPartner, marker);
    }
  }, [selectedPartner, map, markers, showInfoWindow]);

  // Locate user function
  const locateMe = useCallback(() => {
    if (!navigator.geolocation || !map) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userPos = { lat: latitude, lng: longitude };

        // Pan to user location
        map.panTo(userPos);
        map.setZoom(14);

        // Clear existing user location markers
        if (userLocationMarker) {
          userLocationMarker.setMap(null);
        }
        if (userLocationCircle) {
          userLocationCircle.setMap(null);
        }

        // Add user location marker
        const marker = new window.google.maps.Marker({
          position: userPos,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillOpacity: 1,
            fillColor: "#ef4444",
            strokeWeight: 2,
            strokeColor: "#ffffff"
          },
          title: "Your Location"
        });
        setUserLocationMarker(marker);

        // Add accuracy circle
        const circle = new window.google.maps.Circle({
          map,
          center: userPos,
          radius: Math.max(50, accuracy || 100),
          fillOpacity: 0.12,
          fillColor: "#ef4444",
          strokeOpacity: 0.3,
          strokeWeight: 1,
          strokeColor: "#ef4444"
        });
        setUserLocationCircle(circle);

        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [map, userLocationMarker, userLocationCircle]);

  // Reset view function
  const resetView = useCallback(() => {
    if (!map) return;

    if (partners.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        if (marker) {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        }
      });
      map.fitBounds(bounds);
    } else {
      map.setCenter({ lat: 20.5937, lng: 78.9629 });
      map.setZoom(5);
    }

    // Close any open info windows
    if (infoWindow) {
      infoWindow.close();
    }
  }, [map, partners.length, markers, infoWindow]);

  return (
    <div className="relative h-full min-h-[500px] rounded-lg overflow-hidden border bg-white">
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          onClick={locateMe}
          disabled={isLocating}
          size="sm"
          className="bg-white hover:bg-gray-100 text-gray-900 border shadow-md"
        >
          <Locate className="w-4 h-4 mr-1" />
          {isLocating ? 'Locating...' : 'Locate Me'}
        </Button>
        
        <Button
          onClick={resetView}
          size="sm"
          variant="outline"
          className="bg-white hover:bg-gray-100 text-gray-900 border shadow-md"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset View
        </Button>
      </div>
      
      {/* Map info overlay */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md border">
        <div className="text-sm font-medium text-gray-900">
          {partners.length} P91 Locations
        </div>
        <div className="text-xs text-gray-600 flex gap-3 mt-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>
            Studios
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-600"></span>
            Installers
          </span>
        </div>
      </div>
    </div>
  );
}