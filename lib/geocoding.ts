// Reverse geocoding utility using OpenStreetMap Nominatim API

interface LocationData {
  lat: number
  lng: number
  name?: string
}

interface NominatimResponse {
  address?: {
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
  display_name?: string
}

/**
 * Reverse geocode coordinates to get neighborhood name
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    // Use Nominatim API with proper rate limiting
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DoggoEncounters/1.0', // Required by Nominatim
      },
    })

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data: NominatimResponse = await response.json()

    // Try to get neighborhood name from address components
    if (data.address) {
      const addr = data.address
      // Priority: neighbourhood > suburb > city > town > village
      return (
        addr.neighbourhood ||
        addr.suburb ||
        addr.city ||
        addr.town ||
        addr.village ||
        addr.county ||
        null
      )
    }

    // Fallback to display_name if available
    if (data.display_name) {
      const parts = data.display_name.split(',')
      return parts[0]?.trim() || null
    }

    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Get or fetch neighborhood name for a location
 * Caches the result in the location object
 */
export async function getNeighborhoodName(location: LocationData): Promise<string> {
  // If name already exists and looks like a neighborhood (not coordinates), return it
  if (location.name && !location.name.startsWith('Lat:')) {
    return location.name
  }

  // Try to get neighborhood name from reverse geocoding
  const neighborhood = await reverseGeocode(location.lat, location.lng)
  
  if (neighborhood) {
    return neighborhood
  }

  // Fallback to coordinates if geocoding fails
  return `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
}

/**
 * Format location for display
 */
export function formatLocation(location: string | LocationData): string {
  if (typeof location === 'string') {
    try {
      const parsed = JSON.parse(location) as LocationData
      return parsed.name || `Lat: ${parsed.lat.toFixed(4)}, Lng: ${parsed.lng.toFixed(4)}`
    } catch {
      return location
    }
  }
  
  return location.name || `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
}

