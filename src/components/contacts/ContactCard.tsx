import { Card } from '@components/ui'
import type { Contact } from '@core/models'

interface ContactCardProps {
  contact: Contact
  onEdit?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
  onViewHistory?: (contact: Contact) => void
  className?: string
}

export function ContactCard({ 
  contact, 
  onEdit, 
  onDelete, 
  onViewHistory,
  className = '' 
}: ContactCardProps) {
  const interactionCount = contact.interactions.length
  const pendingReminders = contact.reminders.filter(r => !r.completed && r.dueDate >= new Date()).length
  const overdueReminders = contact.reminders.filter(r => !r.completed && r.dueDate < new Date()).length

  const getRoleColor = (role: string) => {
    const lowerRole = role.toLowerCase()
    if (lowerRole.includes('booking') || lowerRole.includes('booker')) return 'text-green-400'
    if (lowerRole.includes('venue') || lowerRole.includes('owner')) return 'text-blue-400'
    if (lowerRole.includes('comedian') || lowerRole.includes('performer')) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const formatContactInfo = () => {
    const info = []
    if (contact.contactInfo.email) info.push(`📧 ${contact.contactInfo.email}`)
    if (contact.contactInfo.phone) info.push(`📞 ${contact.contactInfo.phone}`)
    return info
  }

  const getSocialLinks = () => {
    if (!contact.contactInfo.social) return []
    return Object.entries(contact.contactInfo.social).map(([platform, handle]) => ({
      platform,
      handle,
      icon: platform.toLowerCase() === 'twitter' ? '🐦' : 
            platform.toLowerCase() === 'instagram' ? '📷' : 
            platform.toLowerCase() === 'linkedin' ? '💼' : '🔗'
    }))
  }

  return (
    <Card className={`p-4 hover:bg-gray-750 transition-colors ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-400 mb-1">
            {contact.name}
          </h3>
          <p className={`text-sm font-medium ${getRoleColor(contact.role)}`}>
            {contact.role}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {onViewHistory && interactionCount > 0 && (
            <button
              onClick={() => onViewHistory(contact)}
              className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded transition-colors"
              title="View interaction history"
            >
              📊 {interactionCount}
            </button>
          )}
          {overdueReminders > 0 && (
            <span className="text-red-400 text-sm px-2 py-1 rounded bg-red-900/20" title="Overdue reminders">
              ⚠️ {overdueReminders}
            </span>
          )}
          {pendingReminders > 0 && (
            <span className="text-yellow-400 text-sm px-2 py-1 rounded bg-yellow-900/20" title="Pending reminders">
              ⏰ {pendingReminders}
            </span>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(contact)}
              className="text-gray-400 hover:text-yellow-400 text-sm px-2 py-1 rounded transition-colors"
              title="Edit contact"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(contact)}
              className="text-gray-400 hover:text-red-400 text-sm px-2 py-1 rounded transition-colors"
              title="Delete contact"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-1 mb-3">
        {formatContactInfo().map((info, index) => (
          <p key={index} className="text-sm text-gray-300">
            {info}
          </p>
        ))}
        
        {/* Social Links */}
        {getSocialLinks().length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {getSocialLinks().map(({ platform, handle, icon }) => (
              <span key={platform} className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                {icon} {handle}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {(interactionCount > 0 || pendingReminders > 0) && (
        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
          </div>
          {(pendingReminders > 0 || overdueReminders > 0) && (
            <div className="text-sm">
              {overdueReminders > 0 && (
                <span className="text-red-400 mr-2">
                  {overdueReminders} overdue
                </span>
              )}
              {pendingReminders > 0 && (
                <span className="text-yellow-400">
                  {pendingReminders} pending
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}