import { useState, useEffect } from 'react'
import { useStorage } from '../../hooks/useStorage'
import { useToast } from '../../hooks/useToast'
import type { Contact, CreateContactInput } from '../../core/models'

interface ContactEditorProps {
  contact?: Contact | null
  onClose: () => void
  onSaved: () => void
}

export function ContactEditor({ contact, onClose, onSaved }: ContactEditorProps) {
  const { storageService } = useStorage()
  const { success, error } = useToast()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    venue: '',
    email: '',
    phone: '',
    website: '',
    socialMedia: '',
    notes: ''
  })

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        role: contact.role,
        venue: contact.venue || '',
        email: contact.contactInfo.email || '',
        phone: contact.contactInfo.phone || '',
        website: contact.contactInfo.website || '',
        socialMedia: contact.contactInfo.socialMedia || '',
        notes: contact.contactInfo.notes || ''
      })
    }
  }, [contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.role.trim() || !storageService) {
      error('Validation Error', 'Name and role are required')
      return
    }

    try {
      setSaving(true)
      
      const contactData: CreateContactInput = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        venue: formData.venue.trim() || undefined,
        contactInfo: {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          website: formData.website.trim() || undefined,
          socialMedia: formData.socialMedia.trim() || undefined,
          notes: formData.notes.trim() || undefined
        }
      }

      if (contact) {
        await storageService.updateContact(contact.id, contactData)
        success('Contact Updated', `${formData.name} has been updated`)
      } else {
        await storageService.createContact(contactData)
        success('Contact Created', `${formData.name} has been added`)
      }
      
      onSaved()
    } catch (err) {
      error('Save Failed', 'Failed to save contact')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const roleOptions = [
    'Booker',
    'Manager',
    'Venue Owner',
    'Promoter',
    'Agent',
    'Comedian',
    'Producer',
    'Event Coordinator',
    'Other'
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-800 rounded-lg border border-gray-700 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                >
                  <option value="">Select role</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Venue/Company
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                placeholder="e.g., The Comedy Store, ABC Entertainment"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Social Media
                </label>
                <input
                  type="text"
                  value={formData.socialMedia}
                  onChange={(e) => handleChange('socialMedia', e.target.value)}
                  placeholder="@username or profile URL"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this contact..."
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
            disabled={saving || !formData.name.trim() || !formData.role.trim()}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}