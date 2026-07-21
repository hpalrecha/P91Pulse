import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapPin, Navigation, ChevronDown, Filter, Locate } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Google Maps component
import { MapViewGoogle } from './MapViewGoogle';

// Types
interface PartnerLocation {
  lat: number;
  lng: number;
}

interface PartnerContact {
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
}

interface PartnerAddress {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface Partner {
  id: string;
  name: string;
  type: 'DEALER' | 'DISTRIBUTOR' | 'STUDIO' | 'SERVICE_CENTER' | 'INSTALLER';
  services: string[];
  address: PartnerAddress;
  contact: PartnerContact;
  location: PartnerLocation;
}

interface PartnersResponse {
  items: Partner[];
  nextCursor: string | null;
}

// Hook for debounced search
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}



// Google Maps wrapper component
function MapView({ 
  partners, 
  selectedPartner, 
  onPartnerSelect, 
  userLocation 
}: {
  partners: Partner[];
  selectedPartner: Partner | null;
  onPartnerSelect: (partner: Partner) => void;
  userLocation: PartnerLocation | null;
}) {
  return (
    <MapViewGoogle
      partners={partners}
      selectedPartner={selectedPartner}
      onPartnerSelect={onPartnerSelect}
      userLocation={userLocation}
    />
  );
}

// Partner Card Component
function PartnerCard({ 
  partner, 
  isSelected, 
  onClick, 
  userLocation 
}: {
  partner: Partner;
  isSelected: boolean;
  onClick: () => void;
  userLocation: PartnerLocation | null;
}) {
  const distance = useMemo(() => {
    if (!userLocation) return null;
    
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (partner.location.lat - userLocation.lat) * Math.PI / 180;
    const dLng = (partner.location.lng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(partner.location.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  }, [partner.location, userLocation]);

  const getTypeColor = (type: Partner['type']) => {
    switch (type) {
      case 'DEALER': return 'bg-green-100 text-green-800';
      case 'DISTRIBUTOR': return 'bg-orange-100 text-orange-800';
      case 'STUDIO': return 'bg-blue-100 text-blue-800';
      case 'SERVICE_CENTER': return 'bg-gray-100 text-gray-800';
      case 'INSTALLER': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const formatAddress = (address: PartnerAddress) => {
    const parts = [address.line1, address.city, address.state, address.country]
      .filter(Boolean);
    return parts.join(', ');
  };

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${partner.location.lat},${partner.location.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{partner.name}</CardTitle>
          {distance && (
            <span className="text-sm text-gray-500 font-normal">{distance}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge className={getTypeColor(partner.type)} variant="secondary">
            {partner.type.replace('_', ' ')}
          </Badge>
          {partner.services.map(service => (
            <Badge key={service} variant="outline" className="text-xs">
              {service}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{formatAddress(partner.address)}</span>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => { e.stopPropagation(); openDirections(); }}
              className="w-full"
            >
              <Navigation className="w-3 h-3 mr-1" />
              Directions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component
export function InstallerLocatorSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [userLocation, setUserLocation] = useState<PartnerLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch partners data
  const { data: partnersData, isLoading, error } = useQuery<PartnersResponse>({
    queryKey: ['/api/partners', {
      q: debouncedSearch,
      type: selectedTypes,
      service: selectedServices,
      country: selectedCountry,
      state: selectedState,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('q', debouncedSearch);
      selectedTypes.forEach(type => params.append('type', type));
      selectedServices.forEach(service => params.append('service', service));
      if (selectedCountry && selectedCountry !== 'all') params.append('country', selectedCountry);
      if (selectedState && selectedState !== 'all') params.append('state', selectedState);
      
      const response = await fetch(`/api/partners?${params}`);
      if (!response.ok) throw new Error('Failed to fetch partners');
      return response.json();
    },
  });

  const partners = partnersData?.items || [];

  // Get unique countries and states for filters
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(new Set(partners.map(p => p.address.country).filter(Boolean)));
    return uniqueCountries.sort();
  }, [partners]);

  const states = useMemo(() => {
    const filteredPartners = selectedCountry && selectedCountry !== 'all' ? 
      partners.filter(p => p.address.country === selectedCountry) : partners;
    const uniqueStates = Array.from(new Set(filteredPartners.map(p => p.address.state).filter(Boolean)));
    return uniqueStates.sort();
  }, [partners, selectedCountry]);

  // Available service types
  const availableServices = ['PPF', 'Window Film', 'Ceramic', 'Detailing', 'Others'];
  const partnerTypes = ['DEALER', 'DISTRIBUTOR', 'STUDIO', 'SERVICE_CENTER', 'INSTALLER'];

  // Handle type filter toggle
  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Handle service filter toggle
  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  // Handle partner selection
  const handlePartnerSelect = useCallback((partner: Partner) => {
    setSelectedPartner(partner);
  }, []);

  // Get user location
  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            P91 Authorised Installer Locations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find certified P91 installers near you. From paint protection film to ceramic coatings, 
            our network of authorized partners ensures premium service and quality installation.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {/* Left Panel - Search & Filters */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {/* Locate Me Button */}
            <Button 
              onClick={locateUser}
              variant="outline" 
              className="w-full"
            >
              <Locate className="w-4 h-4 mr-2" />
              📍 Locate Me
            </Button>

            {/* Filters */}
            <Collapsible open={showFilters} onOpenChange={setShowFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Show Filters
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Partner Type Filter */}
                <div>
                  <h4 className="font-medium mb-3">Type</h4>
                  <div className="space-y-2">
                    {partnerTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm">
                          {type.replace('_', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services Filter */}
                <div>
                  <h4 className="font-medium mb-3">Services</h4>
                  <div className="space-y-2">
                    {availableServices.map(service => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service}`}
                          checked={selectedServices.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                        />
                        <label htmlFor={`service-${service}`} className="text-sm">
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Country Filter */}
                {countries.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Country</h4>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countries.map(country => (
                          <SelectItem key={country || 'unknown'} value={country || 'unknown'}>
                            {country || 'Unknown'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* State Filter */}
                {states.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">State</h4>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {states.map(state => (
                          <SelectItem key={state || 'unknown'} value={state || 'unknown'}>
                            {state || 'Unknown'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Results List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">
                  Error loading partners. Please try again.
                </div>
              ) : partners.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No installers found. Try adjusting your search or filters.
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 font-medium">
                    {partners.length} installer{partners.length !== 1 ? 's' : ''} found
                  </div>
                  {partners.map(partner => (
                    <PartnerCard
                      key={partner.id}
                      partner={partner}
                      isSelected={selectedPartner?.id === partner.id}
                      onClick={() => handlePartnerSelect(partner)}
                      userLocation={userLocation}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-3">
            <MapView
              partners={partners}
              selectedPartner={selectedPartner}
              onPartnerSelect={handlePartnerSelect}
              userLocation={userLocation}
            />
          </div>
        </div>
      </div>
    </section>
  );
}