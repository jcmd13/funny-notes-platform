import { useState, useEffect } from 'react'
import { useStorage } from '../../hooks/useStorage'
import { useToast } from '../../hooks/useToast'
import type { Venue, CreateVenueInput } from '../../core/models'

interface VenueEditorProps {
  venue?: Venue | null
  onClose: () => void
  onSaved: () => void
}

export function VenueEditor({ venue, onClose, onSaved }: VenueEditorProps) {
  const { storageService } = useStorage()
  const { success, error } = useToast()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    audienceType: '',
    stage: '',
    soundSystem: '',
    lighting: '',
    notes: ''
  })

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name,
        location: venue.location,
        capacity: venue.characteristics?.capacity?.toString() || '',
        audienceType: venue.characteristics?.audienceType || '',
        stage: venue.characteristics?.stage || '',
        soundSystem: venue.characteristics?.soundSystem || '',
        lighting: venue.characteristics?.lighting || '',
        notes: venue.characteristics?.notes || ''
      })
    }
  }, [venue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.location.trim() || !storageService) {
      error('Validation Error', 'Name and location are required')
      return
    }

    try {
      setSaving(true)
      
      const venueData: CreateVenueInput = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        characteristics: {
          audienceSize: formData.capacity ? parseInt(formData.capacity) : 0,
          audienceType: formData.audienceType || 'General',
          acoustics: 'good' as const,
          lighting: (formData.lighting as 'professional' | 'basic' | 'minimal') || 'basic',
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          stage: formData.stage || undefined,
          soundSystem: formData.soundSystem || undefined,
          notes: formData.notes || undefined
        }
      }

      if (venue) {
        await storageService.updateVenue(venue.id, venueData)
        success('Venue Updated', `${formData.name} has been updated`)
      } else {
        await storageService.createVenue(venueData)
        success('Venue Created', `${formData.name} has been added`)
      }
      
      onSaved()
    } catch (err) {
      error('Save Failed', 'Failed to save venue')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-800 rounded-lg border border-gray-700 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {venue ? 'Edit Venue' : 'Add New Venue'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., The Comedy Store"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., West Hollywood, CA"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
            </div>

            {/* Venue Characteristics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  placeholder="e.g., 150"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audience Type
                </label>
                <select
                  value={formData.audienceType}
                  onChange={(e) => handleChange('audienceType', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select audience type</option>
                  <option value="General">General</option>
                  <option value="Corporate">Corporate</option>
                  <option value="College">College</option>
                  <option value="Club">Club</option>
                  <option value="Theater">Theater</option>
                  <option value="Bar">Bar/Restaurant</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stage Setup
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleChange('stage', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select stage type</option>
                  <option value="Traditional Stage">Traditional Stage</option>
                  <option value="In-the-Round">In-the-Round</option>
                  <option value="Floor Level">Floor Level</option>
                  <option value="Elevated Platform">Elevated Platform</option>
                  <option value="No Stage">No Stage</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sound System
                </label>
                <select
                  value={formData.soundSystem}
                  onChange={(e) => handleChange('soundSystem', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select sound system</option>
                  <option value="Professional">Professional</option>
                  <option value="Basic">Basic</option>
                  <option value="Handheld Mic Only">Handheld Mic Only</option>
                  <option value="No Sound System">No Sound System</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lighting
              </label>
              <select
                value={formData.lighting}
                onChange={(e) => handleChange('lighting', e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select lighting setup</option>
                <option value="Professional Stage Lighting">Professional Stage Lighting</option>
                <option value="Basic Spotlights">Basic Spotlights</option>
                <option value="Overhead Lighting">Overhead Lighting</option>
                <option value="Natural Light">Natural Light</option>
                <option value="Dim/Ambient">Dim/Ambient</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about the venue, parking, green room, etc."
                rows={3}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
            </div>
          </div>
        </form>
        
        <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.name.trim() || !formData.location.trim()}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : venue ? 'Update Venue' : 'Create Venue'}
          </button>
        </div>
      </div>
    </div>
  )
}