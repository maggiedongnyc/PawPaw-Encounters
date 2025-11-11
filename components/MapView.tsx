'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode } from '@/lib/geocoding'

// Fix default Leaflet icon
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

// Inject marker styles only once
if (typeof window !== 'undefined' && !document.getElementById('map-marker-style')) {
  const style = document.createElement('style')
  style.id = 'map-marker-style'
  style.textContent = `
    .custom-dog-marker-large .marker-container-large {
      animation: pin-pulse 2s ease-in-out infinite;
    }
    .custom-dog-marker-large .marker-container-large:hover {
      transform: scale(1.2) translateY(-8px);
      animation: pin-bounce 0.6s ease-in-out;
      border-color: #FBBF24;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    }
    .custom-dog-marker-large .marker-container-large:active {
      animation: wiggle 0.5s ease-in-out;
    }
    @keyframes pin-bounce {
      0% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
      100% { transform: translateY(0); }
    }
    @keyframes pin-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.9; }
    }
    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-5deg); }
      75% { transform: rotate(5deg); }
    }
  `
  document.head.appendChild(style)
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

export default function MapView({ encounters }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [mounted, setMounted] = useState(false)
  const [neighborhoodNames, setNeighborhoodNames] = useState<Record<string, string>>({})
  const geocodeCacheRef = useRef<Map<string, string>>(new Map())
  const mapInitializedRef = useRef(false)

  const parseLocation = useCallback((location: string | LocationData): LocationData | null => {
    if (!location) return null
    if (typeof location === 'string') {
      try { return JSON.parse(location) as LocationData } catch { return null }
    }
    return location
  }, [])

  const getMoodEmoji = (mood?: string | null) => {
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

  const isNewEncounter = (createdAt: string) => {
    const diff = (new Date().getTime() - new Date(createdAt).getTime()) / (1000*60*60)
    return diff < 24
  }

  // Initialize map once on mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Main map initialization and update logic
  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return

    // Initialize map only once
    if (!mapInitializedRef.current && mapContainerRef.current) {
      const initializeMap = () => {
        if (!mapContainerRef.current || mapInitializedRef.current) return
        
        try {
          const map = L.map(mapContainerRef.current, {
            center: [37.7749, -122.4194],
            zoom: 13,
            zoomControl: true,
          })
          mapInstanceRef.current = map
          mapInitializedRef.current = true

          // Add Stamen Watercolor tile layer - playful, subtle style
          const tileLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            maxZoom: 18,
            minZoom: 1,
            tileSize: 256,
          })

          tileLayer.addTo(map)

          // Fallback to OpenStreetMap if Stamen tiles fail
          let fallbackUsed = false
          tileLayer.on('tileerror', () => {
            if (!fallbackUsed) {
              fallbackUsed = true
              console.warn('Stamen tiles failed, using OpenStreetMap fallback')
              const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
              })
              map.removeLayer(tileLayer)
              osmLayer.addTo(map)
            }
          })

          // Force map to invalidate size to ensure tiles load
          setTimeout(() => {
            map.invalidateSize()
          }, 100)
        } catch (err) {
          console.error('Error initializing map:', err)
        }
      }

      // Ensure container has dimensions before initializing
      if (mapContainerRef.current.offsetHeight === 0 || mapContainerRef.current.offsetWidth === 0) {
        // Retry after a short delay
        const retryTimer = setTimeout(() => {
          if (mapContainerRef.current && !mapInitializedRef.current) {
            initializeMap()
          }
        }, 200)
        return () => clearTimeout(retryTimer)
      } else {
        initializeMap()
      }
    }

    return () => {
      // Don't clean up the map on re-render, only on unmount
    }
  }, [mounted])

  // Update markers when encounters change
  useEffect(() => {
    if (!mapInstanceRef.current || encounters.length === 0) return

    // Clear existing markers
    markersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker))
    markersRef.current = []

    const locations: LocationData[] = []

    // Add new markers
    encounters.forEach(encounter => {
      const location = parseLocation(encounter.location)
      if (!location) return

      locations.push(location)
      const isNew = isNewEncounter(encounter.created_at)

      const html = `
        <div class="marker-container-large" style="
          font-size: 50px;
          line-height: 1;
          text-align: center;
          cursor: pointer;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          border: 3px solid #FCD34D;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          transition: transform 0.3s ease;
        ">
          ${getMoodEmoji(encounter.mood)}
        </div>
      `

      const icon = L.divIcon({
        className: 'custom-dog-marker-large',
        html: html,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50],
      })

      const marker = L.marker([location.lat, location.lng], { icon }).addTo(mapInstanceRef.current!)

      // Build tags HTML
      const tagsHtml = []
      if (encounter.breed) {
        tagsHtml.push(`<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: linear-gradient(to right, #FEF3C7, #FDE68A); color: #92400E; border-radius: 12px; font-size: 12px; margin-right: 4px; margin-top: 4px;">${getTagEmoji(encounter.breed, 'breed')} ${encounter.breed}</span>`)
      }
      if (encounter.size) {
        tagsHtml.push(`<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: linear-gradient(to right, #DBEAFE, #BFDBFE); color: #1E40AF; border-radius: 12px; font-size: 12px; margin-right: 4px; margin-top: 4px;">${getTagEmoji(encounter.size, 'size')} ${encounter.size}</span>`)
      }
      if (encounter.mood) {
        tagsHtml.push(`<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: linear-gradient(to right, #FCE7F3, #FBCFE8); color: #9F1239; border-radius: 12px; font-size: 12px; margin-right: 4px; margin-top: 4px;">${getTagEmoji(encounter.mood, 'mood')} ${encounter.mood}</span>`)
      }

      const popupContent = `
        <div style="padding: 12px; min-width: 250px;">
          <a href="/encounter/${encounter.id}" style="text-decoration: none; color: inherit; display: block; cursor: pointer;" onclick="window.location.href='/encounter/${encounter.id}'; return false;">
            <img src="${encounter.photo_url}" alt="${encounter.description}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" />
          </a>
          <p style="font-weight: 600; font-size: 14px; margin-bottom: 8px; line-height: 1.4;">${encounter.description}</p>
          ${tagsHtml.length > 0 ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">${tagsHtml.join('')}</div>` : ''}
          <p style="font-size: 12px; color: #666; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
            <span>📍</span>
            <span>${neighborhoodNames[encounter.id] || location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
          </p>
          ${isNew ? '<div style="color: #EAB308; font-weight: bold; font-size: 12px; margin-top: 8px; margin-bottom: 8px; animation: pulse 2s ease-in-out infinite;">NEW! 🎉</div>' : ''}
          <p style="font-size: 11px; color: #999; margin-top: 8px; text-align: center; font-style: italic;">Click photo to view full profile</p>
        </div>
      `

      marker.bindPopup(popupContent)
      markersRef.current.push(marker)
    })

    // Fit bounds
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]))
      mapInstanceRef.current?.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [encounters, neighborhoodNames, parseLocation, getMoodEmoji, getTagEmoji, isNewEncounter])

  // Fetch neighborhood names
  useEffect(() => {
    if (encounters.length === 0) return
    const fetchNeighborhoodNames = async () => {
      const names: Record<string, string> = {}
      const cache = geocodeCacheRef.current
      const promises = encounters.map(async encounter => {
        const loc = parseLocation(encounter.location)
        if (!loc || loc.name) return
        const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`
        if (cache.has(key)) names[encounter.id] = cache.get(key)!
        else {
          try {
            const neighborhood = await reverseGeocode(loc.lat, loc.lng)
            if (neighborhood) {
              cache.set(key, neighborhood)
              names[encounter.id] = neighborhood
            }
          } catch {}
        }
      })
      await Promise.all(promises)
      setNeighborhoodNames(names)
    }
    fetchNeighborhoodNames()
  }, [encounters, parseLocation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {}
        mapInstanceRef.current = null
        mapInitializedRef.current = false
      }
    }
  }, [])

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

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        minHeight: '400px',
        position: 'relative',
        zIndex: 0
      }}
    ></div>
  )
}