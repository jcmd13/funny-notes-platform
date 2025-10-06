import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextCapture } from '@components/capture/TextCapture';

// Mock the useNotes hook
const mockCreateNote = vi.fn();
const mockUpdateNote = vi.fn();

vi.mock('@/hooks/useNotes', () => ({
  useNotes: () => ({
    createNote: mockCreateNote,
    updateNote: mockUpdateNote,
    loading: false,
    error: null,
  }),
}));

describe('TextCapture', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render text input area', () => {
    render(<TextCapture />);
    
    const textarea = screen.getByPlaceholderText(/start typing your idea/i);
    expect(textarea).toBeInTheDocument();
  });

  it('should create a note when typing', async () => {
    mockCreateNote.mockResolvedValue({
      id: '1',
      content: 'Test joke',
      type: 'text',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      attachments: [],
    });

    render(<TextCapture />);
    
    const textarea = screen.getByPlaceholderText(/start typing your idea/i);
    await user.type(textarea, 'Test joke');

    // Wait for debounced save
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test joke',
          type: 'text',
        })
      );
    }, { timeout: 1000 });
  });

  it('should update existing note when editing', async () => {
    const existingNote = {
      id: '1',
      content: 'Original content',
      type: 'text' as const,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      attachments: [],
    };

    mockUpdateNote.mockResolvedValue({
      ...existingNote,
      content: 'Updated content',
    });

    render(<TextCapture note={existingNote} />);
    
    const textarea = screen.getByDisplayValue('Original content');
    await user.clear(textarea);
    await user.type(textarea, 'Updated content');

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          content: 'Updated content',
        })
      );
    }, { timeout: 1000 });
  });

  it('should handle tag input', async () => {
    render(<TextCapture />);
    
    const tagInput = screen.getByPlaceholderText(/add tags/i);
    await user.type(tagInput, 'comedy{enter}');

    expect(screen.getByText('comedy')).toBeInTheDocument();
  });

  it('should remove tags when clicked', async () => {
    render(<TextCapture />);
    
    const tagInput = screen.getByPlaceholderText(/add tags/i);
    await user.type(tagInput, 'comedy{enter}');

    const tagChip = screen.getByText('comedy');
    expect(tagChip).toBeInTheDocument();

    const removeButton = tagChip.parentElement?.querySelector('[data-testid="remove-tag"]');
    if (removeButton) {
      await user.click(removeButton);
    }

    expect(screen.queryByText('comedy')).not.toBeInTheDocument();
  });

  it('should show character count', () => {
    render(<TextCapture />);
    
    const characterCount = screen.getByText(/0 characters/i);
    expect(characterCount).toBeInTheDocument();
  });

  it('should update character count when typing', async () => {
    render(<TextCapture />);
    
    const textarea = screen.getByPlaceholderText(/start typing your idea/i);
    await user.type(textarea, 'Hello');

    expect(screen.getByText(/5 characters/i)).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', async () => {
    render(<TextCapture />);
    
    const textarea = screen.getByPlaceholderText(/start typing your idea/i);
    
    // Test Ctrl+S for save
    await user.type(textarea, 'Test content');
    await user.keyboard('{Control>}s{/Control}');

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalled();
    });
  });

  it('should show save status indicator', async () => {
    mockCreateNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<TextCapture />);
    
    const textarea = screen.getByPlaceholderText(/start typing your idea/i);
    await user.type(textarea, 'Test');

    // Should show saving indicator
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    // Should show saved indicator after completion
    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('should handle save errors gracefully', async () => {
    mockCreateNote.mockRejectedValue(new Error('Save failed'));

    render(<TextCapture />);
    
    const textarea = screen.getByPlaceholderText(/start typing your idea/i);
    await user.type(textarea, 'Test');

    await waitFor(() => {
      expect(screen.getByText(/error saving/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});