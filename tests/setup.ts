import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => server.close());

// Mock IndexedDB for tests
Object.defineProperty(window, 'indexedDB', {
  value: require('fake-indexeddb'),
});

// Mock MediaRecorder for voice capture tests
Object.defineProperty(window, 'MediaRecorder', {
  value: class MockMediaRecorder {
    static isTypeSupported = () => true;
    start = () => {};
    stop = () => {};
    addEventListener = () => {};
    removeEventListener = () => {};
  },
});

// Mock getUserMedia for camera tests
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    }),
  },
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: (success: any) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      });
    },
  },
});