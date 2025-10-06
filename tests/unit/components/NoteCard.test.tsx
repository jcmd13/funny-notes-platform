import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteCard } from '@components/notes/NoteCard';
import { Note } from '@core/models';

const mockDeleteNote = vi.fn();
const mockUpdateNote = vi.fn();

vi.mock('@/hooks/useNotes', () => ({
  useNotes: () => ({
    deleteNote: mockDeleteNote,
    updateNote: mockUpdateNote,
    loading: false,
    error: null,
  }),
}));

describe('NoteCard', () => {
  const user = userEvent.setup();
  
  const mockNote: Note = {
    id: '1',
    content: 'This is a test joke about chickens',
    type: 'text',
    tags: ['comedy', 'animals'],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    metadata: { duration: 30 },
    attachments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render note content', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByText('This is a test joke about chickens')).toBeInTheDocument();
  });

  it('should render note tags', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByText('comedy')).toBeInTheDocument();
    expect(screen.getByText('animals')).toBeInTheDocument();
  });

  it('should show note type indicator', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('should show creation date', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
  });

  it('should show duration when available', () => {
    render(<NoteCard note={mockNote} />);
    
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('should enter edit mode when clicked', async () => {
    render(<NoteCard note={mockNote} />);
    
    const noteContent = screen.getByText('This is a test joke about chickens');
    await user.click(noteContent);

    expect(screen.getByDisplayValue('This is a test joke about chickens')).toBeInTheDocument();
  });

  it('should save changes when edit is completed', async () => {
    mockUpdateNote.mockResolvedValue({
      ...mockNote,
      content: 'Updated joke content',
    });

    render(<NoteCard note={mockNote} />);
    
    const noteContent = screen.getByText('This is a test joke about chickens');
    await user.click(noteContent);

    const textarea = screen.getByDisplayValue('This is a test joke about chickens');
    await user.clear(textarea);
    await user.type(textarea, 'Updated joke content');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('1', {
        content: 'Updated joke content',
      });
    });
  });

  it('should cancel edit on Escape key', async () => {
    render(<NoteCard note={mockNote} />);
    
    const noteContent = screen.getByText('This is a test joke about chickens');
    await user.click(noteContent);

    const textarea = screen.getByDisplayValue('This is a test joke about chickens');
    await user.clear(textarea);
    await user.type(textarea, 'Changed content');
    await user.keyboard('{Escape}');

    // Should show original content
    expect(screen.getByText('This is a test joke about chickens')).toBeInTheDocument();
    expect(mockUpdateNote).not.toHaveBeenCalled();
  });

  it('should show delete confirmation dialog', async () => {
    render(<NoteCard note={mockNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(screen.getByText(/are you sure you want to delete this note/i)).toBeInTheDocument();
  });

  it('should delete note when confirmed', async () => {
    mockDeleteNote.mockResolvedValue(true);

    render(<NoteCard note={mockNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith('1');
    });
  });

  it('should cancel delete when cancelled', async () => {
    render(<NoteCard note={mockNote} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockDeleteNote).not.toHaveBeenCalled();
    expect(screen.queryByText(/are you sure you want to delete this note/i)).not.toBeInTheDocument();
  });

  it('should handle voice notes with audio playback', () => {
    const voiceNote: Note = {
      ...mockNote,
      type: 'voice',
      attachments: [{
        id: '1',
        type: 'audio',
        filename: 'recording.wav',
        size: 1024,
        data: new Blob(['audio'], { type: 'audio/wav' }),
      }],
    };

    render(<NoteCard note={voiceNote} />);
    
    expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument();
  });

  it('should handle image notes with thumbnail', () => {
    const imageNote: Note = {
      ...mockNote,
      type: 'image',
      attachments: [{
        id: '1',
        type: 'image',
        filename: 'photo.jpg',
        size: 2048,
        data: new Blob(['image'], { type: 'image/jpeg' }),
      }],
    };

    render(<NoteCard note={imageNote} />);
    
    expect(screen.getByRole('img', { name: /note image/i })).toBeInTheDocument();
  });

  it('should show selection checkbox when in selection mode', () => {
    render(<NoteCard note={mockNote} selectionMode={true} />);
    
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should handle selection toggle', async () => {
    const onSelectionChange = vi.fn();
    
    render(
      <NoteCard 
        note={mockNote} 
        selectionMode={true} 
        onSelectionChange={onSelectionChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith('1', true);
  });

  it('should truncate long content', () => {
    const longNote: Note = {
      ...mockNote,
      content: 'This is a very long joke that should be truncated because it exceeds the maximum length that we want to display in the card view. It keeps going and going and going...',
    };

    render(<NoteCard note={longNote} />);
    
    const content = screen.getByText(/This is a very long joke/);
    expect(content.textContent).toMatch(/\.\.\.$/); // Should end with ellipsis
  });
});