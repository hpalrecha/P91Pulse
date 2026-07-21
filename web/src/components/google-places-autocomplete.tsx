import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaceDetails {
  formattedAddress: string;
  name: string;
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  placeId: string;
}

interface GooglePlacesAutocompleteProps {
  value?: PlaceDetails | null;
  onChange: (place: PlaceDetails | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

// Export PlaceDetails interface for use in forms
export type { PlaceDetails };

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  label = "Shop Location",
  placeholder = "Search for your shop on Google Maps...",
  required = false
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest onChange in a ref so the init effect can run ONCE. Depending the
  // effect on `onChange` (a new inline fn every parent render) re-loaded Google Maps and
  // re-created the autocomplete on every keystroke/setValue — that thrash froze the
  // Edit User dialog for ~a minute.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    // Wait for Google Maps to be loaded and initialize autocomplete
    const initAutocomplete = async () => {
      try {
        if (!inputRef.current) {
          setIsLoading(false);
          return;
        }

        // Load Google Maps API using centralized loader
        await loadGoogleMaps();

        // Verify Places library is available
        if (!window.google?.maps?.places) {
          throw new Error('Google Maps Places library not loaded. Please ensure the Places API is enabled in your Google Cloud Console.');
        }

        // Initialize autocomplete after API is loaded
        // Use 'establishment' type for businesses (shops, stores, etc.)
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['establishment'],
          fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id']
        });

        autocompleteRef.current = autocomplete;

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            setError('No location details available for this place.');
            return;
          }

          // Extract address components
          const addressComponents = place.address_components || [];
          let street = '';
          let city = '';
          let state = '';
          let country = '';
          let postalCode = '';

          addressComponents.forEach((component: google.maps.GeocoderAddressComponent) => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              street = component.long_name + ' ';
            }
            if (types.includes('route')) {
              street += component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (types.includes('country')) {
              country = component.long_name;
            }
            if (types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          });

          const placeDetails: PlaceDetails = {
            formattedAddress: place.formatted_address || '',
            name: place.name || '',
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            street: street.trim(),
            city,
            state,
            country,
            postalCode,
            placeId: place.place_id || ''
          };

          onChangeRef.current(placeDetails);
          setError(null);
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps Autocomplete:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('timeout') || errorMessage.includes('domain') || errorMessage.includes('restrictions')) {
          setError('⚠️ Google Maps is temporarily unavailable. This is likely due to API configuration. Please contact support for assistance.');
        } else {
          setError('Unable to load Google Maps location search. Please contact support for assistance.');
        }
        setIsLoading(false);
      }
    };

    initAutocomplete();

    return () => {
      // Cleanup
      if (autocompleteRef.current && window.google?.maps?.event) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
    // Init once — the latest onChange is read via onChangeRef.
  }, []);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="google-places-search">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="google-places-search"
          type="text"
          placeholder={placeholder}
          disabled={isLoading || !!error}
          className="pl-10 pr-10"
          data-testid="input-shop-location"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
        {value && !isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            data-testid="button-clear-location"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {value && (
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{value.name}</p>
              <p className="text-sm text-muted-foreground break-words">{value.formattedAddress}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {value.city && <p>City: {value.city}</p>}
                {value.state && <p>State: {value.state}</p>}
                {value.latitude && value.longitude && (
                  <p className="col-span-2">
                    Coordinates: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
