import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, MessageCircle, Navigation, X } from 'lucide-react';
import type { Partner } from '@shared/schema';

interface PartnerLocation {
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  partners: Partner[];
  selectedPartner: Partner | null;
  onPartnerSelect: (partner: Partner) => void;
  userLocation: PartnerLocation | null;
}

// Custom interactive map using HTML5 Canvas and DOM overlays
export function InteractiveMap({ partners, selectedPartner, onPartnerSelect, userLocation }: InteractiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapBounds, setMapBounds] = useState({
    minLat: 6.0, maxLat: 37.0, minLng: 68.0, maxLng: 97.0
  });
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);

  // Calculate map bounds based on partner locations
  useEffect(() => {
    if (partners.length === 0) return;
    
    const lats = partners.map(p => Number(p.lat));
    const lngs = partners.map(p => Number(p.lng));
    
    if (userLocation) {
      lats.push(userLocation.lat);
      lngs.push(userLocation.lng);
    }
    
    const padding = 2; // degrees
    setMapBounds({
      minLat: Math.min(...lats) - padding,
      maxLat: Math.max(...lats) + padding,
      minLng: Math.min(...lngs) - padding,
      maxLng: Math.max(...lngs) + padding
    });
  }, [partners, userLocation]);

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = (lat: number, lng: number, canvas: HTMLCanvasElement) => {
    const { minLat, maxLat, minLng, maxLng } = mapBounds;
    const x = ((lng - minLng) / (maxLng - minLng)) * canvas.width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * canvas.height;
    return { x, y };
  };

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient (water/land effect)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e6f3ff');
    gradient.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines for geographic reference
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Vertical lines (longitude)
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines (latitude)
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw partner markers
    partners.forEach(partner => {
      const { x, y } = latLngToCanvas(Number(partner.lat), Number(partner.lng), canvas);
      
      // Marker colors by type
      const colors = {
        DEALER: '#22c55e',
        DISTRIBUTOR: '#3b82f6', 
        STUDIO: '#f97316',
        SERVICE_CENTER: '#6b7280'
      };

      // Draw marker shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw marker
      const isSelected = selectedPartner?.id === partner.id;
      const isHovered = hoveredPartner === String(partner.id);
      const radius = isSelected || isHovered ? 10 : 8;
      
      ctx.fillStyle = colors[partner.type];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw marker border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw inner dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw user location if available
    if (userLocation) {
      const { x, y } = latLngToCanvas(userLocation.lat, userLocation.lng, canvas);
      
      // Pulsing effect for user location
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

  }, [partners, userLocation, mapBounds, selectedPartner, hoveredPartner]);

  // Handle mouse events on canvas
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if click is near any partner marker
    for (const partner of partners) {
      const { x, y } = latLngToCanvas(Number(partner.lat), Number(partner.lng), canvas);
      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
      
      if (distance <= 12) { // Click tolerance
        onPartnerSelect(partner);
        return;
      }
    }
    
    // Click elsewhere - deselect
    onPartnerSelect(null as any);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if hovering over any partner marker
    let found = false;
    for (const partner of partners) {
      const { x, y } = latLngToCanvas(Number(partner.lat), Number(partner.lng), canvas);
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      
      if (distance <= 12) {
        setHoveredPartner(String(partner.id));
        canvas.style.cursor = 'pointer';
        found = true;
        break;
      }
    }
    
    if (!found) {
      setHoveredPartner(null);
      canvas.style.cursor = 'default';
    }
  };

  return (
    <div ref={containerRef} className="relative h-full min-h-[500px] rounded-lg overflow-hidden border bg-gray-50">
      {/* Canvas map */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      />
      
      {/* Partner info popup */}
      {selectedPartner && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-xl max-w-sm w-full mx-4 z-20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">{selectedPartner.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedPartner.city}, {selectedPartner.state}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPartnerSelect(null as any)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="secondary" className="text-xs">
              {selectedPartner.type.charAt(0) + selectedPartner.type.slice(1).toLowerCase()}
            </Badge>
            {selectedPartner.services.map((service) => (
              <Badge key={service} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            {selectedPartner.phone && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`tel:${selectedPartner.phone}`)}
              >
                <Phone className="w-3 h-3 mr-1" />
                Call
              </Button>
            )}
            {selectedPartner.whatsapp && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://wa.me/${selectedPartner.whatsapp?.replace(/\D/g, '') || ''}`)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                WhatsApp
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            className="w-full"
            onClick={() => window.open(`https://maps.google.com/maps?q=${selectedPartner.lat},${selectedPartner.lng}`)}
          >
            <Navigation className="w-3 h-3 mr-1" />
            Get Directions
          </Button>
        </div>
      )}
      
      {/* Map overlay info */}
      <div className="absolute top-4 left-4 bg-white/95 px-3 py-2 rounded-lg shadow-md">
        <div className="text-sm font-medium text-gray-900">
          {partners.length} P91 Locations
        </div>
        <div className="text-xs text-gray-600">
          Click markers for details
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-lg shadow-md">
        <div className="text-xs font-medium mb-2">Location Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Dealers</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Distributors</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Studios</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Service Centers</span>
          </div>
        </div>
      </div>
      
      {/* Full maps button */}
      <div className="absolute top-4 right-4">
        <Button
          onClick={() => {
            const centerLat = (mapBounds.minLat + mapBounds.maxLat) / 2;
            const centerLng = (mapBounds.minLng + mapBounds.maxLng) / 2;
            window.open(`https://maps.google.com/maps?q=${centerLat},${centerLng}&z=6`, '_blank');
          }}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <MapPin className="w-4 h-4 mr-1" />
          Open in Google Maps
        </Button>
      </div>
    </div>
  );
}