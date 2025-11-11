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
  const [addDogSheet, setAddDogSheet] = useState<{
    show: boolean;
    lat: number;
    lng: number;
    address?: string;
  } | null>(null)
  const [isLocatingUser, setIsLocatingUser] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

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

  const handleNearMe = useCallback(() => {
    if (!mapInstanceRef.current) return

    setIsLocatingUser(true)

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      setIsLocatingUser(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        
        // Center map on user location and zoom to 1 mile radius
        if (mapInstanceRef.current) {
          // Zoom level 13 shows approximately 1 mile radius
          mapInstanceRef.current.setView([latitude, longitude], 13, {
            animate: true,
            duration: 1
          })

          // Add a circle to show the 1-mile radius
          const oneMileInMeters = 1609.34 // 1 mile = 1609.34 meters
          
          // Remove existing radius circle if any
          mapInstanceRef.current.eachLayer((layer) => {
            if ((layer as any).options?.className === 'radius-circle') {
              mapInstanceRef.current?.removeLayer(layer)
            }
          })

          // Add 1-mile radius circle
          L.circle([latitude, longitude], {
            radius: oneMileInMeters,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            weight: 2,
            className: 'radius-circle'
          }).addTo(mapInstanceRef.current)

          // Add user location marker
          const userMarkerHtml = `
            <div style="
              font-size: 40px;
              line-height: 1;
              text-align: center;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #3B82F6;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">
              📍
            </div>
          `
          
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: userMarkerHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          })

          // Remove any existing user marker
          mapInstanceRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker && (layer as any).options.icon?.options?.className === 'user-location-marker') {
              mapInstanceRef.current?.removeLayer(layer)
            }
          })

          // Add new user marker
          L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstanceRef.current)
            .bindPopup('<div style="text-align: center; font-weight: 600;">📍 You are here<br/><span style="font-size: 12px; color: #666;">Showing 1 mile radius</span></div>')
            .openPopup()
        }

        setIsLocatingUser(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to get your location. Please enable location services.')
        setIsLocatingUser(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }, [])

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
    // Defer setState to avoid synchronous state update warning
    setTimeout(() => {
      setMounted(true)
    }, 0)
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

          // Mobile: Long-press to add dog
          let touchStartTime = 0
          let touchStartPos = { x: 0, y: 0 }
          let touchLatLng: L.LatLng | null = null

          map.on('mousedown touchstart', (e: L.LeafletEvent) => {
            const mouseEvent = e as L.LeafletMouseEvent
            touchStartTime = Date.now()
            if (mouseEvent.originalEvent && 'touches' in mouseEvent.originalEvent && mouseEvent.originalEvent.touches) {
              const touchEvent = mouseEvent.originalEvent as unknown as TouchEvent
              touchStartPos = { x: touchEvent.touches[0].clientX, y: touchEvent.touches[0].clientY }
              touchLatLng = mouseEvent.latlng
            } else if (mouseEvent.originalEvent) {
              const mouseEvt = mouseEvent.originalEvent as MouseEvent
              touchStartPos = { x: mouseEvt.clientX, y: mouseEvt.clientY }
              touchLatLng = mouseEvent.latlng
            }
            
            // Vibrate on touch start (if supported)
            if (navigator.vibrate) {
              navigator.vibrate(50)
            }
          })

          map.on('mouseup touchend', async (e: L.LeafletEvent) => {
            const mouseEvent = e as L.LeafletMouseEvent
            const touchDuration = Date.now() - touchStartTime
            let touchEndPos = { x: 0, y: 0 }
            
            if (mouseEvent.originalEvent && 'changedTouches' in mouseEvent.originalEvent && mouseEvent.originalEvent.changedTouches) {
              const touchEvent = mouseEvent.originalEvent as unknown as TouchEvent
              touchEndPos = { 
                x: touchEvent.changedTouches[0].clientX, 
                y: touchEvent.changedTouches[0].clientY 
              }
            } else if (mouseEvent.originalEvent) {
              const mouseEvt = mouseEvent.originalEvent as MouseEvent
              touchEndPos = { x: mouseEvt.clientX, y: mouseEvt.clientY }
            }
            
            // Check if finger didn't move much (not a pan)
            const distance = Math.sqrt(
              Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
              Math.pow(touchEndPos.y - touchStartPos.y, 2)
            )
            
            // Long press detected (800ms+ and minimal movement)
            if (touchDuration > 800 && distance < 20 && touchLatLng) {
              // Vibrate feedback
              if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100])
              }
              
              const latlng = touchLatLng
              
              // Reverse geocode for address
              let address = 'Loading address...'
              try {
                address = await reverseGeocode(latlng.lat, latlng.lng) || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`
              } catch {}
              
              setAddDogSheet({
                show: true,
                lat: latlng.lat,
                lng: latlng.lng,
                address: address,
              })
            }
          })

          // Desktop fallback: right-click
          map.on('contextmenu', async (e: L.LeafletMouseEvent) => {
            e.originalEvent.preventDefault()
            
            let address = 'Loading address...'
            try {
              address = await reverseGeocode(e.latlng.lat, e.latlng.lng) || `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
            } catch {}
            
            setAddDogSheet({
              show: true,
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              address: address,
            })
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

      // Make markers larger on mobile for better touch targets
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
      const markerSize = isMobile ? 60 : 50
      const iconFontSize = isMobile ? 60 : 50

      const html = `
        <div class="marker-container-large" style="
          font-size: ${iconFontSize}px;
          line-height: 1;
          text-align: center;
          cursor: pointer;
          width: ${markerSize}px;
          height: ${markerSize}px;
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
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize],
        popupAnchor: [0, -markerSize],
      })

      const marker = L.marker([location.lat, location.lng], { icon }).addTo(mapInstanceRef.current!)

      // Build tags HTML
      const tagsHtml = []
      if (encounter.breed) {
        tagsHtml.push(`<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #FEF3C7; color: #78350F; border-radius: 12px; font-size: 12px; margin-right: 4px; margin-top: 4px;">${getTagEmoji(encounter.breed, 'breed')} ${encounter.breed}</span>`)
      }
      if (encounter.size) {
        tagsHtml.push(`<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #DBEAFE; color: #1E3A8A; border-radius: 12px; font-size: 12px; margin-right: 4px; margin-top: 4px;">${getTagEmoji(encounter.size, 'size')} ${encounter.size}</span>`)
      }
      if (encounter.mood) {
        tagsHtml.push(`<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #D1FAE5; color: #064E3B; border-radius: 12px; font-size: 12px; margin-right: 4px; margin-top: 4px;">${getTagEmoji(encounter.mood, 'mood')} ${encounter.mood}</span>`)
      }

      const popupContent = `
        <div style="padding: 0; min-width: 280px; max-width: 320px;">
          <!-- Image (full width, no padding) -->
          <a href="/encounter/${encounter.id}" style="display: block; cursor: pointer;">
            <img 
              src="${encounter.photo_url}" 
              alt="${encounter.description}" 
              style="width: 100%; height: 200px; object-fit: cover; cursor: pointer; border-radius: 12px 12px 0 0;" 
            />
          </a>
          
          <!-- Content with padding -->
          <div style="padding: 16px;">
            <!-- Description -->
            <p style="font-weight: 600; font-size: 16px; margin: 0 0 12px 0; line-height: 1.4; color: #111;">
              ${encounter.description}
            </p>
            
            <!-- Tags -->
            ${tagsHtml.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                ${tagsHtml.join('')}
              </div>
            ` : ''}
            
            <!-- Location -->
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 16px;">
              <span style="font-size: 14px;">📍</span>
              <span style="font-size: 13px; color: #666;">
                ${neighborhoodNames[encounter.id] || location.name || 'Unknown location'}
              </span>
            </div>
            
            ${isNew ? '<div style="background: linear-gradient(to right, #FCD34D, #FBBF24); color: #78350F; font-weight: bold; font-size: 13px; padding: 8px 12px; border-radius: 8px; text-align: center; margin-bottom: 16px;">🎉 NEW ENCOUNTER!</div>' : ''}
            
            <!-- Action Buttons (Mobile-optimized) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <!-- Share Button -->
              <button 
                onclick="(async function(){
                  const url = window.location.origin + '/encounter/${encounter.id}';
                  const shareData = {
                    title: 'Check out this dog!',
                    text: '${encounter.description.replace(/'/g, "\\'")}',
                    url: url
                  };
                  
                  try {
                    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                      await navigator.share(shareData);
                    } else {
                      await navigator.clipboard.writeText(url);
                      alert('🔗 Link copied to clipboard!');
                    }
                  } catch (err) {
                    if (err.name !== 'AbortError') {
                      await navigator.clipboard.writeText(url);
                      alert('🔗 Link copied!');
                    }
                  }
                })()"
                style="
                  padding: 12px;
                  background: linear-gradient(to right, #3B82F6, #2563EB);
                  color: white;
                  border: none;
                  border-radius: 12px;
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  transition: transform 0.15s;
                "
                ontouchstart="this.style.transform='scale(0.95)'"
                ontouchend="this.style.transform='scale(1)'"
              >
                <span style="font-size: 18px;">🔗</span>
                Share
              </button>
              
              <!-- I Was Here Too Button -->
              <button 
                onclick="(function(){
                  sessionStorage.setItem('cloneEncounter', '${encounter.id}');
                  sessionStorage.setItem('quickAddLocation', JSON.stringify({
                    lat: ${location.lat},
                    lng: ${location.lng},
                    address: '${(neighborhoodNames[encounter.id] || location.name || '').replace(/'/g, "\\'")}'
                  }));
                  window.location.href = '/upload';
                })()"
                style="
                  padding: 12px;
                  background: linear-gradient(to right, #10B981, #059669);
                  color: white;
                  border: none;
                  border-radius: 12px;
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  transition: transform 0.15s;
                "
                ontouchstart="this.style.transform='scale(0.95)'"
                ontouchend="this.style.transform='scale(1)'"
              >
                <span style="font-size: 18px;">📸</span>
                Here Too!
              </button>
            </div>
            
            <!-- View Full Profile Link -->
            <a 
              href="/encounter/${encounter.id}"
              style="
                display: block;
                text-align: center;
                font-size: 13px;
                color: #6B7280;
                text-decoration: none;
                padding: 8px;
              "
            >
              Tap to view full profile →
            </a>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    if (locations.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]))
      
      // Check if it's a single marker
      if (locations.length === 1) {
        // For single marker, center on it with a reasonable zoom
        mapInstanceRef.current.setView([locations[0].lat, locations[0].lng], 14)
      } else {
        // For multiple markers, fit bounds with padding and max zoom
        mapInstanceRef.current.fitBounds(bounds, { 
          padding: [80, 80],
          maxZoom: 15  // Don't zoom in too much even if markers are close
        })
      }
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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

      {/* Near Me Button - iOS style location arrow */}
      <button
        onClick={handleNearMe}
        disabled={isLocatingUser}
        className="absolute bottom-2 left-2 z-[500] bg-white rounded-full w-10 h-10 shadow-lg border border-gray-300 active:scale-95 transition-all hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
        title="Find dogs near me (1 mile radius)"
        aria-label="Near Me"
      >
        {isLocatingUser ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        ) : (
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
            className="text-blue-500"
          >
            {/* iOS-style location arrow */}
            <path 
              d="M12 2C12 2 12 2 12 2C12.5523 2 13 2.44772 13 3V5C13 5.55228 12.5523 6 12 6C11.4477 6 11 5.55228 11 5V3C11 2.44772 11.4477 2 12 2Z" 
              fill="currentColor"
            />
            <path 
              d="M12 18C12.5523 18 13 18.4477 13 19V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19C11 18.4477 11.4477 18 12 18Z" 
              fill="currentColor"
            />
            <path 
              d="M22 12C22 12.5523 21.5523 13 21 13H19C18.4477 13 18 12.5523 18 12C18 11.4477 18.4477 11 19 11H21C21.5523 11 22 11.4477 22 12Z" 
              fill="currentColor"
            />
            <path 
              d="M6 12C6 12.5523 5.55228 13 5 13H3C2.44772 13 2 12.5523 2 12C2 11.4477 2.44772 11 3 11H5C5.55228 11 6 11.4477 6 12Z" 
              fill="currentColor"
            />
            <circle 
              cx="12" 
              cy="12" 
              r="3" 
              fill="currentColor"
            />
          </svg>
        )}
      </button>

      {/* Mobile Bottom Sheet: Add Dog Here */}
      {addDogSheet?.show && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in"
            onClick={() => setAddDogSheet(null)}
          />
          
          {/* Bottom Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[9999] animate-slide-up"
            style={{
              maxHeight: '80vh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            
            {/* Content */}
            <div className="px-6 pb-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">📍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Add Paw Here?
                </h3>
                <p className="text-sm text-gray-600">
                  {addDogSheet.address || 'Loading location...'}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary: Add Dog */}
                <button
                  onClick={() => {
                    sessionStorage.setItem('quickAddLocation', JSON.stringify({
                      lat: addDogSheet.lat,
                      lng: addDogSheet.lng,
                      address: addDogSheet.address,
                    }))
                    window.location.href = '/upload'
                  }}
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
                  style={{ minHeight: '56px' }}
                >
                  <span className="text-2xl">📍</span>
                  <span>Add Paw Here</span>
                </button>
                
                {/* Secondary: Get Directions */}
                <button
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${addDogSheet.lat},${addDogSheet.lng}`,
                      '_blank'
                    )
                    setAddDogSheet(null)
                  }}
                  className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-semibold text-base border-2 border-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-3"
                  style={{ minHeight: '56px' }}
                >
                  <span className="text-xl">🗺️</span>
                  <span>Get Directions Here</span>
                </button>
                
                {/* Tertiary: Copy Location */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${addDogSheet.lat.toFixed(6)}, ${addDogSheet.lng.toFixed(6)}`
                    )
                    alert('📋 Location copied!')
                    setAddDogSheet(null)
                  }}
                  className="w-full py-3 text-gray-600 text-sm font-medium active:bg-gray-100 rounded-xl transition-colors"
                >
                  📋 Copy Coordinates
                </button>
                
                {/* Cancel */}
                <button
                  onClick={() => setAddDogSheet(null)}
                  className="w-full py-3 text-gray-500 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}