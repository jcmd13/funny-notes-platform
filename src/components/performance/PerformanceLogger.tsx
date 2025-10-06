import { useState } from 'react'
import { usePerformances, useSetLists, useVenues } from '../../hooks'
import { Button, Input, Card, Form } from '../ui'
import type { CreatePerformanceInput } from '../../core/models'

interface PerformanceLoggerProps {
  onPerformanceCreated?: (performanceId: string) => void
  preselectedSetListId?: string
  preselectedVenueId?: string
}

/**
 * Component for logging new performances
 * Allows selection of set list, venue, date/time, and initial notes
 */
export function PerformanceLogger({ 
  onPerformanceCreated, 
  preselectedSetListId,
  preselectedVenueId 
}: PerformanceLoggerProps) {
  const { createPerformance, loading } = usePerformances()
  const { setLists } = useSetLists()
  const { venues } = useVenues()
  
  const [formData, setFormData] = useState<Partial<CreatePerformanceInput>>({
    setListId: preselectedSetListId || '',
    venueId: preselectedVenueId || '',
    date: new Date(),
    status: 'scheduled',
    notes: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const newErrors: Record<string, string> = {}
    if (!formData.setListId) newErrors.setListId = 'Set list is required'
    if (!formData.venueId) newErrors.venueId = 'Venue is required'
    if (!formData.date) newErrors.date = 'Performance date is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const performance = await createPerformance(formData as CreatePerformanceInput)
      
      // Reset form
      setFormData({
        setListId: preselectedSetListId || '',
        venueId: preselectedVenueId || '',
        date: new Date(),
        status: 'scheduled',
        notes: ''
      })
      setErrors({})
      
      onPerformanceCreated?.(performance.id)
    } catch (error) {
      console.error('Failed to create performance:', error)
    }
  }

  const handleInputChange = (field: keyof CreatePerformanceInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const selectedSetList = setLists.find(sl => sl.id === formData.setListId)
  const selectedVenue = venues.find(v => v.id === formData.venueId)

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Log Performance</h2>
      
      <Form onSubmit={handleSubmit} className="space-y-4">
        {/* Set List Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Set List *
          </label>
          <select
            value={formData.setListId}
            onChange={(e) => handleInputChange('setListId', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            disabled={!!preselectedSetListId}
          >
            <option value="">Select a set list...</option>
            {setLists.map(setList => (
              <option key={setList.id} value={setList.id}>
                {setList.name} ({Math.round(setList.totalDuration / 60)}min)
              </option>
            ))}
          </select>
          {errors.setListId && (
            <p className="text-red-400 text-sm mt-1">{errors.setListId}</p>
          )}
        </div>

        {/* Venue Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Venue *
          </label>
          <select
            value={formData.venueId}
            onChange={(e) => handleInputChange('venueId', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            disabled={!!preselectedVenueId}
          >
            <option value="">Select a venue...</option>
            {venues.map(venue => (
              <option key={venue.id} value={venue.id}>
                {venue.name} - {venue.location}
              </option>
            ))}
          </select>
          {errors.venueId && (
            <p className="text-red-400 text-sm mt-1">{errors.venueId}</p>
          )}
        </div>

        {/* Performance Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Performance Date *
          </label>
          <Input
            type="datetime-local"
            value={formData.date ? new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleInputChange('date', new Date(e.target.value))}
            className="w-full"
          />
          {errors.date && (
            <p className="text-red-400 text-sm mt-1">{errors.date}</p>
          )}
        </div>

        {/* Start Time (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Start Time (Optional)
          </label>
          <Input
            type="datetime-local"
            value={formData.startTime ? new Date(formData.startTime.getTime() - formData.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleInputChange('startTime', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as 'scheduled' | 'completed' | 'cancelled')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any pre-performance notes or expectations..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Performance Preview */}
        {selectedSetList && selectedVenue && (
          <div className="bg-gray-800 rounded-md p-4 border border-gray-600">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Performance Preview</h3>
            <div className="space-y-1 text-sm text-gray-400">
              <p><span className="text-gray-300">Set:</span> {selectedSetList.name}</p>
              <p><span className="text-gray-300">Venue:</span> {selectedVenue.name}</p>
              <p><span className="text-gray-300">Duration:</span> ~{Math.round(selectedSetList.totalDuration / 60)} minutes</p>
              <p><span className="text-gray-300">Material:</span> {selectedSetList.notes.length} pieces</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Creating...' : 'Log Performance'}
          </Button>
        </div>
      </Form>
    </Card>
  )
}