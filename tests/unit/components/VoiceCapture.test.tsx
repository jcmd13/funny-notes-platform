import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceCapture } from '@components/capture/VoiceCapture';

// Mock MediaRecorder
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockAddEventListener = vi.fn();

global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: mockStart,
  stop: mockStop,
  addEventListener: mockAddEventListener,
  removeEventListener: vi.fn(),
  state: 'inactive',
})) as any;

// Mock the useNotes hook
const mockCreateNote = vi.fn();

vi.mock('@/hooks/useNotes', () => ({
  useNotes: () => ({
    createNote: mockCreateNote,
    loading: false,
    error: null,
  }),
}));

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});

describe('VoiceCapture', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render record button', () => {
    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    expect(recordButton).toBeInTheDocument();
  });

  it('should request microphone permission when starting recording', async () => {
    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });
  });

  it('should start recording when button is clicked', async () => {
    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });
  });

  it('should show recording indicator when recording', async () => {
    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    await waitFor(() => {
      expect(screen.getByText(/recording/i)).toBeInTheDocument();
    });
  });

  it('should stop recording when stop button is clicked', async () => {
    render(<VoiceCapture />);
    
    // Start recording first
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });

    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    await user.click(stopButton);

    expect(mockStop).toHaveBeenCalled();
  });

  it('should show recording duration', async () => {
    vi.useFakeTimers();
    
    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByText(/00:03/)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should create note with audio when recording is complete', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    
    // Mock the dataavailable event
    mockAddEventListener.mockImplementation((event, callback) => {
      if (event === 'dataavailable') {
        setTimeout(() => callback({ data: mockBlob }), 100);
      }
      if (event === 'stop') {
        setTimeout(() => callback(), 150);
      }
    });

    mockCreateNote.mockResolvedValue({
      id: '1',
      content: 'Transcribed audio content',
      type: 'voice',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { duration: 3 },
      attachments: [{ type: 'audio', data: mockBlob }],
    });

    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    await waitFor(() => {
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      return user.click(stopButton);
    });

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voice',
          attachments: expect.arrayContaining([
            expect.objectContaining({
              type: 'audio',
              data: mockBlob,
            }),
          ]),
        })
      );
    });
  });

  it('should handle microphone permission denied', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValue(
      new Error('Permission denied')
    );

    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    await waitFor(() => {
      expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument();
    });
  });

  it('should show playback controls after recording', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    
    mockAddEventListener.mockImplementation((event, callback) => {
      if (event === 'dataavailable') {
        setTimeout(() => callback({ data: mockBlob }), 100);
      }
      if (event === 'stop') {
        setTimeout(() => callback(), 150);
      }
    });

    render(<VoiceCapture />);
    
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    await waitFor(() => {
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      return user.click(stopButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  it('should allow re-recording', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    
    mockAddEventListener.mockImplementation((event, callback) => {
      if (event === 'dataavailable') {
        setTimeout(() => callback({ data: mockBlob }), 100);
      }
      if (event === 'stop') {
        setTimeout(() => callback(), 150);
      }
    });

    render(<VoiceCapture />);
    
    // Record first time
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await user.click(recordButton);

    await waitFor(() => {
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      return user.click(stopButton);
    });

    // Should show re-record option
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /record again/i })).toBeInTheDocument();
    });

    const reRecordButton = screen.getByRole('button', { name: /record again/i });
    await user.click(reRecordButton);

    // Should be back to initial state
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });
});