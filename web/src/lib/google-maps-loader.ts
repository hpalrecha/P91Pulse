// Singleton to track loading state
let loadPromise: Promise<void> | null = null;
let isLoaded = false;

export async function loadGoogleMaps(): Promise<void> {
  // Return immediately if already loaded WITH Places library
  if (isLoaded && window.google?.maps?.places) {
    console.log('Google Maps with Places library already loaded');
    return Promise.resolve();
  }

  // Return existing promise if loading is in progress
  if (loadPromise) {
    return loadPromise;
  }

  // Try GOOGLE_API_KEY first, fallback to VITE_GOOGLE_MAPS_API_KEY
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  console.log('Google Maps API Key check:', apiKey ? `Key present (length: ${apiKey.length})` : 'Key missing');
  console.log('Using key from:', import.meta.env.VITE_GOOGLE_API_KEY ? 'VITE_GOOGLE_API_KEY' : 'VITE_GOOGLE_MAPS_API_KEY');
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured. Please set VITE_GOOGLE_API_KEY or VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
  }

  // Create the loading promise with overall timeout
  loadPromise = new Promise((resolve, reject) => {
    // Check if Google Maps with Places library is already loaded
    if (window.google?.maps?.places) {
      console.log('Google Maps with Places library already loaded and ready');
      isLoaded = true;
      resolve();
      return;
    }
    
    // Remove any existing failed scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => {
      console.log('Removing existing Google Maps script');
      script.remove();
    });

    // Overall timeout for the entire loading process
    const overallTimeout = setTimeout(() => {
      loadPromise = null; // Reset so it can be retried
      reject(new Error('Google Maps loading timeout. This may be due to API key restrictions. Please ensure your domain is whitelisted in Google Cloud Console.'));
    }, 10000); // 10 second overall timeout

    // Create script element and load with Places library
    const script = document.createElement('script');
    // IMPORTANT: Include 'places' library for autocomplete functionality
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    
    console.log('Loading Google Maps script with Places library from:', scriptUrl.substring(0, 70) + '...');
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      // Wait for google.maps.places to be available (Places library)
      const checkReady = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkReady);
          clearTimeout(overallTimeout);
          isLoaded = true;
          console.log('Google Maps API with Places library ready');
          resolve();
        }
      }, 50);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkReady);
        if (window.google?.maps?.places) {
          clearTimeout(overallTimeout);
          isLoaded = true;
          resolve();
        } else {
          clearTimeout(overallTimeout);
          loadPromise = null; // Reset so it can be retried
          console.error('Google Maps loaded but Places library not available');
          reject(new Error('Google Maps Places library not available. The API key may have domain restrictions. Please ensure your domain is whitelisted in Google Cloud Console.'));
        }
      }, 5000);
    };
    
    script.onerror = (error) => {
      clearTimeout(overallTimeout);
      loadPromise = null; // Reset so it can be retried
      console.error('Script loading error event:', error);
      console.error('Script src:', script.src);
      console.error('This usually means: Network error, CORS issue, or invalid API key');
      reject(new Error('Network error loading Google Maps. The API key may be restricted to specific domains.'));
    };
    
    document.head.appendChild(script);
    console.log('Google Maps script element added to DOM');
  });

  return loadPromise;
}
