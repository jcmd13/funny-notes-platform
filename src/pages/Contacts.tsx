import { useState } from 'react'
import { ContactList, ContactEditor, InteractionHistory } from '@components/contacts'
import { Button, ConfirmDialog } from '@components/ui'
import { useContacts } from '@hooks/useContacts'
import type { Contact, CreateContactInput, CreateInteractionInput, CreateReminderInput } from '@core/models'

function Contacts() {
  const { 
    contacts, 
    loading, 
    error, 
    createContact, 
    updateContact, 
    deleteContact,
    addInteraction,
    addReminder,
    completeReminder
  } = useContacts()

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

  const handleCreateContact = () => {
    setEditingContact(null)
    setIsEditorOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsEditorOpen(true)
  }

  const handleViewHistory = (contact: Contact) => {
    setSelectedContact(contact)
    setIsHistoryOpen(true)
  }

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact)
  }

  const handleSaveContact = async (contactData: CreateContactInput) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, contactData)
      } else {
        await createContact(contactData)
      }
      setIsEditorOpen(false)
      setEditingContact(null)
    } catch (error) {
      console.error('Failed to save contact:', error)
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return

    try {
      await deleteContact(contactToDelete.id)
      setContactToDelete(null)
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  const handleAddInteraction = async (contactId: string, interaction: CreateInteractionInput) => {
    try {
      const updatedContact = await addInteraction(contactId, interaction)
      if (updatedContact && selectedContact?.id === contactId) {
        setSelectedContact(updatedContact)
      }
    } catch (error) {
      console.error('Failed to add interaction:', error)
      throw error
    }
  }

  const handleAddReminder = async (contactId: string, reminder: CreateReminderInput) => {
    try {
      const updatedContact = await addReminder(contactId, reminder)
      if (updatedContact && selectedContact?.id === contactId) {
        setSelectedContact(updatedContact)
      }
    } catch (error) {
      console.error('Failed to add reminder:', error)
      throw error
    }
  }

  const handleCompleteReminder = async (contactId: string, reminderId: string) => {
    try {
      const updatedContact = await completeReminder(contactId, reminderId)
      if (updatedContact && selectedContact?.id === contactId) {
        setSelectedContact(updatedContact)
      }
    } catch (error) {
      console.error('Failed to complete reminder:', error)
      throw error
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-xl mb-4">⚠️ Error Loading Contacts</div>
        <p className="text-gray-400">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">
          Contacts 👥
        </h1>
        <Button onClick={handleCreateContact}>
          <span className="text-lg mr-2">+</span>
          Add Contact
        </Button>
      </div>

      <ContactList
        contacts={contacts}
        loading={loading}
        onEdit={handleEditContact}
        onDelete={handleDeleteContact}
        onViewHistory={handleViewHistory}
      />

      {/* Contact Editor Modal */}
      <ContactEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingContact(null)
        }}
        onSave={handleSaveContact}
        contact={editingContact}
      />

      {/* Interaction History Modal */}
      {selectedContact && (
        <InteractionHistory
          contact={selectedContact}
          isOpen={isHistoryOpen}
          onClose={() => {
            setIsHistoryOpen(false)
            setSelectedContact(null)
          }}
          onAddInteraction={handleAddInteraction}
          onAddReminder={handleAddReminder}
          onCompleteReminder={handleCompleteReminder}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contactToDelete?.name}"? This will also remove all interaction history and reminders.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}export
 default Contacts