import { useState, useEffect } from 'react'
import { Modal, Button, Input, Form } from '@components/ui'
import { useVenues } from '@hooks/useVenues'
import type { Contact, CreateContactInput, ContactInfo } from '@core/models'

interface ContactEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (contact: CreateContactInput) => Promise<void>
  contact?: Contact | null
  title?: string
}

const COMMON_ROLES = [
  'Booking Manager',
  'Venue Owner',
  'Comedy Club Manager',
  'Event Coordinator',
  'Fellow Comedian',
  'Producer',
  'Agent',
  'Promoter',
  'Sound Engineer',
  'Other'
]

const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'Twitter', placeholder: '@username' },
  { key: 'instagram', label: 'Instagram', placeholder: '@username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'profile-url' },
  { key: 'facebook', label: 'Facebook', placeholder: 'profile-url' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'channel-url' }
]

export function ContactEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  contact, 
  title 
}: ContactEditorProps) {
  const { venues } = useVenues()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form state
  const [formData, setFormData] = useState<CreateContactInput>({
    name: '',
    role: '',
    venue: '',
    contactInfo: {
      email: '',
      phone: '',
      social: {}
    }
  })

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        role: contact.role,
        venue: contact.venue || '',
        contactInfo: {
          email: contact.contactInfo.email || '',
          phone: contact.contactInfo.phone || '',
          social: contact.contactInfo.social || {}
        }
      })
    } else {
      setFormData({
        name: '',
        role: '',
        venue: '',
        contactInfo: {
          email: '',
          phone: '',
          social: {}
        }
      })
    }
    setErrors({})
  }, [contact, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required'
    }

    if (formData.contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.contactInfo.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.contactInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      // Clean up social media entries (remove empty values)
      const cleanedSocial = Object.fromEntries(
        Object.entries(formData.contactInfo.social || {}).filter(([_, value]) => value.trim())
      )

      const contactData: CreateContactInput = {
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          social: Object.keys(cleanedSocial).length > 0 ? cleanedSocial : undefined
        }
      }

      // Remove empty venue reference
      if (!contactData.venue?.trim()) {
        contactData.venue = undefined
      }

      await onSave(contactData)
      onClose()
    } catch (error) {
      console.error('Failed to save contact:', error)
      setErrors({ submit: 'Failed to save contact. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }))
  }

  const updateSocialMedia = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        social: {
          ...prev.contactInfo.social,
          [platform]: value
        }
      }
    }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || (contact ? 'Edit Contact' : 'Add New Contact')}>
      <Form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400">Basic Information</h3>
          
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            placeholder="Enter contact name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select a role</option>
              {COMMON_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role}</p>}
          </div>

          {venues.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Associated Venue
              </label>
              <select
                value={formData.venue || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">No venue association</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400">Contact Information</h3>
          
          <Input
            label="Email"
            type="email"
            value={formData.contactInfo.email || ''}
            onChange={(e) => updateContactInfo('email', e.target.value)}
            error={errors.email}
            placeholder="contact@example.com"
          />

          <Input
            label="Phone"
            type="tel"
            value={formData.contactInfo.phone || ''}
            onChange={(e) => updateContactInfo('phone', e.target.value)}
            error={errors.phone}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Social Media */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400">Social Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                value={formData.contactInfo.social?.[key] || ''}
                onChange={(e) => updateSocialMedia(key, e.target.value)}
                placeholder={placeholder}
              />
            ))}
          </div>
        </div>

        {errors.submit && (
          <div className="text-red-400 text-sm">{errors.submit}</div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {contact ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}