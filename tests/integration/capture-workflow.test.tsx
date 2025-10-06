import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';

// Mock the storage service
const mockStorageService = {
  createNote: vi.fn(),
  getAllNotes: vi.fn(),
  searchNotes: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
};

vi.mock('@core/storage/StorageService', () => ({
  StorageService: vi.fn(() => mockStorageService),
}));

// Mock MediaRecorder and getUserMedia
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive',
})) as any;

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('Capture to Organization Workflow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageService.getAllNotes.mockResolvedValue([]);
  });

  it('should complete text capture to notes list workflow', async () => {
    const mockNote = {
      id: '1',
      content: 'Why did the chicken cross the road?',
      type: 'text',
      tags: ['comedy', 'classic'],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      attachments: [],
    };

    mockStorageService.createNote.mockResolvedValue(mockNote);
    mockStorageService.getAllNotes.mockResolvedValue([mockNote]);

    render(<AppWrapper />);

    // Navigate to capture page
    const captureLink = screen.getByRole('link', { name: /capture/i });
    await user.click(captureLink);

    // Enter text content
    const textarea = screen.getByPlaceholderText(/start typing your idea/i);
    await user.type(textarea, 'Why did the chicken cross the road?');

    // Add tags
    const tagInput = screen.getByPlaceholderText(/add tags/i);
    await user.type(tagInput, 'comedy{enter}classic{enter}');

    // Wait for auto-save
    await waitFor(() => {
      expect(mockStorageService.createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Why did the chicken cross the road?',
          type: 'text',
          tags: expect.arrayContaining(['comedy', 'classic']),
        })
      );
    }, { timeout: 2000 });

    // Navigate to notes page
    const notesLink = screen.getByRole('link', { name: /notes/i });
    await user.click(notesLink);

    // Verify note appears in list
    await waitFor(() => {
      expect(screen.getByText('Why did the chicken cross the road?')).toBeInTheDocument();
    });

    expect(screen.getByText('comedy')).toBeInTheDocument();
    expect(screen.getByText('classic')).toBeInTheDocument();
  });

  it('should complete voice capture workflow', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    const mockNote = {
      id: '2',
      content: 'Transcribed voice note',
      type: 'voice',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { duration: 5 },
      attachments: [{ type: 'audio', data: mockBlob }],
    };

    mockStorageService.createNote.mockResolvedValue(mockNote);

    render(<AppWrapper />);

    // Navigate to capture page
    const captureLink = screen.getByRole('link', { name: /capture/i });
    await user.click(captureLink);

    // Switch to voice capture
    const voiceTab = screen.getByRole('tab', { name: /voice/i });
    await user.click(voiceTab);

    // Start recording
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    // Simulate recording completion
    await waitFor(() => {
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      return user.click(stopButton);
    });

    // Verify note creation
    await waitFor(() => {
      expect(mockStorageService.createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice',
          attachments: expect.arrayContaining([
            expect.objectContaining({
              type: 'audio',
            }),
          ]),
        })
      );
    });
  });

  it('should complete search and filter workflow', async () => {
    const mockNotes = [
      {
        id: '1',
        content: 'Chicken joke',
        type: 'text',
        tags: ['comedy', 'animals'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
      },
      {
        id: '2',
        content: 'Marriage humor',
        type: 'text',
        tags: ['comedy', 'relationships'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
      },
    ];

    mockStorageService.getAllNotes.mockResolvedValue(mockNotes);
    mockStorageService.searchNotes.mockResolvedValue([mockNotes[0]]);

    render(<AppWrapper />);

    // Navigate to notes page
    const notesLink = screen.getByRole('link', { name: /notes/i });
    await user.click(notesLink);

    // Wait for notes to load
    await waitFor(() => {
      expect(screen.getByText('Chicken joke')).toBeInTheDocument();
      expect(screen.getByText('Marriage humor')).toBeInTheDocument();
    });

    // Search for specific content
    const searchInput = screen.getByPlaceholderText(/search notes/i);
    await user.type(searchInput, 'chicken');

    // Verify search results
    await waitFor(() => {
      expect(mockStorageService.searchNotes).toHaveBeenCalledWith('chicken');
    });

    await waitFor(() => {
      expect(screen.getByText('Chicken joke')).toBeInTheDocument();
      expect(screen.queryByText('Marriage humor')).not.toBeInTheDocument();
    });
  });

  it('should complete bulk operations workflow', async () => {
    const mockNotes = [
      {
        id: '1',
        content: 'First joke',
        type: 'text',
        tags: ['comedy'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
      },
      {
        id: '2',
        content: 'Second joke',
        type: 'text',
        tags: ['comedy'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
      },
    ];

    mockStorageService.getAllNotes.mockResolvedValue(mockNotes);
    mockStorageService.deleteNote.mockResolvedValue(true);

    render(<AppWrapper />);

    // Navigate to notes page
    const notesLink = screen.getByRole('link', { name: /notes/i });
    await user.click(notesLink);

    // Wait for notes to load
    await waitFor(() => {
      expect(screen.getByText('First joke')).toBeInTheDocument();
    });

    // Enter selection mode
    const selectButton = screen.getByRole('button', { name: /select/i });
    await user.click(selectButton);

    // Select multiple notes
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    // Perform bulk delete
    const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
    await user.click(bulkDeleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Verify bulk deletion
    await waitFor(() => {
      expect(mockStorageService.deleteNote).toHaveBeenCalledWith('1');
      expect(mockStorageService.deleteNote).toHaveBeenCalledWith('2');
    });
  });
});