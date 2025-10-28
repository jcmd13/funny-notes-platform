import { useState } from 'react'
import { useStorage } from '../../hooks/useStorage'
import { useToast } from '../../hooks/useToast'
import type { Contact } from '../../core/models'

interface ContactListProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onUpdate: () => void
}

export function ContactList({ contacts, onEdit, onUpdate }: ContactListProps) {
  const { storageService } = useStorage()
  const { success, error } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (contact: Contact) => {
    if (!storageService) return
    
    if (confirm(`Are you sure you want to delete "${contact.name}"?`)) {
      try {
        setDeletingId(contact.id)
        await storageService.deleteContact(contact.id)
        success('Contact Deleted', `${contact.name} has been removed`)
        onUpdate()
      } catch (err) {
        error('Delete Failed', 'Failed to delete contact')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'booker': return '📅'
      case 'manager': return '👔'
      case 'venue owner': return '🏢'
      case 'promoter': return '📢'
      case 'agent': return '🤝'
      case 'comedian': return '🎭'
      default: return '👤'
    }
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact) => (
        <div key={contact.id} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getRoleIcon(contact.role)}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{contact.name}</h3>
                    <p className="text-yellow-400 text-sm font-medium">{contact.role}</p>
                  </div>
                </div>
                
                {contact.venue && (
                  <p className="text-gray-300 mb-2">🏢 {contact.venue}</p>
                )}
                
                <div className="space-y-1 text-sm">
                  {contact.contactInfo.email && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">📧</span>
                      <a 
                        href={`mailto:${contact.contactInfo.email}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {contact.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {contact.contactInfo.phone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">📞</span>
                      <a 
                        href={`tel:${contact.contactInfo.phone}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {contact.contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {contact.contactInfo.website && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">🌐</span>
                      <a 
                        href={contact.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {contact.contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(contact)}
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                  title="Edit contact"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(contact)}
                  disabled={deletingId === contact.id}
                  className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete contact"
                >
                  {deletingId === contact.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Interactions:</span>
                <span className="text-white ml-2">{contact.interactions.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Reminders:</span>
                <span className="text-white ml-2">
                  {contact.reminders.filter(r => !r.completed).length} active
                </span>
              </div>
              <div>
                <span className="text-gray-400">Added:</span>
                <span className="text-white ml-2">{formatDate(contact.createdAt)}</span>
              </div>
            </div>

            {contact.interactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Interactions</h4>
                <div className="space-y-1">
                  {contact.interactions.slice(0, 3).map((interaction) => (
                    <div key={interaction.id} className="flex justify-between text-xs text-gray-400">
                      <span>{interaction.type}</span>
                      <span>{formatDate(interaction.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contact.reminders.filter(r => !r.completed).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Active Reminders</h4>
                <div className="space-y-1">
                  {contact.reminders
                    .filter(r => !r.completed)
                    .slice(0, 2)
                    .map((reminder) => (
                      <div key={reminder.id} className="flex justify-between text-xs">
                        <span className="text-yellow-400">{reminder.title}</span>
                        <span className="text-gray-400">
                          {formatDate(reminder.dueDate)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}