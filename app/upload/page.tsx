'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Confetti from '@/components/Confetti'
import PawTrail from '@/components/PawTrail'
import { reverseGeocode } from '@/lib/geocoding'

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
})

interface LocationData {
  lat: number
  lng: number
  name?: string
}

type Step = 1 | 2 | 3 | 4

function UploadPageContent() {
  // Get authenticated user (auth is already initialized by AuthProvider)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const encounterId = searchParams?.get('edit') // Get encounter ID from query param if editing
  
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [breed, setBreed] = useState('')
  const [size, setSize] = useState('')
  const [mood, setMood] = useState('')
  const [locationMethod, setLocationMethod] = useState<'none' | 'current' | 'map'>('none')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPawTrail, setShowPawTrail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Track if submission is in progress
  const [isEditMode, setIsEditMode] = useState(false) // Track if we're editing an existing encounter
  const [existingEncounter, setExistingEncounter] = useState<any>(null) // Store existing encounter data
  const [countdown, setCountdown] = useState<number | null>(null) // Countdown for redirect in edit mode

  // Load encounter data if editing
  useEffect(() => {
    const loadEncounterForEdit = async () => {
      if (!encounterId || !user) return

      try {
        const { data, error } = await supabase
          .from('Encounters')
          .select('*')
          .eq('id', encounterId)
          .eq('user_id', user.id) // Only allow editing own encounters
          .single()

        if (error) throw error

        if (data) {
          setIsEditMode(true)
          setExistingEncounter(data)
          setDescription(data.description || '')
          setBreed(data.breed || '')
          setSize(data.size || '')
          setMood(data.mood || '')
          setPreviewUrl(data.photo_url || null)
          
          // Parse location
          if (data.location) {
            try {
              const loc = typeof data.location === 'string' ? JSON.parse(data.location) : data.location
              setLocation(loc)
            } catch {
              // Location parsing failed, keep null
            }
          }
        }
      } catch (err) {
        console.error('Error loading encounter for edit:', err)
        setError('Failed to load encounter for editing. You can only edit your own encounters.')
      }
    }

    loadEncounterForEdit()
  }, [encounterId, user])

  // Countdown effect for edit mode redirect
  useEffect(() => {
    if (isEditMode && success && countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else if (isEditMode && success && countdown === 0) {
      // Redirect when countdown reaches 0
      router.push('/')
    }
  }, [isEditMode, success, countdown, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        // Try to get neighborhood name
        const neighborhood = await reverseGeocode(lat, lng)
        const locationName = neighborhood || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
        
        setLocation({
          lat,
          lng,
          name: locationName,
        })
        setLocationMethod('current')
        setIsGettingLocation(false)
      },
      (err) => {
        setError(`Error getting location: ${err.message}`)
        setIsGettingLocation(false)
      }
    )
  }

  const handleMapLocationSelect = async (lat: number, lng: number) => {
    // Try to get neighborhood name
    const neighborhood = await reverseGeocode(lat, lng)
    const locationName = neighborhood || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
    
    setLocation({
      lat,
      lng,
      name: locationName,
    })
    setLocationMethod('map')
  }

  const checkAndAwardBadges = async (userId: string) => {
    try {
      const { data: encounters, error } = await supabase
        .from('Encounters')
        .select('id')
        .eq('user_id', userId)

      if (error) throw error

      const uploadCount = encounters?.length || 0

      const { data: existingBadges } = await supabase
        .from('Badges')
        .select('badge_type')
        .eq('user_id', userId)

      const existingBadgeTypes = new Set(existingBadges?.map(b => b.badge_type) || [])

      const badgesToAward: string[] = []
      if (uploadCount === 1 && !existingBadgeTypes.has('first_upload')) {
        badgesToAward.push('first_upload')
      }
      if (uploadCount >= 5 && !existingBadgeTypes.has('five_uploads')) {
        badgesToAward.push('five_uploads')
      }
      if (uploadCount >= 10 && !existingBadgeTypes.has('ten_uploads')) {
        badgesToAward.push('ten_uploads')
      }
      if (uploadCount >= 20 && !existingBadgeTypes.has('twenty_uploads')) {
        badgesToAward.push('twenty_uploads')
      }
      if (uploadCount >= 50 && !existingBadgeTypes.has('fifty_uploads')) {
        badgesToAward.push('fifty_uploads')
      }

      if (badgesToAward.length > 0) {
        const { error: badgeError } = await supabase
          .from('Badges')
          .insert(
            badgesToAward.map(badgeType => ({
              user_id: userId,
              badge_type: badgeType,
            }))
          )

        if (badgeError) {
          console.error('Error awarding badges:', badgeError)
        }
      }
    } catch (err) {
      console.error('Error checking badges:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isSubmitting || isUploading || success) {
      console.log('Submission already in progress or completed, ignoring duplicate submit')
      return
    }

    setError(null)
    setSuccess(false)

    // For edit mode, file is optional (can keep existing photo)
    if (!isEditMode && !file) {
      setError('Please select a photo')
      setCurrentStep(1)
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      setCurrentStep(2)
      return
    }

    if (!location) {
      setError('Please select a location')
      setCurrentStep(3)
      return
    }

    // Use authenticated user ID (guaranteed to exist due to AuthLoader)
    if (!user) {
      setError('Authentication error. Please try again.')
      return
    }

    // Set both flags to prevent double submission
    setIsSubmitting(true)
    setIsUploading(true)

    try {
      let photoUrl = existingEncounter?.photo_url // Use existing photo if editing and no new file

      // Upload new file if provided (or if creating new encounter)
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `Encounters/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('dog-photos')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('dog-photos')
          .getPublicUrl(filePath)
        
        photoUrl = publicUrl
      }

      if (!photoUrl) {
        throw new Error('Photo is required')
      }

      if (isEditMode && encounterId) {
        // Update existing encounter
        const { error: updateError } = await supabase
          .from('Encounters')
          .update({
            photo_url: photoUrl,
            description: description.trim(),
            location: JSON.stringify(location),
            breed: breed.trim() || null,
            size: size.trim() || null,
            mood: mood.trim() || null,
          })
          .eq('id', encounterId)
          .eq('user_id', user.id) // Only allow updating own encounters

        if (updateError) {
          throw updateError
        }

        // For edit mode: show "Updated" and then redirect to home page
        // Step 1: User clicked "Update" - button shows "Updating..."
        // Step 2: After update completes, show "Updated!" state
        setSuccess(true)
        setIsSubmitting(false)
        setIsUploading(false)
        
        // Step 3: Start countdown from 5 seconds
        setCountdown(5)
      } else {
        // Create new encounter
        const { error: insertError } = await supabase
          .from('Encounters')
          .insert([
            {
              photo_url: photoUrl,
              description: description.trim(),
              location: JSON.stringify(location),
              breed: breed.trim() || null,
              size: size.trim() || null,
              mood: mood.trim() || null,
              likes: 0,
              user_id: user.id,
              created_at: new Date().toISOString(),
            },
          ])

        if (insertError) {
          throw insertError
        }

        await checkAndAwardBadges(user.id)

        // For create mode: show success with delay and confetti
        setSuccess(true)
        setShowConfetti(true)
        setShowPawTrail(true)
        
        // Clear submission flag after successful upload/update
        setIsSubmitting(false)
        
        setTimeout(() => {
          setShowConfetti(false)
          setShowPawTrail(false)
          router.push('/')
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || (isEditMode ? 'An error occurred while updating' : 'An error occurred while uploading'))
      console.error(isEditMode ? 'Update error:' : 'Upload error:', err)
      // Clear submission flag on error so user can retry
      setIsSubmitting(false)
      setCountdown(null) // Reset countdown on error
    } finally {
      setIsUploading(false)
    }
  }

  const nextStep = () => {
    // In edit mode, allow proceeding from step 1 without a file (photo is optional)
    if (currentStep === 1 && !file && !isEditMode) {
      setError('Please select a photo first')
      return
    }
    if (currentStep === 2 && !description.trim()) {
      setError('Please enter a description')
      return
    }
    if (currentStep === 3 && !location) {
      setError('Please select a location')
      return
    }
    setError(null)
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const prevStep = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // In edit mode, photo is optional, so always allow proceeding
        // In create mode, require a file
        return isEditMode ? true : !!file
      case 2:
        return !!description.trim()
      case 3:
        return !!location
      default:
        return true
    }
  }

  const steps = [
    { number: 1, title: 'Photo', description: 'Upload your dog photo' },
    { number: 2, title: 'Details', description: 'Add description and tags' },
    { number: 3, title: 'Location', description: 'Select encounter location' },
    { number: 4, title: 'Review', description: 'Review and submit' },
  ]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <Confetti trigger={showConfetti} />
      <PawTrail trigger={showPawTrail} />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold" style={{ color: '#5C3D2E' }}>
              {isEditMode ? 'Edit Doggo Encounter' : 'Upload Doggo Encounter'}
            </h1>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
          <p className="text-lg font-medium" style={{ color: '#5C3D2E' }}>
            {isEditMode ? 'Update your dog encounter details' : 'Share your dog encounter with the community'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step.number
                        ? 'bg-[#3B82F6] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-[#3B82F6]' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.number ? 'bg-[#3B82F6]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-[#10B981] bg-opacity-10 border border-[#10B981] rounded-md">
              <p className="text-sm text-[#10B981] font-medium">
                {isEditMode ? 'Updated! Redirecting...' : 'Encounter uploaded successfully! Redirecting...'}
              </p>
            </div>
          )}

          <form 
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // Prevent form submission via Enter key if already submitting
              if (e.key === 'Enter' && (isSubmitting || isUploading || success)) {
                e.preventDefault()
              }
            }}
          >
            {/* Step 1: Photo Upload */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Upload Photo
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Select a photo of the dog you encountered
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="photo"
                    className="block text-sm font-medium text-gray-700 mb-3"
                  >
                    Photo {!isEditMode && <span className="text-red-500">*</span>}
                    {isEditMode && <span className="text-gray-500 text-xs ml-2">(Optional - leave empty to keep current photo)</span>}
                  </label>
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#3B82F6] file:text-white
                      hover:file:bg-[#2563EB]
                      cursor-pointer transition-colors"
                    disabled={isUploading}
                  />
                </div>

                {/* Photo Preview */}
                {previewUrl && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                    <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Description and Tags */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Add Details
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Describe your encounter and add optional tags
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-3"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]
                      disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    placeholder="Describe your doggo encounter..."
                    disabled={isUploading}
                  />
                </div>

                {/* Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="breed"
                      className="block text-sm font-medium text-gray-700 mb-3"
                    >
                      Breed (Optional)
                    </label>
                    <input
                      type="text"
                      id="breed"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]
                        disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      placeholder="e.g., Golden Retriever"
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="size"
                      className="block text-sm font-medium text-gray-700 mb-3"
                    >
                      Size (Optional)
                    </label>
                    <select
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]
                        disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      disabled={isUploading}
                    >
                      <option value="">Select size</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="mood"
                      className="block text-sm font-medium text-gray-700 mb-3"
                    >
                      Mood (Optional)
                    </label>
                    <select
                      id="mood"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]
                        disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      disabled={isUploading}
                    >
                      <option value="">Select mood</option>
                      <option value="happy">😊 Happy</option>
                      <option value="playful">🎾 Playful</option>
                      <option value="calm">😌 Calm</option>
                      <option value="energetic">⚡ Energetic</option>
                      <option value="sleepy">😴 Sleepy</option>
                      <option value="curious">🤔 Curious</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location Selection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Select Location
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Choose how you want to set the location
                  </p>
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isUploading || isGettingLocation}
                    className="flex-1 px-6 py-3 text-sm font-medium text-[#3B82F6] bg-blue-50 border-2 border-[#3B82F6] rounded-md
                      hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2
                      disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed
                      transition-colors"
                  >
                    {isGettingLocation ? 'Getting location...' : '📍 Use Current Location'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setLocationMethod(locationMethod === 'map' ? 'none' : 'map')}
                    disabled={isUploading}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-md
                      focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2
                      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                      transition-colors ${
                        locationMethod === 'map'
                          ? 'text-white bg-[#3B82F6] border-2 border-[#3B82F6]'
                          : 'text-[#3B82F6] bg-blue-50 border-2 border-[#3B82F6] hover:bg-blue-100'
                      }`}
                  >
                    🗺️ {locationMethod === 'map' ? 'Hide Map' : 'Select on Map'}
                  </button>
                </div>

                {/* Map Component */}
                {locationMethod === 'map' && (
                  <div className="mb-6">
                    <div className="h-[400px] w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                      <MapComponent
                        onLocationSelect={handleMapLocationSelect}
                        initialLocation={location}
                      />
                    </div>
                  </div>
                )}

                {/* Location Display */}
                {location && (
                  <div className="p-4 bg-[#10B981] bg-opacity-10 border-2 border-[#10B981] rounded-md">
                    <p className="text-sm font-medium text-[#10B981]">
                      ✓ Location Selected: {location.name}
                    </p>
                  </div>
                )}

                {!location && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-600">
                      Please select a location using one of the options above
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review and Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Review & Submit
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Review your encounter details before submitting
                  </p>
                </div>

                {/* Review Card */}
                <div className="border-2 border-gray-200 rounded-lg p-6 space-y-6">
                  {/* Photo Review */}
                  {previewUrl && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Photo</h3>
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={previewUrl}
                          alt="Review"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description Review */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-900">{description}</p>
                  </div>

                  {/* Tags Review */}
                  {(breed || size || mood) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {breed && (
                          <span className="px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                            {breed}
                          </span>
                        )}
                        {size && (
                          <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                            {size}
                          </span>
                        )}
                        {mood && (
                          <span className="px-3 py-1.5 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                            {mood}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location Review */}
                  {location && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
                      <p className="text-gray-900">{location.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isUploading}
                  className="px-6 py-3 text-sm font-medium text-[#6B7280] bg-white border-2 border-gray-300 rounded-md
                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2
                    disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                    transition-colors"
                >
                  ← Previous
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed() || isUploading}
                    className="px-6 py-3 text-sm font-medium text-white bg-[#3B82F6] rounded-md
                      hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2
                      disabled:bg-gray-400 disabled:cursor-not-allowed
                      transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <div className="flex flex-col items-end">
                    <button
                      type="submit"
                      disabled={
                        // On Step 4 in edit mode, always enable before clicking (not submitting/uploading/success)
                        (currentStep === 4 && isEditMode && !success && !isSubmitting && !isUploading)
                          ? false
                          : (isUploading || isSubmitting || success || (!isEditMode && !file) || !description.trim() || !location)
                      }
                      className="px-6 py-3 text-sm font-medium text-white bg-[#10B981] rounded-md
                        hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2
                        disabled:bg-gray-400 disabled:cursor-not-allowed
                        transition-colors"
                    >
                      {isUploading || isSubmitting 
                        ? (isEditMode ? 'Updating...' : 'Uploading...') 
                        : success 
                          ? (isEditMode ? 'Updated!' : 'Submitted!') 
                          : (isEditMode ? 'Update' : '✓ Submit Encounter')}
                    </button>
                    
                    {/* Countdown message for edit mode - appears below "Updated!" button */}
                    {isEditMode && success && countdown !== null && countdown > 0 && (
                      <p className="text-sm text-gray-600 text-center mt-2">
                        Back to home page in {countdown} second{countdown !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">🐕</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UploadPageContent />
    </Suspense>
  )
}
