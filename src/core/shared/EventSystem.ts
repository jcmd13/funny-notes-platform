/**
 * Cross-platform event system for communication between components
 * Provides a unified way to handle events across all platforms
 */

/**
 * Type-safe event emitter for cross-platform communication
 */
export class EventEmitter<TEvents extends Record<string, any> = Record<string, any>> {
  private listeners = new Map<keyof TEvents, Set<EventListener<any>>>()
  private onceListeners = new Map<keyof TEvents, Set<EventListener<any>>>()
  private maxListeners = 100

  /**
   * Add event listener
   */
  on<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): this {
    this.addListener(event, listener, false)
    return this
  }

  /**
   * Add one-time event listener
   */
  once<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): this {
    this.addListener(event, listener, true)
    return this
  }

  /**
   * Remove event listener
   */
  off<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): this {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(event)
      }
    }

    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      onceListeners.delete(listener)
      if (onceListeners.size === 0) {
        this.onceListeners.delete(event)
      }
    }

    return this
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners<K extends keyof TEvents>(event?: K): this {
    if (event) {
      this.listeners.delete(event)
      this.onceListeners.delete(event)
    } else {
      this.listeners.clear()
      this.onceListeners.clear()
    }
    return this
  }

  /**
   * Emit event
   */
  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): boolean {
    let hasListeners = false

    // Call regular listeners
    const listeners = this.listeners.get(event)
    if (listeners && listeners.size > 0) {
      hasListeners = true
      for (const listener of Array.from(listeners)) {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in event listener for '${String(event)}':`, error)
        }
      }
    }

    // Call once listeners and remove them
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners && onceListeners.size > 0) {
      hasListeners = true
      for (const listener of Array.from(onceListeners)) {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in once event listener for '${String(event)}':`, error)
        }
      }
      this.onceListeners.delete(event)
    }

    return hasListeners
  }

  /**
   * Get listener count for an event
   */
  listenerCount<K extends keyof TEvents>(event: K): number {
    const listeners = this.listeners.get(event)?.size || 0
    const onceListeners = this.onceListeners.get(event)?.size || 0
    return listeners + onceListeners
  }

  /**
   * Get all event names
   */
  eventNames(): (keyof TEvents)[] {
    const names = new Set<keyof TEvents>()
    for (const name of this.listeners.keys()) {
      names.add(name)
    }
    for (const name of this.onceListeners.keys()) {
      names.add(name)
    }
    return Array.from(names)
  }

  /**
   * Set maximum number of listeners per event
   */
  setMaxListeners(max: number): this {
    this.maxListeners = max
    return this
  }

  /**
   * Get maximum number of listeners per event
   */
  getMaxListeners(): number {
    return this.maxListeners
  }

  private addListener<K extends keyof TEvents>(
    event: K,
    listener: EventListener<TEvents[K]>,
    once: boolean
  ): void {
    const map = once ? this.onceListeners : this.listeners
    
    if (!map.has(event)) {
      map.set(event, new Set())
    }

    const listeners = map.get(event)!
    
    if (listeners.size >= this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: Possible memory leak detected. ${listeners.size + 1} listeners added for event '${String(event)}'. Use setMaxListeners() to increase limit.`)
    }

    listeners.add(listener)
  }
}

/**
 * Global event bus for cross-component communication
 */
export class GlobalEventBus extends EventEmitter<GlobalEvents> {
  private static instance: GlobalEventBus

  static getInstance(): GlobalEventBus {
    if (!this.instance) {
      this.instance = new GlobalEventBus()
    }
    return this.instance
  }

  private constructor() {
    super()
  }
}

/**
 * Event bus for application-wide events
 */
export const globalEventBus = GlobalEventBus.getInstance()

/**
 * Async event emitter for handling async operations
 */
export class AsyncEventEmitter<TEvents extends Record<string, any> = Record<string, any>> extends EventEmitter<TEvents> {
  /**
   * Emit event and wait for all async listeners to complete
   */
  async emitAsync<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
    const promises: Promise<void>[] = []

    // Collect promises from regular listeners
    const listeners = this.listeners.get(event)
    if (listeners) {
      for (const listener of Array.from(listeners)) {
        try {
          const result = listener(data)
          if (result instanceof Promise) {
            promises.push(result)
          }
        } catch (error) {
          console.error(`Error in async event listener for '${String(event)}':`, error)
        }
      }
    }

    // Collect promises from once listeners
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      for (const listener of Array.from(onceListeners)) {
        try {
          const result = listener(data)
          if (result instanceof Promise) {
            promises.push(result)
          }
        } catch (error) {
          console.error(`Error in async once event listener for '${String(event)}':`, error)
        }
      }
      this.onceListeners.delete(event)
    }

    // Wait for all promises to resolve
    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  /**
   * Emit event with timeout
   */
  async emitWithTimeout<K extends keyof TEvents>(
    event: K,
    data: TEvents[K],
    timeout: number = 5000
  ): Promise<void> {
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error(`Event '${String(event)}' timed out after ${timeout}ms`)), timeout)
    })

    await Promise.race([
      this.emitAsync(event, data),
      timeoutPromise
    ])
  }
}

/**
 * Event middleware system for intercepting and modifying events
 */
export class EventMiddleware<TEvents extends Record<string, any> = Record<string, any>> {
  private middlewares: MiddlewareFunction<any>[] = []

  /**
   * Add middleware function
   */
  use<K extends keyof TEvents>(middleware: MiddlewareFunction<TEvents[K]>): this {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * Process event through middleware chain
   */
  async process<K extends keyof TEvents>(
    event: K,
    data: TEvents[K],
    next: (processedData: TEvents[K]) => void | Promise<void>
  ): Promise<void> {
    let index = 0
    let processedData = data

    const processNext = async (): Promise<void> => {
      if (index >= this.middlewares.length) {
        await next(processedData)
        return
      }

      const middleware = this.middlewares[index++]
      await middleware(event as string, processedData, (modifiedData?: TEvents[K]) => {
        if (modifiedData !== undefined) {
          processedData = modifiedData
        }
        return processNext()
      })
    }

    await processNext()
  }
}

/**
 * Event emitter with middleware support
 */
export class MiddlewareEventEmitter<TEvents extends Record<string, any> = Record<string, any>> extends AsyncEventEmitter<TEvents> {
  private middleware = new EventMiddleware<TEvents>()

  /**
   * Add middleware
   */
  use<K extends keyof TEvents>(middleware: MiddlewareFunction<TEvents[K]>): this {
    this.middleware.use(middleware)
    return this
  }

  /**
   * Emit event through middleware
   */
  async emitWithMiddleware<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
    await this.middleware.process(event, data, async (processedData) => {
      await this.emitAsync(event, processedData)
    })
  }
}

/**
 * Event store for maintaining event history
 */
export class EventStore<TEvents extends Record<string, any> = Record<string, any>> {
  private events: StoredEvent<any>[] = []
  private maxEvents = 1000

  /**
   * Store event
   */
  store<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const storedEvent: StoredEvent<TEvents[K]> = {
      id: this.generateId(),
      event: event as string,
      data,
      timestamp: new Date(),
      processed: false
    }

    this.events.push(storedEvent)

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }
  }

  /**
   * Get all events
   */
  getEvents(): StoredEvent<any>[] {
    return [...this.events]
  }

  /**
   * Get events by type
   */
  getEventsByType<K extends keyof TEvents>(event: K): StoredEvent<TEvents[K]>[] {
    return this.events.filter(e => e.event === event) as StoredEvent<TEvents[K]>[]
  }

  /**
   * Get events since timestamp
   */
  getEventsSince(timestamp: Date): StoredEvent<any>[] {
    return this.events.filter(e => e.timestamp >= timestamp)
  }

  /**
   * Mark event as processed
   */
  markProcessed(eventId: string): void {
    const event = this.events.find(e => e.id === eventId)
    if (event) {
      event.processed = true
    }
  }

  /**
   * Get unprocessed events
   */
  getUnprocessedEvents(): StoredEvent<any>[] {
    return this.events.filter(e => !e.processed)
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = []
  }

  /**
   * Set maximum number of events to store
   */
  setMaxEvents(max: number): void {
    this.maxEvents = max
    
    // Trim if necessary
    if (this.events.length > max) {
      this.events = this.events.slice(-max)
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Event emitter with built-in event store
 */
export class StoredEventEmitter<TEvents extends Record<string, any> = Record<string, any>> extends MiddlewareEventEmitter<TEvents> {
  private eventStore = new EventStore<TEvents>()

  /**
   * Emit event and store it
   */
  async emitAndStore<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
    this.eventStore.store(event, data)
    await this.emitWithMiddleware(event, data)
  }

  /**
   * Get event store
   */
  getEventStore(): EventStore<TEvents> {
    return this.eventStore
  }
}

/**
 * Event aggregator for combining multiple event sources
 */
export class EventAggregator<TEvents extends Record<string, any> = Record<string, any>> extends EventEmitter<TEvents> {
  private sources = new Set<EventEmitter<any>>()

  /**
   * Add event source
   */
  addSource<TSourceEvents extends Record<string, any>>(
    source: EventEmitter<TSourceEvents>,
    eventMap?: Partial<Record<keyof TSourceEvents, keyof TEvents>>
  ): this {
    this.sources.add(source)

    // Forward events from source
    for (const sourceEvent of source.eventNames()) {
      const targetEvent = eventMap?.[sourceEvent] || sourceEvent
      
      source.on(sourceEvent, (data) => {
        this.emit(targetEvent as keyof TEvents, data)
      })
    }

    return this
  }

  /**
   * Remove event source
   */
  removeSource(source: EventEmitter<any>): this {
    this.sources.delete(source)
    source.removeAllListeners()
    return this
  }

  /**
   * Remove all sources
   */
  removeAllSources(): this {
    for (const source of this.sources) {
      source.removeAllListeners()
    }
    this.sources.clear()
    return this
  }
}

/**
 * Utility functions for event handling
 */
export class EventUtils {
  /**
   * Create a promise that resolves when an event is emitted
   */
  static waitForEvent<TEvents extends Record<string, any>, K extends keyof TEvents>(
    emitter: EventEmitter<TEvents>,
    event: K,
    timeout?: number
  ): Promise<TEvents[K]> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined

      const cleanup = () => {
        emitter.off(event, onEvent)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }

      const onEvent = (data: TEvents[K]) => {
        cleanup()
        resolve(data)
      }

      emitter.once(event, onEvent)

      if (timeout) {
        timeoutId = setTimeout(() => {
          cleanup()
          reject(new Error(`Timeout waiting for event '${String(event)}'`))
        }, timeout)
      }
    })
  }

  /**
   * Create a debounced event listener
   */
  static debounce<T>(
    callback: (data: T) => void,
    delay: number
  ): (data: T) => void {
    let timeoutId: NodeJS.Timeout | undefined

    return (data: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        callback(data)
      }, delay)
    }
  }

  /**
   * Create a throttled event listener
   */
  static throttle<T>(
    callback: (data: T) => void,
    delay: number
  ): (data: T) => void {
    let lastCall = 0

    return (data: T) => {
      const now = Date.now()
      
      if (now - lastCall >= delay) {
        lastCall = now
        callback(data)
      }
    }
  }

  /**
   * Combine multiple event emitters into one
   */
  static combine<TEvents extends Record<string, any>>(
    ...emitters: EventEmitter<TEvents>[]
  ): EventEmitter<TEvents> {
    const combined = new EventEmitter<TEvents>()

    for (const emitter of emitters) {
      for (const event of emitter.eventNames()) {
        emitter.on(event, (data) => {
          combined.emit(event, data)
        })
      }
    }

    return combined
  }
}

// Type definitions
export type EventListener<T = any> = (data: T) => void | Promise<void>

export type MiddlewareFunction<T = any> = (
  event: string,
  data: T,
  next: (modifiedData?: T) => void | Promise<void>
) => void | Promise<void>

export interface StoredEvent<T = any> {
  id: string
  event: string
  data: T
  timestamp: Date
  processed: boolean
}

// Global event types
export interface GlobalEvents {
  // Application lifecycle
  'app:initialized': { timestamp: Date }
  'app:ready': { timestamp: Date }
  'app:shutdown': { timestamp: Date }
  
  // User events
  'user:login': { userId: string; timestamp: Date }
  'user:logout': { userId: string; timestamp: Date }
  
  // Data events
  'data:sync:started': { timestamp: Date }
  'data:sync:completed': { timestamp: Date; changes: number }
  'data:sync:failed': { timestamp: Date; error: string }
  
  // UI events
  'ui:theme:changed': { theme: string; timestamp: Date }
  'ui:route:changed': { from: string; to: string; timestamp: Date }
  
  // Performance events
  'performance:slow': { operation: string; duration: number; timestamp: Date }
  'performance:memory:high': { usage: number; timestamp: Date }
  
  // Error events
  'error:unhandled': { error: Error; timestamp: Date }
  'error:network': { url: string; error: string; timestamp: Date }
  
  // Feature events
  'feature:used': { feature: string; userId?: string; timestamp: Date }
  'feature:enabled': { feature: string; timestamp: Date }
  'feature:disabled': { feature: string; timestamp: Date }
}