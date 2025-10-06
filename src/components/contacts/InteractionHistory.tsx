import { useState } from 'react'
import { Modal, Button, Input, Form } from '@components/ui'
import type { Contact, CreateInteractionInput, CreateReminderInput } from '@core/models'

interface InteractionHistoryProps {
  contact: Contact
  isOpen: boolean
  onClose: () => void
  onAddInteraction: (contactId: string, interaction: CreateInteractionInput) => Promise<void>
  onAddReminder: (contactId: string, reminder: CreateReminderInput) => Promise<void>
  onCompleteReminder: (contactId: string, reminderId: string) => Promise<void>
}

const INTERACTION_TYPES = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone Call', icon: '📞' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'performance', label: 'Performance', icon: '🎤' },
  { value: 'social', label: 'Social Media', icon: '💬' }
] as const

export function InteractionHistory({ 
  contact, 
  isOpen, 
  onClose, 
  onAddInteraction, 
  onAddReminder,
  onCompleteReminder 
}: InteractionHistoryProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'add-interaction' | 'add-reminder'>('history')
  const [loading, setLoading] = useState(false)

  // Interaction form state
  const [interactionForm, setInteractionForm] = useState<CreateInteractionInput>({
    type: 'email',
    subject: '',
    notes: '',
    date: new Date()
  })

  // Reminder form state
  const [reminderForm, setReminderForm] = useState<CreateReminderInput>({
    title: '',
    description: '',
    dueDate: new Date(),
    completed: false,
    context: ''
  })

  const resetForms = () => {
    setInteractionForm({
      type: 'email',
      subject: '',
      notes: '',
      date: new Date()
    })
    setReminderForm({
      title: '',
      description: '',
      dueDate: new Date(),
      completed: false,
      context: ''
    })
  }

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!interactionForm.subject.trim()) return

    setLoading(true)
    try {
      await onAddInteraction(contact.id, interactionForm)
      resetForms()
      setActiveTab('history')
    } catch (error) {
      console.error('Failed to add interaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminderForm.title.trim()) return

    setLoading(true)
    try {
      await onAddReminder(contact.id, reminderForm)
      resetForms()
      setActiveTab('history')
    } catch (error) {
      console.error('Failed to add reminder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteReminder = async (reminderId: string) => {
    setLoading(true)
    try {
      await onCompleteReminder(contact.id, reminderId)
    } catch (error) {
      console.error('Failed to complete reminder:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getInteractionIcon = (type: string) => {
    const interactionType = INTERACTION_TYPES.find(t => t.value === type)
    return interactionType?.icon || '💬'
  }

  const sortedInteractions = [...contact.interactions].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  )

  const activeReminders = contact.reminders.filter(r => !r.completed)
  const completedReminders = contact.reminders.filter(r => r.completed)

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${contact.name} - History & Reminders`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-yellow-500 text-gray-900'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            History & Reminders
          </button>
          <button
            onClick={() => setActiveTab('add-interaction')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'add-interaction'
                ? 'bg-yellow-500 text-gray-900'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Log Interaction
          </button>
          <button
            onClick={() => setActiveTab('add-reminder')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'add-reminder'
                ? 'bg-yellow-500 text-gray-900'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Add Reminder
          </button>
        </div>

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Active Reminders */}
            {activeReminders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                  Active Reminders ({activeReminders.length})
                </h3>
                <div className="space-y-2">
                  {activeReminders.map(reminder => {
                    const isOverdue = reminder.dueDate < new Date()
                    return (
                      <div
                        key={reminder.id}
                        className={`p-3 rounded-lg border ${
                          isOverdue 
                            ? 'bg-red-900/20 border-red-700' 
                            : 'bg-yellow-900/20 border-yellow-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{reminder.title}</h4>
                            {reminder.description && (
                              <p className="text-sm text-gray-300 mt-1">{reminder.description}</p>
                            )}
                            <p className={`text-xs mt-2 ${isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
                              Due: {formatDate(reminder.dueDate)}
                              {isOverdue && ' (Overdue)'}
                            </p>
                            {reminder.context && (
                              <p className="text-xs text-gray-400 mt-1">
                                Context: {reminder.context}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCompleteReminder(reminder.id)}
                            disabled={loading}
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Interaction History */}
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                Interaction History ({sortedInteractions.length})
              </h3>
              {sortedInteractions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No interactions recorded yet.</p>
                  <p className="text-sm mt-1">Use the "Log Interaction" tab to add your first interaction.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedInteractions.map(interaction => (
                    <div key={interaction.id} className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getInteractionIcon(interaction.type)}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{interaction.subject}</h4>
                          {interaction.notes && (
                            <p className="text-sm text-gray-300 mt-1">{interaction.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(interaction.date)} • {interaction.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Reminders */}
            {completedReminders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-400 mb-3">
                  Completed Reminders ({completedReminders.length})
                </h3>
                <div className="space-y-2">
                  {completedReminders.slice(0, 5).map(reminder => (
                    <div key={reminder.id} className="p-3 rounded-lg bg-gray-800 opacity-75">
                      <h4 className="font-medium text-gray-300">{reminder.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Completed • Due: {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                  ))}
                  {completedReminders.length > 5 && (
                    <p className="text-sm text-gray-400 text-center">
                      ... and {completedReminders.length - 5} more completed reminders
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Interaction Tab */}
        {activeTab === 'add-interaction' && (
          <Form onSubmit={handleAddInteraction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interaction Type
              </label>
              <select
                value={interactionForm.type}
                onChange={(e) => setInteractionForm(prev => ({ 
                  ...prev, 
                  type: e.target.value as any 
                }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {INTERACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Subject *"
              value={interactionForm.subject}
              onChange={(e) => setInteractionForm(prev => ({ 
                ...prev, 
                subject: e.target.value 
              }))}
              placeholder="Brief description of the interaction"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={interactionForm.notes || ''}
                onChange={(e) => setInteractionForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Additional details about the interaction..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
            </div>

            <Input
              label="Date & Time"
              type="datetime-local"
              value={interactionForm.date.toISOString().slice(0, 16)}
              onChange={(e) => setInteractionForm(prev => ({ 
                ...prev, 
                date: new Date(e.target.value) 
              }))}
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab('history')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Log Interaction
              </Button>
            </div>
          </Form>
        )}

        {/* Add Reminder Tab */}
        {activeTab === 'add-reminder' && (
          <Form onSubmit={handleAddReminder} className="space-y-4">
            <Input
              label="Reminder Title *"
              value={reminderForm.title}
              onChange={(e) => setReminderForm(prev => ({ 
                ...prev, 
                title: e.target.value 
              }))}
              placeholder="What do you need to remember?"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={reminderForm.description || ''}
                onChange={(e) => setReminderForm(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                placeholder="Additional details about this reminder..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
            </div>

            <Input
              label="Due Date & Time *"
              type="datetime-local"
              value={reminderForm.dueDate.toISOString().slice(0, 16)}
              onChange={(e) => setReminderForm(prev => ({ 
                ...prev, 
                dueDate: new Date(e.target.value) 
              }))}
              required
            />

            <Input
              label="Context"
              value={reminderForm.context || ''}
              onChange={(e) => setReminderForm(prev => ({ 
                ...prev, 
                context: e.target.value 
              }))}
              placeholder="Why is this reminder important?"
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab('history')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Add Reminder
              </Button>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  )
}