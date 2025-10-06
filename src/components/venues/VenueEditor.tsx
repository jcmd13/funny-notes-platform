import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, Form } from '@components/ui'
import type { Venue, CreateVenueInput } from '@core/models'

interface VenueEditorProps {
  venue?: Venue | null
  isOpen: boolean
  onClose: () => void
  onSave: (venue: CreateVenueInput) => Promise<void>
  loading?: boolean
}

export function VenueEditor({ 
  venue, 
  isOpen, 
  onClose, 
  onSave, 
  loading = false 
}: VenueEditorProps) {
  const [formData, setFormData] = useState<CreateVenueInput>({
    name: '',
    location: '',
    characteristics: {
      audienceSize: 0,
      audienceType: '',
      acoustics: 'good',
      lighting: 'basic'
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when venue changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (venue) {
        setFormData({
          name: venue.name,
          location: venue.location,
          characteristics: { ...venue.characteristics }
        })
      } else {
        setFormData({
          name: '',
          location: '',
          characteristics: {
            audienceSize: 0,
            audienceType: '',
            acoustics: 'good',
            lighting: 'basic'
          }
        })
      }
      setErrors({})
    }
  }, [venue, isOpen])

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('characteristics.')) {
      const charField = field.replace('characteristics.', '')
      setFormData(prev => ({
        ...prev,
        characteristics: {
          ...prev.characteristics,
          [charField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (formData.characteristics.audienceSize < 0) {
      newErrors['characteristics.audienceSize'] = 'Audience size must be 0 or greater'
    }

    if (!formData.characteristics.audienceType.trim()) {
      newErrors['characteristics.audienceType'] = 'Audience type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save venue:', error)
      setErrors({ submit: 'Failed to save venue. Please try again.' })
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={venue ? 'Edit Venue' : 'Create New Venue'}>
      <Form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Venue Name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            placeholder="e.g., The Comedy Cellar"
            error={errors.name}
            disabled={loading}
            required
          />
        </div>

        <div>
          <Input
            label="Location"
            value={formData.location}
            onChange={(value) => handleInputChange('location', value)}
            placeholder="e.g., New York, NY"
            error={errors.location}
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Audience Size"
              type="number"
              value={formData.characteristics.audienceSize}
              onChange={(value) => handleInputChange('characteristics.audienceSize', parseInt(value.toString()) || 0)}
              placeholder="0"
              error={errors['characteristics.audienceSize']}
              disabled={loading}
              min="0"
            />
          </div>

          <div>
            <Input
              label="Audience Type"
              value={formData.characteristics.audienceType}
              onChange={(value) => handleInputChange('characteristics.audienceType', value)}
              placeholder="e.g., comedy club regulars"
              error={errors['characteristics.audienceType']}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Acoustics
            </label>
            <select
              value={formData.characteristics.acoustics}
              onChange={(e) => handleInputChange('characteristics.acoustics', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lighting
            </label>
            <select
              value={formData.characteristics.lighting}
              onChange={(e) => handleInputChange('characteristics.lighting', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="professional">Professional</option>
              <option value="basic">Basic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>

        {errors.submit && (
          <div className="text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {venue ? 'Update Venue' : 'Create Venue'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}