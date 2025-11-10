'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode } from '@/lib/geocoding'

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface LocationData {
  lat: number
  lng: number
  name?: string
}

interface Encounter {
  id: string
  photo_url: string
  description: string
  location: string | LocationData
  breed?: string | null
  size?: string | null
  mood?: string | null
  likes: number
  created_at: string
}

interface MapViewProps {
  encounters: Encounter[]
}

// Custom large animated icon based on mood (40-60px)
const createCustomIcon = (mood?: string | null, isNew?: boolean): L.DivIcon => {
  const emojiMap: Record<string, string> = {
    happy: '😊',
    playful: '🎾',
    calm: '😌',
    energetic: '⚡',
    sleepy: '😴',
    curious: '🤔',
  }
  const emoji = emojiMap[mood || ''] || '🐕'
  const size = 50 // Large icon size (40-60px range)
  const iconSize: [number, number] = [size, size]

  return L.divIcon({
    className: 'custom-dog-marker-large',
    html: `
      <div class="marker-container-large ${isNew ? 'glow-effect' : 'animate-pin-pulse'}" style="
        font-size: ${size}px;
        line-height: 1;
        text-align: center;
        cursor: pointer;
        transition: transform 0.3s ease;
        filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 50%;
        border: 3px solid #FCD34D;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      ">
        ${emoji}
      </div>
    `,
    iconSize: iconSize,
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

// Add CSS for large marker animations
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .custom-dog-marker-large .marker-container-large:hover {
      transform: scale(1.2) translateY(-8px);
      animation: pin-bounce 0.6s ease-in-out;
      border-color: #FBBF24;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }
    .custom-dog-marker-large .marker-container-large:active {
      animation: wiggle 0.5s ease-in-out;
    }
    .custom-dog-marker-large .marker-container-large.animate-pin-pulse {
      animation: pin-pulse 2s ease-in-out infinite;
    }
  `
  document.head.appendChild(style)
}

function MapBounds({ encounters }: { encounters: Encounter[] }) {
  const map = useMap()

  useEffect(() => {
    if (encounters.length === 0) return

    const locations = encounters
      .map(e => {
        if (typeof e.location === 'string') {
          try {
            return JSON.parse(e.location) as LocationData
          } catch {
            return null
          }
        }
        return e.location as LocationData
      })
      .filter((loc): loc is LocationData => loc !== null)

    if (locations.length === 0) return

    const bounds = L.latLngBounds(
      locations.map(loc => [loc.lat, loc.lng] as [number, number])
    )

    map.fitBounds(bounds, { padding: [50, 50] })
  }, [encounters, map])

  return null
}

export default function MapView({ encounters }: MapViewProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({})
  const [basemapError, setBasemapError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const parseLocation = (location: string | LocationData): LocationData | null => {
    if (!location) return null
    
    if (typeof location === 'string') {
      try {
        return JSON.parse(location) as LocationData
      } catch {
        return null
      }
    }
    
    return location as LocationData
  }

  useEffect(() => {
    // Fetch neighborhood names for all encounters
    const fetchNeighborhoodNames = async () => {
      const names: Record<string, string> = {}
      
      for (const encounter of encounters) {
        const location = parseLocation(encounter.location)
        if (location && !location.name) {
          const neighborhood = await reverseGeocode(location.lat, location.lng)
          if (neighborhood) {
            names[encounter.id] = neighborhood
          }
        }
      }
      
      setNeighborhoodNames(names)
    }

    if (encounters.length > 0) {
      fetchNeighborhoodNames()
    }
  }, [encounters])

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-yellow-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">🐕</div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  const getMoodEmoji = (mood?: string | null): string => {
    const emojiMap: Record<string, string> = {
      happy: '😊',
      playful: '🎾',
      calm: '😌',
      energetic: '⚡',
      sleepy: '😴',
      curious: '🤔',
    }
    return emojiMap[mood || ''] || '🐕'
  }

  const getTagEmoji = (tag: string, type: 'breed' | 'size' | 'mood'): string => {
    if (type === 'breed') return '🐶'
    if (type === 'size') {
      const sizeEmojis: Record<string, string> = {
        small: '🐕',
        medium: '🐕‍🦺',
        large: '🦮',
        'extra-large': '🐩',
      }
      return sizeEmojis[tag.toLowerCase()] || '🐕'
    }
    return getMoodEmoji(tag)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Check if encounter is new (uploaded in last 24 hours)
  const isNewEncounter = (createdAt: string): boolean => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return diffHours < 24
  }

  const defaultCenter: [number, number] = [37.7749, -122.4194] // San Francisco

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      {!basemapError ? (
        <TileLayer
          attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg"
          subdomains="abcd"
          maxZoom={18}
          minZoom={1}
          eventHandlers={{
            tileerror: () => {
              setBasemapError(true)
            },
          }}
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          minZoom={1}
        />
      )}
      <MapBounds encounters={encounters} />
      
      {encounters.map((encounter) => {
        const location = parseLocation(encounter.location)
        if (!location) return null

        const isNew = isNewEncounter(encounter.created_at)

        return (
          <Marker
            key={encounter.id}
            position={[location.lat, location.lng]}
            icon={createCustomIcon(encounter.mood, isNew)}
            eventHandlers={{
              click: () => {
                setSelectedMarker(encounter.id)
              },
              mouseover: (e) => {
                const marker = e.target
                // Trigger bounce animation on hover
                const icon = marker.getElement()
                if (icon) {
                  icon.style.animation = 'pin-bounce 0.6s ease-in-out'
                }
              },
            }}
          >
            <Popup className="custom-popup">
              <div className="p-3 min-w-[250px]">
                <div className="relative mb-3">
                  <img
                    src={encounter.photo_url}
                    alt={encounter.description}
                    className="w-full h-40 object-cover rounded-lg shadow-md"
                  />
                  {isNew && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                      NEW! 🎉
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900">
                  {encounter.description}
                </p>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-2xl">{getMoodEmoji(encounter.mood)}</span>
                  {encounter.breed && (
                    <span className="px-2 py-1 text-xs bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full flex items-center gap-1">
                      <span>{getTagEmoji(encounter.breed, 'breed')}</span>
                      {encounter.breed}
                    </span>
                  )}
                  {encounter.size && (
                    <span className="px-2 py-1 text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full flex items-center gap-1">
                      <span>{getTagEmoji(encounter.size, 'size')}</span>
                      {encounter.size}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <span>📍</span>
                  {neighborhoodNames[encounter.id] || (location.name && !location.name.startsWith('Lat:') ? location.name : `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <span className="flex items-center gap-1">
                    <span>❤️</span>
                    {encounter.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    {formatDate(encounter.created_at)}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
