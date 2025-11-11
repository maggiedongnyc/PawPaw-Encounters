'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserProfileWithStats, updateUserProfile, uploadAvatar, getDisplayName, getAvatarUrl } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { UserProfile, UserStatistics } from '@/lib/profiles'
import toast from 'react-hot-toast'

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

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const userId = params.userId as string
  const isOwnProfile = user?.id === userId

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    website: '',
    favorite_breeds: [] as string[]
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (userId) {
      loadProfile()
      loadEncounters()
    }
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await getUserProfileWithStats(userId)
      
      if (profileData) {
        setProfile(profileData)
        setStatistics(profileData.statistics || null)
        setEditForm({
          username: profileData.username || '',
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
          favorite_breeds: profileData.favorite_breeds || []
        })
      } else {
        // If profile doesn't exist, create a minimal one for display
        const minimalProfile: UserProfile = {
          id: '',
          user_id: userId,
          username: null,
          display_name: `User ${userId.slice(0, 8)}`,
          bio: null,
          avatar_url: null,
          favorite_breeds: null,
          location: null,
          website: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(minimalProfile)
        setStatistics({
          user_id: userId,
          total_encounters: 0,
          total_comments: 0,
          total_likes_received: 0,
          total_badges: 0,
          last_encounter_at: null,
          first_encounter_at: null
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Show a more helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('does not exist') || errorMessage.includes('42P01')) {
        toast.error('Database schema not set up. Please run the user-profiles-schema.sql in Supabase.')
      } else {
        toast.error('Failed to load profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadEncounters = async () => {
    try {
      const { data, error } = await supabase
        .from('Encounters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setEncounters(data || [])
      
      // Update statistics based on actual data if view doesn't exist
      if (data && data.length > 0) {
        const actualEncounters = data.length
        const actualLikes = data.reduce((sum, e) => sum + (e.likes || 0), 0)
        
        // If statistics don't match, we'll recalculate
        // This is a fallback if the view isn't working
        if (statistics && (statistics.total_encounters !== actualEncounters || statistics.total_likes_received !== actualLikes)) {
          // Statistics might be outdated, but we'll keep the view as primary source
          // The view should be recalculated by the database
        }
      }
    } catch (error) {
      console.error('Error loading encounters:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return

    try {
      // Check username availability if changed
      if (editForm.username && editForm.username !== profile?.username) {
        const available = await supabase
          .from('UserProfiles')
          .select('id')
          .eq('username', editForm.username)
          .neq('user_id', userId)
          .limit(1)

        if (available.data && available.data.length > 0) {
          toast.error('Username is already taken')
          return
        }
      }

      const updated = await updateUserProfile(userId, {
        username: editForm.username || null,
        display_name: editForm.display_name || null,
        bio: editForm.bio || null,
        location: editForm.location || null,
        website: editForm.website || null,
        favorite_breeds: editForm.favorite_breeds.length > 0 ? editForm.favorite_breeds : null
      })

      if (updated) {
        setProfile(updated)
        setIsEditing(false)
        toast.success('Profile updated! ✨')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !isOwnProfile) return

    try {
      setUploadingAvatar(true)
      const avatarUrl = await uploadAvatar(userId, file)

      if (avatarUrl) {
        const updated = await updateUserProfile(userId, { avatar_url: avatarUrl })
        if (updated) {
          setProfile(updated)
          toast.success('Avatar updated! 🎨')
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const parseLocation = (location: string | { lat: number; lng: number; name?: string }): { lat: number; lng: number; name?: string } | null => {
    if (!location) return null
    if (typeof location === 'string') {
      try {
        return JSON.parse(location)
      } catch {
        return null
      }
    }
    return location
  }

  const getLocationName = (encounter: Encounter): string => {
    const location = parseLocation(encounter.location)
    if (!location) return 'Location not available'
    return location.name || `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
  }

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl mb-4">🐕</div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600 mb-4">Profile not found</p>
            <button
              onClick={() => router.back()}
              className="text-yellow-500 hover:text-yellow-600 underline"
            >
              Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  const displayName = getDisplayName(profile, userId)
  const avatarUrl = getAvatarUrl(profile)

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {isOwnProfile && !isEditing ? (
                <label className="cursor-pointer group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-200 to-blue-200 flex items-center justify-center text-5xl overflow-hidden border-4 border-white shadow-lg group-hover:opacity-80 transition-opacity">
                    {avatarUrl.startsWith('http') ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{avatarUrl}</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </label>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-200 to-blue-200 flex items-center justify-center text-5xl overflow-hidden border-4 border-white shadow-lg">
                  {avatarUrl.startsWith('http') ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{avatarUrl}</span>
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="username (optional)"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      placeholder="Display name"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="City, Neighborhood, etc."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form to original values
                        if (profile) {
                          setEditForm({
                            username: profile.username || '',
                            display_name: profile.display_name || '',
                            bio: profile.bio || '',
                            location: profile.location || '',
                            website: profile.website || '',
                            favorite_breeds: profile.favorite_breeds || []
                          })
                        }
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: '#5C3D2E' }}>
                    {displayName}
                  </h1>
                  {profile.username && (
                    <p className="text-gray-500 mb-2">@{profile.username}</p>
                  )}
                  {profile.bio && (
                    <p className="text-gray-700 mb-2">{profile.bio}</p>
                  )}
                  {profile.location && (
                    <p className="text-sm text-gray-600 mb-2">📍 {profile.location}</p>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-colors text-sm"
                    >
                      ✏️ Edit Profile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#5C3D2E' }}>
                  {statistics.total_encounters}
                </div>
                <div className="text-sm text-gray-600">Encounters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#5C3D2E' }}>
                  {statistics.total_likes_received}
                </div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#5C3D2E' }}>
                  {statistics.total_comments}
                </div>
                <div className="text-sm text-gray-600">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#5C3D2E' }}>
                  {statistics.total_badges}
                </div>
                <div className="text-sm text-gray-600">Badges</div>
              </div>
            </div>
          )}

          {/* Favorite Breeds */}
          {profile.favorite_breeds && profile.favorite_breeds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium mb-2" style={{ color: '#5C3D2E' }}>
                Favorite Breeds:
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.favorite_breeds.map((breed, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                  >
                    🐶 {breed}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Encounters Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#5C3D2E' }}>
            Encounters ({encounters.length})
          </h2>
          {encounters.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <div className="text-6xl mb-4">🐕</div>
              <p className="text-gray-600">No encounters yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {encounters.map((encounter) => (
                <Link
                  key={encounter.id}
                  href={`/encounter/${encounter.id}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer block"
                >
                  <div className="w-full h-48 overflow-hidden bg-gray-200">
                    <img
                      src={encounter.photo_url}
                      alt={encounter.description}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {encounter.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>❤️ {encounter.likes}</span>
                      <span>•</span>
                      <span>{getLocationName(encounter)}</span>
                    </div>
                    {encounter.breed && (
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          🐶 {encounter.breed}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

