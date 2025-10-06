/**
 * Shared TypeScript library for cross-platform consumption
 * This module can be consumed by React Native, Electron, and other platforms
 */

// Core business logic (platform-agnostic)
export * from '../business'

// Data models and types
export * from '../models'

// Utility functions
export * from '../utils'

// Contracts and interfaces
export * from '../contracts'

// Adapter interfaces (implementations are platform-specific)
export * from '../adapters'

// Platform factory for creating platform-specific implementations
export { PlatformFactory } from './PlatformFactory'

// Shared configuration
export { SharedConfig } from './SharedConfig'

// Cross-platform utilities
export * from './CrossPlatformUtils'

// Validation utilities
export * from './ValidationUtils'

// Event system for cross-platform communication
export * from './EventSystem'