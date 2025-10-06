import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';

// Mock the storage service
const mockStorageService = {
  getAllNotes: vi.fn(),
  createSetList: vi.fn(),
  getAllSetLists: vi.fn(),
  updateSetList: vi.fn(),
  deleteSetList: vi.fn(),
};

vi.mock('@core/storage/StorageService', () => ({
  StorageService: vi.fn(() => mockStorageService),
}));

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('SetList Creation and Management Workflow', () => {
  const user = userEvent.setup();

  const mockNotes = [
    {
      id: '1',
      content: 'Opening joke about airlines',
      type: 'text',
      tags: ['comedy', 'travel'],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { duration: 45 },
      attachments: [],
    },
    {
      id: '2',
      content: 'Bit about social media',
      type: 'text',
      tags: ['comedy', 'technology'],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { duration: 60 },
      attachments: [],
    },
    {
      id: '3',
      content: 'Closing story about family',
      type: 'text',
      tags: ['comedy', 'family'],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { duration: 90 },
      attachments: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageService.getAllNotes.mockResolvedValue(mockNotes);
    mockStorageService.getAllSetLists.mockResolvedValue([]);
  });

  it('should complete setlist creation workflow', async () => {
    const mockSetList = {
      id: '1',
      name: 'Comedy Club Set',
      notes: [mockNotes[0], mockNotes[1]],
      totalDuration: 105,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStorageService.createSetList.mockResolvedValue(mockSetList);
    mockStorageService.getAllSetLists.mockResolvedValue([mockSetList]);

    render(<AppWrapper />);

    // Navigate to setlists page
    const setListsLink = screen.getByRole('link', { name: /setlists/i });
    await user.click(setListsLink);

    // Create new setlist
    const createButton = screen.getByRole('button', { name: /create setlist/i });
    await user.click(createButton);

    // Enter setlist name
    const nameInput = screen.getByPlaceholderText(/setlist name/i);
    await user.type(nameInput, 'Comedy Club Set');

    // Add notes to setlist
    const noteSelector = screen.getByText('Opening joke about airlines');
    await user.click(noteSelector);

    const addButton = screen.getByRole('button', { name: /add to setlist/i });
    await user.click(addButton);

    // Add second note
    const secondNote = screen.getByText('Bit about social media');
    await user.click(secondNote);
    await user.click(addButton);

    // Save setlist
    const saveButton = screen.getByRole('button', { name: /save setlist/i });
    await user.click(saveButton);

    // Verify setlist creation
    await waitFor(() => {
      expect(mockStorageService.createSetList).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Comedy Club Set',
          notes: expect.arrayContaining([
            expect.objectContaining({ id: '1' }),
            expect.objectContaining({ id: '2' }),
          ]),
          totalDuration: 105,
        })
      );
    });

    // Verify setlist appears in list
    await waitFor(() => {
      expect(screen.getByText('Comedy Club Set')).toBeInTheDocument();
      expect(screen.getByText('1:45')).toBeInTheDocument(); // Total duration
    });
  });

  it('should complete setlist reordering workflow', async () => {
    const mockSetList = {
      id: '1',
      name: 'Test Set',
      notes: [mockNotes[0], mockNotes[1], mockNotes[2]],
      totalDuration: 195,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStorageService.getAllSetLists.mockResolvedValue([mockSetList]);
    mockStorageService.updateSetList.mockResolvedValue({
      ...mockSetList,
      notes: [mockNotes[2], mockNotes[0], mockNotes[1]], // Reordered
    });

    render(<AppWrapper />);

    // Navigate to setlists page
    const setListsLink = screen.getByRole('link', { name: /setlists/i });
    await user.click(setListsLink);

    // Wait for setlist to load
    await waitFor(() => {
      expect(screen.getByText('Test Set')).toBeInTheDocument();
    });

    // Edit setlist
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Simulate drag and drop reordering
    // Note: This is a simplified test - actual drag and drop would require more complex setup
    const reorderButton = screen.getByRole('button', { name: /reorder/i });
    await user.click(reorderButton);

    // Move first item to last position
    const moveDownButton = screen.getAllByRole('button', { name: /move down/i })[0];
    await user.click(moveDownButton);
    await user.click(moveDownButton);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify reordering
    await waitFor(() => {
      expect(mockStorageService.updateSetList).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          notes: expect.any(Array),
        })
      );
    });
  });

  it('should complete setlist to rehearsal workflow', async () => {
    const mockSetList = {
      id: '1',
      name: 'Rehearsal Set',
      notes: [mockNotes[0], mockNotes[1]],
      totalDuration: 105,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStorageService.getAllSetLists.mockResolvedValue([mockSetList]);

    render(<AppWrapper />);

    // Navigate to setlists page
    const setListsLink = screen.getByRole('link', { name: /setlists/i });
    await user.click(setListsLink);

    // Wait for setlist to load
    await waitFor(() => {
      expect(screen.getByText('Rehearsal Set')).toBeInTheDocument();
    });

    // Start rehearsal
    const rehearseButton = screen.getByRole('button', { name: /rehearse/i });
    await user.click(rehearseButton);

    // Should navigate to rehearsal page
    await waitFor(() => {
      expect(screen.getByText(/rehearsal mode/i)).toBeInTheDocument();
    });

    // Should show first note
    expect(screen.getByText('Opening joke about airlines')).toBeInTheDocument();

    // Should show rehearsal controls
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should complete setlist performance tracking workflow', async () => {
    const mockSetList = {
      id: '1',
      name: 'Performance Set',
      notes: [mockNotes[0], mockNotes[1]],
      totalDuration: 105,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockVenue = {
      id: '1',
      name: 'Comedy Club Downtown',
      location: 'Downtown',
      characteristics: {
        audienceSize: 100,
        audienceType: 'mixed',
        acoustics: 'good',
        lighting: 'professional',
      },
      contacts: [],
      performanceHistory: [],
    };

    mockStorageService.getAllSetLists.mockResolvedValue([mockSetList]);

    render(<AppWrapper />);

    // Navigate to performance page
    const performanceLink = screen.getByRole('link', { name: /performance/i });
    await user.click(performanceLink);

    // Log new performance
    const logButton = screen.getByRole('button', { name: /log performance/i });
    await user.click(logButton);

    // Select setlist
    const setListSelect = screen.getByRole('combobox', { name: /setlist/i });
    await user.selectOptions(setListSelect, 'Performance Set');

    // Enter performance details
    const venueInput = screen.getByPlaceholderText(/venue name/i);
    await user.type(venueInput, 'Comedy Club Downtown');

    const dateInput = screen.getByLabelText(/performance date/i);
    await user.type(dateInput, '2024-01-15');

    // Add feedback
    const feedbackTextarea = screen.getByPlaceholderText(/how did it go/i);
    await user.type(feedbackTextarea, 'Great crowd response, airline joke killed!');

    // Rate performance
    const ratingStars = screen.getAllByRole('button', { name: /star/i });
    await user.click(ratingStars[3]); // 4 stars

    // Save performance
    const saveButton = screen.getByRole('button', { name: /save performance/i });
    await user.click(saveButton);

    // Verify performance logging
    await waitFor(() => {
      expect(screen.getByText('Performance logged successfully')).toBeInTheDocument();
    });
  });

  it('should handle setlist duration calculation', async () => {
    const mockSetList = {
      id: '1',
      name: 'Duration Test',
      notes: [],
      totalDuration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStorageService.createSetList.mockResolvedValue(mockSetList);
    mockStorageService.updateSetList.mockImplementation((id, updates) => {
      const updatedSetList = { ...mockSetList, ...updates };
      if (updates.notes) {
        updatedSetList.totalDuration = updates.notes.reduce(
          (total: number, note: any) => total + (note.metadata?.duration || 0),
          0
        );
      }
      return Promise.resolve(updatedSetList);
    });

    render(<AppWrapper />);

    // Navigate to setlists page
    const setListsLink = screen.getByRole('link', { name: /setlists/i });
    await user.click(setListsLink);

    // Create new setlist
    const createButton = screen.getByRole('button', { name: /create setlist/i });
    await user.click(createButton);

    // Enter setlist name
    const nameInput = screen.getByPlaceholderText(/setlist name/i);
    await user.type(nameInput, 'Duration Test');

    // Add notes with different durations
    const firstNote = screen.getByText('Opening joke about airlines'); // 45s
    await user.click(firstNote);
    const addButton = screen.getByRole('button', { name: /add to setlist/i });
    await user.click(addButton);

    const secondNote = screen.getByText('Bit about social media'); // 60s
    await user.click(secondNote);
    await user.click(addButton);

    // Should show calculated total duration
    expect(screen.getByText('1:45')).toBeInTheDocument(); // 105 seconds = 1:45

    // Save setlist
    const saveButton = screen.getByRole('button', { name: /save setlist/i });
    await user.click(saveButton);

    // Verify duration calculation in save call
    await waitFor(() => {
      expect(mockStorageService.createSetList).toHaveBeenCalledWith(
        expect.objectContaining({
          totalDuration: 105,
        })
      );
    });
  });
});