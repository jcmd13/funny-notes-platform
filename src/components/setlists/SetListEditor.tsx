import { useState, useEffect } from 'react'
import type { SetList, CreateSetListInput } from '@core/models'
import { Modal, Button, Input, Form } from '@components/ui'

interface SetListEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (setList: CreateSetListInput) => Promise<void>
  setList?: SetList | null
  title?: string
}

export function SetListEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  setList, 
  title = 'Create Set List' 
}: SetListEditorProps) {
  const [formData, setFormData] = useState<CreateSetListInput>({
    name: '',
    notes: [],
    venue: '',
    performanceDate: undefined,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when setList changes
  useEffect(() => {
    if (setList) {
      setFormData({
        name: setList.name,
        notes: setList.notes,
        venue: setList.venue || '',
        performanceDate: setList.performanceDate,
      })
    } else {
      setFormData({
        name: '',
        notes: [],
        venue: '',
        performanceDate: undefined,
      })
    }
    setErrors({})
  }, [setList, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Set list name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save set list:', error)
      setErrors({ submit: 'Failed to save set list. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateSetListInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <Form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Set List Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter set list name..."
            error={errors.name}
            required
          />
        </div>

        <div>
          <Input
            label="Venue (Optional)"
            value={formData.venue || ''}
            onChange={(e) => handleInputChange('venue', e.target.value)}
            placeholder="Enter venue name..."
            error={errors.venue}
          />
        </div>

        <div>
          <Input
            label="Performance Date (Optional)"
            type="datetime-local"
            value={formData.performanceDate ? 
              new Date(formData.performanceDate.getTime() - formData.performanceDate.getTimezoneOffset() * 60000)
                .toISOString().slice(0, 16) : ''
            }
            onChange={(e) => {
              const value = e.target.value
              handleInputChange('performanceDate', value ? new Date(value) : undefined)
            }}
            error={errors.performanceDate}
          />
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
            disabled={loading}
          >
            {setList ? 'Update' : 'Create'} Set List
          </Button>
        </div>
      </Form>
    </Modal>
  )
}