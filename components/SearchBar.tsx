'use client'

import { useState, useEffect, useRef } from 'react'
import { searchEncounters, getSearchSuggestions } from '@/lib/search'
import { useDebounce } from '@/hooks/useDebounce'

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

interface SearchBarProps {
  onSearch: (results: Encounter[]) => void
  onSearchStart?: () => void
  onSearchEnd?: () => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ 
  onSearch, 
  onSearchStart,
  onSearchEnd,
  onClear,
  placeholder = "Search encounters by breed, description, or tags...",
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      loadSuggestions(debouncedQuery)
      performSearch(debouncedQuery)
    } else if (debouncedQuery.length === 0 && query.length === 0) {
      // Only clear if the actual query is also empty (not just debounced)
      setSuggestions([])
      setShowSuggestions(false)
      onSearch([])
      // Notify parent that search is cleared
      onClear?.()
      onSearchEnd?.()
    }
  }, [debouncedQuery, query])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadSuggestions = async (q: string) => {
    try {
      const { breeds, keywords } = await getSearchSuggestions(q)
      const allSuggestions = [...breeds, ...keywords].slice(0, 5)
      setSuggestions(allSuggestions)
      setShowSuggestions(allSuggestions.length > 0)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const performSearch = async (q: string) => {
    setIsSearching(true)
    onSearchStart?.()
    
    try {
      const { results } = await searchEncounters({ 
        query: q,
        sortBy: 'recent',
        limit: 50
      })
      onSearch(results)
    } catch (error) {
      console.error('Search error:', error)
      onSearch([])
    } finally {
      setIsSearching(false)
      onSearchEnd?.()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      setShowSuggestions(false)
      performSearch(query)
    }
  }

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-10 text-sm sm:text-base border border-gray-300 rounded-full focus:outline-none focus:border-yellow-400 focus:shadow-md focus-ring-inset bg-white/95 transition-all shadow-sm hover:shadow-md"
          aria-label="Search encounters"
          aria-describedby="search-description"
        />
        <span id="search-description" className="sr-only">Search for dog encounters by description, breed, size, mood, or location</span>
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
          </div>
        )}
        {!isSearching && query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setShowSuggestions(false)
              onSearch([])
              // Clear search state
              onClear?.()
              onSearchEnd?.()
              inputRef.current?.focus()
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors rounded focus-visible-ring p-1"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-yellow-50 transition-colors flex items-center gap-2 rounded focus-visible-ring"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

