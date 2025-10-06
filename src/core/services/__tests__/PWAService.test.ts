import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PWAService } from '../PWAService'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    addEventListener: vi.fn(),
    controller: {
      postMessage: vi.fn()
    },
    getRegistration: vi.fn()
  },
})

describe('PWAService', () => {
  let pwaService: PWAService

  beforeEach(() => {
    vi.clearAllMocks()
    pwaService = new PWAService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const state = pwaService.getState()
    
    expect(state.isInstallable).toBe(false)
    expect(state.isInstalled).toBe(false)
    expect(state.isOnline).toBe(true)
    expect(state.isUpdateAvailable).toBe(false)
    expect(state.syncStatus).toBe('idle')
  })

  it('should detect standalone mode as installed', () => {
    // Mock standalone mode
    window.matchMedia = vi.fn().mockImplementation(() => ({ matches: true }))
    
    const service = new PWAService()
    const state = service.getState()
    
    expect(state.isInstalled).toBe(true)
  })

  it('should handle state subscriptions', () => {
    const listener = vi.fn()
    const unsubscribe = pwaService.subscribe(listener)
    
    // Manually trigger the state update (in real scenario, this would be triggered by event)
    pwaService['updateState']({ isOnline: false })
    
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ isOnline: false })
    )
    
    unsubscribe()
  })

  it('should handle background sync trigger', async () => {
    const mockPostMessage = vi.fn()
    Object.defineProperty(navigator.serviceWorker, 'controller', {
      value: { postMessage: mockPostMessage },
      writable: true
    })

    await pwaService.triggerBackgroundSync()

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'TRIGGER_SYNC',
      timestamp: expect.any(Number)
    })
  })

  it('should handle notification permission request', async () => {
    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    } as any

    const permission = await pwaService.requestNotificationPermission()
    
    expect(permission).toBe('granted')
    expect(global.Notification.requestPermission).toHaveBeenCalled()
  })

  it('should return denied for unsupported notification API', async () => {
    // Remove Notification from global
    delete (global as any).Notification

    const permission = await pwaService.requestNotificationPermission()
    
    expect(permission).toBe('denied')
  })

  it('should handle app update', async () => {
    const mockWaiting = {
      postMessage: vi.fn()
    }
    
    const mockRegistration = {
      waiting: mockWaiting
    }

    navigator.serviceWorker.getRegistration = vi.fn().mockResolvedValue(mockRegistration)
    
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    })

    await pwaService.updateApp()

    expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })
})