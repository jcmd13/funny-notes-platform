import { useState } from 'react'
import { usePerformances } from '../../hooks'
import { Button, Card, Form } from '../ui'
import type { Performance, PerformanceFeedback as FeedbackType } from '../../core/models'

interface PerformanceFeedbackProps {
  performance: Performance
  onFeedbackSubmitted?: () => void
}

/**
 * Component for capturing post-performance feedback
 * Includes overall rating, audience response, highlights, improvements, and material-specific feedback
 */
export function PerformanceFeedback({ performance, onFeedbackSubmitted }: PerformanceFeedbackProps) {
  const { addFeedback, loading } = usePerformances()
  
  const [formData, setFormData] = useState({
    rating: 3,
    audienceSize: 0,
    audienceResponse: 'good' as const,
    notes: '',
    highlights: [''],
    improvements: [''],
    materialFeedback: performance.setListId ? [] : [] // Will be populated when we have set list data
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const feedback: FeedbackType = {
        id: crypto.randomUUID(),
        performanceId: performance.id,
        rating: formData.rating,
        audienceSize: formData.audienceSize || undefined,
        audienceResponse: formData.audienceResponse,
        notes: formData.notes || undefined,
        highlights: formData.highlights.filter(h => h.trim()),
        improvements: formData.improvements.filter(i => i.trim()),
        materialFeedback: formData.materialFeedback,
        createdAt: new Date()
      }
      
      await addFeedback(performance.id, feedback)
      onFeedbackSubmitted?.()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const handleArrayChange = (
    field: 'highlights' | 'improvements',
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'highlights' | 'improvements') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'highlights' | 'improvements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const StarRating = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Performance Feedback</h2>
      
      <Form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Overall Performance Rating
          </label>
          <StarRating
            value={formData.rating}
            onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
          />
          <p className="text-xs text-gray-400 mt-1">
            {formData.rating === 1 && 'Poor - Major issues, didn\'t go well'}
            {formData.rating === 2 && 'Fair - Some good moments, but needs work'}
            {formData.rating === 3 && 'Good - Solid performance, audience engaged'}
            {formData.rating === 4 && 'Great - Strong performance, great audience response'}
            {formData.rating === 5 && 'Excellent - Outstanding performance, everything clicked'}
          </p>
        </div>

        {/* Audience Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Audience Size (Optional)
            </label>
            <input
              type="number"
              min="0"
              value={formData.audienceSize}
              onChange={(e) => setFormData(prev => ({ ...prev, audienceSize: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Estimated number of people"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Audience Response
            </label>
            <select
              value={formData.audienceResponse}
              onChange={(e) => setFormData(prev => ({ ...prev, audienceResponse: e.target.value as any }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="poor">Poor - Little to no response</option>
              <option value="fair">Fair - Some laughs, mixed response</option>
              <option value="good">Good - Consistent laughs and engagement</option>
              <option value="great">Great - Strong laughs, very engaged</option>
              <option value="excellent">Excellent - Killed it, amazing response</option>
            </select>
          </div>
        </div>

        {/* General Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            General Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Overall thoughts about the performance, venue, audience, etc."
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Highlights */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What Went Well
          </label>
          {formData.highlights.map((highlight, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={highlight}
                onChange={(e) => handleArrayChange('highlights', index, e.target.value)}
                placeholder="Something that worked really well..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              {formData.highlights.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('highlights', index)}
                  className="px-3"
                >
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('highlights')}
            className="mt-2"
          >
            + Add Highlight
          </Button>
        </div>

        {/* Improvements */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Areas for Improvement
          </label>
          {formData.improvements.map((improvement, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={improvement}
                onChange={(e) => handleArrayChange('improvements', index, e.target.value)}
                placeholder="Something to work on for next time..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              {formData.improvements.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('improvements', index)}
                  className="px-3"
                >
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem('improvements')}
            className="mt-2"
          >
            + Add Improvement
          </Button>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save Feedback'}
          </Button>
        </div>
      </Form>
    </Card>
  )
}