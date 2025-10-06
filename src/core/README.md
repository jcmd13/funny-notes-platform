# Cross-Platform Architecture Documentation

This document describes the cross-platform architecture implemented for the Funny Notes application, designed to support Web, iOS, Android, and Desktop platforms with shared business logic and platform-specific optimizations.

## Architecture Overview

The architecture follows a layered approach with clear separation between platform-agnostic business logic and platform-specific implementations:

```
┌─────────────────────────────────────────────────────────────┐
│                    Platform Layer                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │   Web   │ │   iOS   │ │ Android │ │    Desktop      │   │
│  │ (React) │ │(SwiftUI)│ │(Compose)│ │   (Electron)    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Adapter Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Storage   │ │Media Capture│ │   Notifications     │   │
│  │   Adapter   │ │   Adapter   │ │     Adapter         │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Business Logic Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Capture   │ │   Content   │ │   Performance       │   │
│  │   Manager   │ │   Manager   │ │     Manager         │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │    Models   │ │   Storage   │ │      Sync           │   │
│  │             │ │   Service   │ │    Service          │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/core/
├── adapters/           # Platform adapter interfaces
│   ├── IPlatformAdapter.ts
│   ├── IMediaCaptureAdapter.ts
│   ├── INotificationAdapter.ts
│   ├── IFileSystemAdapter.ts
│   └── IDeviceAdapter.ts
├── business/           # Platform-agnostic business logic
│   ├── CaptureManager.ts
│   ├── ContentManager.ts
│   ├── PerformanceManager.ts
│   ├── ContactManager.ts
│   ├── WorkflowManager.ts
│   └── AnalyticsManager.ts
├── contracts/          # API contracts and data schemas
│   ├── APIContracts.ts
│   ├── DataSchemas.ts
│   ├── PlatformContracts.ts
│   └── SyncContracts.ts
├── models/             # Data models and types
├── services/           # Shared services
├── shared/             # Shared library for cross-platform consumption
│   ├── PlatformFactory.ts
│   ├── SharedConfig.ts
│   ├── CrossPlatformUtils.ts
│   ├── ValidationUtils.ts
│   └── EventSystem.ts
├── storage/            # Storage abstraction layer
├── theme/              # Theme system
└── utils/              # Utility functions
```

## Key Components

### 1. Platform Adapters

Platform adapters provide a consistent interface for platform-specific functionality:

#### IPlatformAdapter
The main adapter interface that aggregates all platform-specific capabilities:

```typescript
interface IPlatformAdapter {
  readonly platform: PlatformType
  readonly capabilities: PlatformCapabilities
  
  storage: IStorageAdapter
  mediaCapture: IMediaCaptureAdapter
  notifications: INotificationAdapter
  fileSystem: IFileSystemAdapter
  device: IDeviceAdapter
  
  initialize(): Promise<void>
  dispose(): Promise<void>
  getFeatureSupport(feature: PlatformFeature): boolean
}
```

#### IMediaCaptureAdapter
Handles camera, microphone, and media processing:

```typescript
interface IMediaCaptureAdapter {
  captureImage(options?: ImageCaptureOptions): Promise<CaptureResult<ImageData>>
  startAudioRecording(options?: AudioRecordingOptions): Promise<AudioRecording>
  extractTextFromImage(imageData: ImageData): Promise<OCRResult>
  transcribeAudio(audioData: AudioData): Promise<TranscriptionResult>
}
```

#### INotificationAdapter
Manages local and push notifications:

```typescript
interface INotificationAdapter {
  scheduleLocalNotification(notification: LocalNotification): Promise<string>
  registerForPushNotifications(): Promise<PushRegistrationResult>
  setBadgeCount(count: number): Promise<void>
}
```

### 2. Business Logic Managers

Business logic managers contain all platform-agnostic application logic:

#### CaptureManager
Handles content capture workflows:

```typescript
class CaptureManager {
  async captureText(content: string, options?: CaptureOptions): Promise<Note>
  async captureImage(options?: ImageCaptureOptions): Promise<Note>
  async captureVoice(options?: AudioRecordingOptions): Promise<VoiceRecording>
}
```

#### ContentManager
Manages content organization and search:

```typescript
class ContentManager {
  async searchContent(query: string, options?: SearchOptions): Promise<SearchResults>
  async autoOrganizeContent(options?: OrganizationOptions): Promise<OrganizationResult>
  async createOptimizedSetList(input: OptimizedSetListInput): Promise<SetList>
}
```

#### PerformanceManager
Handles rehearsals and performance tracking:

```typescript
class PerformanceManager {
  async startRehearsal(setListId: string): Promise<RehearsalController>
  async logPerformance(input: LogPerformanceInput): Promise<Performance>
  async getPerformanceInsights(): Promise<PerformanceInsights>
}
```

### 3. Shared Library

The shared library provides utilities and factories for cross-platform consumption:

#### PlatformFactory
Creates platform-specific implementations:

```typescript
class PlatformFactory {
  static registerPlatform(type: PlatformType, constructor: PlatformConstructor): void
  static createPlatformAdapter(type: PlatformType): Promise<IPlatformAdapter>
  static detectPlatform(): PlatformType
}
```

#### SharedConfig
Manages configuration across platforms:

```typescript
class ConfigManager {
  getConfig(): SharedConfig
  updateConfig(updates: Partial<SharedConfig>): void
  loadFromStorage(storage: ConfigStorage): Promise<void>
}
```

### 4. Data Contracts

#### API Contracts
Define the interface between client applications and backend services:

```typescript
interface ContentAPI {
  createNote(request: CreateNoteRequest): Promise<APIResponse<NoteResponse>>
  listNotes(request: ListNotesRequest): Promise<APIResponse<NoteResponse[]>>
  searchNotes(request: SearchNotesRequest): Promise<APIResponse<SearchResponse<NoteResponse>>>
}
```

#### Data Schemas
JSON Schema definitions for data validation:

```typescript
const DataSchemas = {
  Note: {
    type: "object",
    required: ["id", "content", "captureMethod", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      content: { type: "string", minLength: 1, maxLength: 10000 },
      captureMethod: { type: "string", enum: ["text", "voice", "image"] }
    }
  }
}
```

## Platform Implementation Guide

### Web Platform (React)

1. **Create Web Platform Adapter**:
```typescript
class WebPlatformAdapter implements IPlatformAdapter {
  platform = 'web' as const
  capabilities = {
    camera: true,
    microphone: true,
    offlineStorage: true,
    // ... other capabilities
  }
  
  storage = new IndexedDBAdapter()
  mediaCapture = new WebMediaCaptureAdapter()
  notifications = new WebNotificationAdapter()
  // ... other adapters
}
```

2. **Register Platform**:
```typescript
PlatformFactory.registerPlatform('web', WebPlatformAdapter, {
  environment: 'production',
  features: { offlineMode: true }
})
```

3. **Initialize Application**:
```typescript
const platformAdapter = await PlatformFactory.createAutoDetectedAdapter()
const storageService = new StorageService(platformAdapter.storage)
const captureManager = new CaptureManager(platformAdapter, storageService)
```

### iOS Platform (React Native)

1. **Create iOS Platform Adapter**:
```typescript
class IOSPlatformAdapter implements IPlatformAdapter {
  platform = 'ios' as const
  capabilities = {
    camera: true,
    microphone: true,
    biometrics: true,
    haptics: true,
    // ... iOS-specific capabilities
  }
  
  storage = new CoreDataAdapter()
  mediaCapture = new IOSMediaCaptureAdapter()
  notifications = new IOSNotificationAdapter()
  // ... other adapters
}
```

2. **iOS-Specific Features**:
```typescript
class IOSMediaCaptureAdapter implements IMediaCaptureAdapter {
  async captureImage(options?: ImageCaptureOptions): Promise<CaptureResult<ImageData>> {
    // Use React Native's ImagePicker or native iOS camera APIs
    const result = await ImagePicker.launchCamera(options)
    return this.processImageResult(result)
  }
}
```

### Android Platform (React Native)

1. **Create Android Platform Adapter**:
```typescript
class AndroidPlatformAdapter implements IPlatformAdapter {
  platform = 'android' as const
  capabilities = {
    camera: true,
    microphone: true,
    systemIntegration: true,
    // ... Android-specific capabilities
  }
  
  storage = new RoomAdapter()
  mediaCapture = new AndroidMediaCaptureAdapter()
  notifications = new AndroidNotificationAdapter()
  // ... other adapters
}
```

### Desktop Platform (Electron)

1. **Create Desktop Platform Adapter**:
```typescript
class DesktopPlatformAdapter implements IPlatformAdapter {
  platform = 'desktop' as const
  capabilities = {
    fileSystem: true,
    systemIntegration: true,
    backgroundProcessing: true,
    // ... desktop-specific capabilities
  }
  
  storage = new SQLiteAdapter()
  mediaCapture = new DesktopMediaCaptureAdapter()
  notifications = new DesktopNotificationAdapter()
  // ... other adapters
}
```

## Usage Examples

### Basic Setup

```typescript
import { PlatformFactory, CaptureManager, ContentManager, StorageService } from '@/core'

// Auto-detect and create platform adapter
const platformAdapter = await PlatformFactory.createAutoDetectedAdapter({
  environment: 'production',
  features: { offlineMode: true }
})

// Initialize services
const storageService = new StorageService(platformAdapter.storage)
const captureManager = new CaptureManager(platformAdapter, storageService)
const contentManager = new ContentManager(platformAdapter, storageService)

// Use business logic
const note = await captureManager.captureText('My funny idea', {
  tags: ['observational', 'work']
})

const searchResults = await contentManager.searchContent('funny idea')
```

### Platform-Specific Features

```typescript
// Check platform capabilities
if (platformAdapter.getFeatureSupport('biometrics')) {
  const authResult = await platformAdapter.device.authenticateWithBiometric({
    reason: 'Authenticate to access your notes'
  })
}

// Use platform-specific optimizations
const config = PlatformUtils.getOptimalConfig()
const storageConfig = PlatformUtils.getStorageConfig(platformAdapter.platform)
```

### Event Handling

```typescript
import { globalEventBus } from '@/core/shared/EventSystem'

// Listen for sync events
globalEventBus.on('data:sync:completed', ({ changes }) => {
  console.log(`Synced ${changes} changes`)
})

// Emit custom events
globalEventBus.emit('feature:used', {
  feature: 'voice-capture',
  timestamp: new Date()
})
```

## Testing Strategy

### Unit Testing
- Test business logic managers independently
- Mock platform adapters for consistent testing
- Validate data schemas and contracts

### Integration Testing
- Test platform adapter implementations
- Validate cross-platform data consistency
- Test sync and conflict resolution

### Platform Testing
- Test on actual devices/browsers
- Validate platform-specific features
- Performance testing across platforms

## Migration Guide

### From Web-Only to Cross-Platform

1. **Extract Business Logic**:
   - Move React-specific logic to business managers
   - Replace direct API calls with adapter interfaces
   - Abstract storage operations

2. **Implement Platform Adapters**:
   - Create web platform adapter
   - Implement required adapter interfaces
   - Register platform with factory

3. **Update Application Code**:
   - Use platform factory for initialization
   - Replace direct dependencies with injected adapters
   - Update configuration management

### Adding New Platforms

1. **Implement Platform Adapter**:
   - Create new platform adapter class
   - Implement all required adapter interfaces
   - Add platform-specific optimizations

2. **Register Platform**:
   - Register with platform factory
   - Add platform detection logic
   - Create default configuration

3. **Test and Validate**:
   - Run cross-platform test suite
   - Validate feature parity
   - Performance testing

## Best Practices

### Code Organization
- Keep business logic platform-agnostic
- Use dependency injection for platform adapters
- Maintain clear separation of concerns

### Performance
- Use platform-specific optimizations
- Implement lazy loading where appropriate
- Cache frequently accessed data

### Error Handling
- Implement graceful degradation
- Provide fallbacks for unsupported features
- Log platform-specific errors appropriately

### Security
- Use platform-specific security features
- Implement proper data encryption
- Follow platform security guidelines

## Future Considerations

### Planned Enhancements
- WebAssembly support for performance-critical operations
- Real-time collaboration features
- Advanced AI integration
- Voice command support

### Platform Roadmap
- Web: Progressive Web App enhancements
- iOS: Apple Watch companion app
- Android: Wear OS support
- Desktop: Native menu integration

This architecture provides a solid foundation for cross-platform development while maintaining the flexibility to leverage platform-specific features and optimizations.