import { useState, useEffect, useCallback } from 'react'
import { useStorage } from './useStorage'
import type { Contact, CreateContactInput } from '@core/models'

interface UseContactsOptions {
  limit?: number
  venue?: string
  role?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'role'
  sortOrder?: 'asc' | 'desc'
}

interface UseContactsReturn {
  contacts: Contact[]
  loading: boolean
  error: Error | null
  createContact: (input: CreateContactInput) => Promise<Contact | null>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<Contact | null>
  deleteContact: (id: string) => Promise<boolean>
  refreshContacts: () => Promise<void>
  getContact: (id: string) => Promise<Contact | null>
}

/**
 * Hook for managing contacts with CRUD operations and caching
 */
export function useContacts(options: UseContactsOptions = {}): UseContactsReturn {
  const { storageService, isInitialized } = useStorage()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load contacts from storage
  const loadContacts = useCallback(async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedContacts = await storageService.listContacts(options)
      setContacts(loadedContacts)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load contacts'))
    } finally {
      setLoading(false)
    }
  }, [storageService, isInitialized, options])

  // Load contacts when storage is ready or options change
  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  // Create a new contact with optimistic updates
  const createContact = useCallback(async (input: CreateContactInput): Promise<Contact | null> => {
    if (!storageService) return null

    try {
      const newContact = await storageService.createContact(input)
      
      // Optimistic update - add to local state immediately
      setContacts(prev => [newContact, ...prev])
      
      return newContact
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create contact'))
      return null
    }
  }, [storageService])

  // Update an existing contact with optimistic updates
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>): Promise<Contact | null> => {
    if (!storageService) return null

    try {
      // Optimistic update - update local state immediately
      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, ...updates, updatedAt: new Date() } : contact
      ))

      const updatedContact = await storageService.updateContact(id, updates)
      
      // Update with actual data from storage
      setContacts(prev => prev.map(contact => 
        contact.id === id ? updatedContact : contact
      ))
      
      return updatedContact
    } catch (err) {
      // Revert optimistic update on error
      await loadContacts()
      setError(err instanceof Error ? err : new Error('Failed to update contact'))
      return null
    }
  }, [storageService, loadContacts])

  // Delete a contact with optimistic updates
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    if (!storageService) return false

    try {
      // Optimistic update - remove from local state immediately
      setContacts(prev => prev.filter(contact => contact.id !== id))

      await storageService.deleteContact(id)
      return true
    } catch (err) {
      // Revert optimistic update on error - reload contacts
      await loadContacts()
      setError(err instanceof Error ? err : new Error('Failed to delete contact'))
      return false
    }
  }, [storageService, contacts])

  // Get a specific contact by ID
  const getContact = useCallback(async (id: string): Promise<Contact | null> => {
    if (!storageService) return null

    try {
      const contact = await storageService.getContact(id)
      return contact || null
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get contact'))
      return null
    }
  }, [storageService])

  // Refresh contacts from storage
  const refreshContacts = useCallback(async () => {
    await loadContacts()
  }, [loadContacts])

  return {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    refreshContacts,
    getContact,
  }
}