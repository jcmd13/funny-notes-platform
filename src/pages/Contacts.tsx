import { useEffect, useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { ContactList, ContactEditor } from '../components/contacts'
import type { Contact } from '../core/models'

/**
 * Contacts page - for managing industry contacts
 */
function Contacts() {
  const { storageService, isInitialized } = useStorage()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const loadContacts = async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedContacts = await storageService.listContacts({
        sortBy: 'name',
        sortOrder: 'asc'
      })
      setContacts(loadedContacts)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load contacts'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadContacts()
    }
  }, [isInitialized, storageService])

  const handleCreateContact = () => {
    setEditingContact(null)
    setShowEditor(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setEditingContact(null)
  }

  const handleContactUpdated = () => {
    loadContacts()
    handleCloseEditor()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Contacts 👥</h1>
          <button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors">
            + Add Contact
          </button>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Contacts 👥</h1>
          <button onClick={handleCreateContact} className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors">
            + Add Contact
          </button>
        </div>
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Contacts</h3>
          <p className="text-red-300 text-sm mb-3">{error.message}</p>
          <button 
            onClick={loadContacts}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Contacts 👥</h1>
        <button 
          onClick={handleCreateContact}
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          + Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No contacts yet</h3>
          <p className="text-gray-400 mb-6">Build your comedy network!</p>
          <button 
            onClick={handleCreateContact}
            className="inline-flex items-center justify-center space-x-2 bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            <span>👥</span>
            <span>Add Your First Contact</span>
          </button>
        </div>
      ) : (
        <ContactList 
          contacts={contacts} 
          onEdit={handleEditContact}
          onUpdate={loadContacts}
        />
      )}

      {showEditor && (
        <ContactEditor
          contact={editingContact}
          onClose={handleCloseEditor}
          onSaved={handleContactUpdated}
        />
      )}
    </div>
  )
}

export default Contacts