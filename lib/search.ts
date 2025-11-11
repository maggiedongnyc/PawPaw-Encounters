import { supabase } from './supabase'

// Encounter interface (matches the one in app/page.tsx)
interface Encounter {
  id: string
  photo_url: string
  description: string
  location: string | { lat: number; lng: number; name?: string }
  breed?: string | null
  size?: string | null
  mood?: string | null
  likes: number
  created_at: string
  user_id?: string | null
}

export interface SearchOptions {
  query: string
  filters?: {
    breed?: string
    size?: string
    mood?: string
    dateRange?: 'today' | 'week' | 'month' | 'all'
    locationRadius?: number
    userLocation?: { lat: number; lng: number }
  }
  sortBy?: 'relevance' | 'recent' | 'popular'
  limit?: number
  offset?: number
}

export interface SearchResult {
  results: Encounter[]
  total: number
  hasMore: boolean
}

/**
 * Search encounters using PostgreSQL full-text search
 */
export async function searchEncounters(options: SearchOptions): Promise<SearchResult> {
  const { query, filters, sortBy = 'recent', limit = 20, offset = 0 } = options

  if (!query || query.trim().length < 2) {
    return { results: [], total: 0, hasMore: false }
  }

  try {
    // Build the search query
    // Use PostgreSQL's text search capabilities
    // For now, we'll use ILIKE for pattern matching (case-insensitive)
    // In production, you'd want to use full-text search with tsvector
    
    let queryBuilder = supabase
      .from('Encounters')
      .select('*', { count: 'exact' })

    // Apply text search filters
    const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0)
    
    if (searchTerms.length > 0) {
      // Search in description, breed, size, and mood
      queryBuilder = queryBuilder.or(
        searchTerms
          .map(term => 
            `description.ilike.%${term}%,breed.ilike.%${term}%,size.ilike.%${term}%,mood.ilike.%${term}%`
          )
          .join(',')
      )
    }

    // Apply additional filters
    if (filters) {
      if (filters.breed) {
        queryBuilder = queryBuilder.eq('breed', filters.breed)
      }
      if (filters.size) {
        queryBuilder = queryBuilder.eq('size', filters.size)
      }
      if (filters.mood) {
        queryBuilder = queryBuilder.eq('mood', filters.mood)
      }
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0))
            break
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7))
            break
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1))
            break
          default:
            startDate = new Date(0)
        }
        
        queryBuilder = queryBuilder.gte('created_at', startDate.toISOString())
      }
    }

    // Apply sorting
    if (sortBy === 'recent') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
    } else if (sortBy === 'popular') {
      queryBuilder = queryBuilder.order('likes', { ascending: false })
    } else {
      // Default to recent
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    // Filter by location radius if provided
    let results = (data || []) as Encounter[]
    
    if (filters?.locationRadius && filters?.userLocation && filters.locationRadius > 0) {
      results = results.filter(encounter => {
        try {
          const location = typeof encounter.location === 'string' 
            ? JSON.parse(encounter.location) 
            : encounter.location
          
          if (!location || !location.lat || !location.lng) return false
          
          const distance = getDistance(filters.userLocation!, location)
          return distance <= filters.locationRadius!
        } catch {
          return false
        }
      })
    }

    return {
      results,
      total: count || results.length,
      hasMore: (count || results.length) > offset + limit
    }
  } catch (error) {
    console.error('Search error:', error)
    return { results: [], total: 0, hasMore: false }
  }
}

/**
 * Get search suggestions (breeds and keywords)
 */
export async function getSearchSuggestions(query: string): Promise<{
  breeds: string[]
  keywords: string[]
}> {
  if (!query || query.length < 2) {
    return { breeds: [], keywords: [] }
  }

  try {
    // Get unique breeds that match the query
    const { data: breedData } = await supabase
      .from('Encounters')
      .select('breed')
      .not('breed', 'is', null)
      .ilike('breed', `%${query}%`)
      .limit(10)

    const breeds = Array.from(
      new Set(
        breedData
          ?.map(e => e.breed)
          .filter(Boolean) as string[]
      )
    ).slice(0, 5)

    // Get description keywords (simple word extraction)
    const { data: descriptionData } = await supabase
      .from('Encounters')
      .select('description')
      .ilike('description', `%${query}%`)
      .limit(10)

    const keywords: string[] = []
    descriptionData?.forEach(encounter => {
      if (encounter.description) {
        const words = encounter.description
          .toLowerCase()
          .split(/\s+/)
          .filter((word: string) => 
            word.length > 3 && 
            word.includes(query.toLowerCase()) &&
            !keywords.includes(word)
          )
        keywords.push(...words.slice(0, 2))
      }
    })

    return {
      breeds: breeds || [],
      keywords: keywords.slice(0, 5)
    }
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return { breeds: [], keywords: [] }
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function getDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
  const dLon = (loc2.lng - loc1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

