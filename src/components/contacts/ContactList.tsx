import { useState, useMemo } from 'react'
import { ContactCard } from './ContactCard'
import { Input, Button } from '@components/ui'
import type { Contact } from '@core/models'

interface ContactListProps {
  contacts: Contact[]
  loading?: boolean
  onEdit?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
  onViewHistory?: (contact: Contact) => void
  className?: string
}

type SortOption = 'name' | 'role' | 'createdAt' | 'interactions' | 'reminders'
type FilterOption = 'all' | 'bookers' | 'venues' | 'comedians' | 'with-reminders' | 'recent'

export function ContactList({ 
  contacts, 
  loading = false, 
  onEdit, 
  onDelete, 
  onViewHistory,
  className = '' 
}: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(query) ||
        contact.role.toLowerCase().includes(query) ||
        contact.contactInfo.email?.toLowerCase().includes(query) ||
        contact.contactInfo.phone?.includes(query)
      )
    }

    // Apply category filter
    switch (filterBy) {
      case 'bookers':
        filtered = filtered.filter(contact => 
          contact.role.toLowerCase().includes('booking') || 
          contact.role.toLowerCase().includes('booker')
        )
        break
      case 'venues':
        filtered = filtered.filter(contact => 
          contact.role.toLowerCase().includes('venue') || 
          contact.role.toLowerCase().includes('owner') ||
          contact.role.toLowerCase().includes('manager')
        )
        break
      case 'comedians':
        filtered = filtered.filter(contact => 
          contact.role.toLowerCase().includes('comedian') || 
          contact.role.toLowerCase().includes('performer')
        )
        break
      case 'with-reminders':
        filtered = filtered.filter(contact => 
          contact.reminders.some(r => !r.completed)
        )
        break
      case 'recent':
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        filtered = filtered.filter(contact => 
          contact.createdAt > oneWeekAgo ||
          contact.interactions.some(i => i.date > oneWeekAgo)
        )
        break
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'role':
          return a.role.localeCompare(b.role)
        case 'createdAt':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'interactions':
          return b.interactions.length - a.interactions.length
        case 'reminders':
          const aPending = a.reminders.filter(r => !r.completed).length
          const bPending = b.reminders.filter(r => !r.completed).length
          return bPending - aPending
        default:
          return 0
      }
    })
  }, [contacts, searchQuery, sortBy, filterBy])

  const getFilterCount = (filter: FilterOption): number => {
    switch (filter) {
      case 'all':
        return contacts.length
      case 'bookers':
        return contacts.filter(c => 
          c.role.toLowerCase().includes('booking') || 
          c.role.toLowerCase().includes('booker')
        ).length
      case 'venues':
        return contacts.filter(c => 
          c.role.toLowerCase().includes('venue') || 
          c.role.toLowerCase().includes('owner') ||
          c.role.toLowerCase().includes('manager')
        ).length
      case 'comedians':
        return contacts.filter(c => 
          c.role.toLowerCase().includes('comedian') || 
          c.role.toLowerCase().includes('performer')
        ).length
      case 'with-reminders':
        return contacts.filter(c => c.reminders.some(r => !r.completed)).length
      case 'recent':
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        return contacts.filter(c => 
          c.createdAt > oneWeekAgo ||
          c.interactions.some(i => i.date > oneWeekAgo)
        ).length
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <Input
          placeholder="Search contacts by name, role, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <div className="flex flex-wrap gap-4 items-center">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'bookers', label: 'Bookers' },
              { key: 'venues', label: 'Venues' },
              { key: 'comedians', label: 'Comedians' },
              { key: 'with-reminders', label: 'With Reminders' },
              { key: 'recent', label: 'Recent' }
            ].map(({ key, label }) => {
              const count = getFilterCount(key as FilterOption)
              return (
                <Button
                  key={key}
                  variant={filterBy === key ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilterBy(key as FilterOption)}
                  disabled={count === 0}
                >
                  {label} {count > 0 && `(${count})`}
                </Button>
              )
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="name">Name</option>
              <option value="role">Role</option>
              <option value="createdAt">Date Added</option>
              <option value="interactions">Interactions</option>
              <option value="reminders">Reminders</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-400">
        Showing {filteredAndSortedContacts.length} of {contacts.length} contacts
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Contact Cards */}
      {filteredAndSortedContacts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">👥</div>
          {searchQuery ? (
            <>
              <h3 className="text-xl font-semibold mb-2">No contacts found</h3>
              <p>Try adjusting your search or filters.</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">No contacts yet</h3>
              <p>Start building your network by adding your first contact.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedContacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      )}
    </div>
  )
}