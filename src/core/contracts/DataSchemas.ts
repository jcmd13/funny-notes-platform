/**
 * Data schemas and validation contracts for cross-platform data consistency
 * These schemas ensure data integrity across all platform implementations
 */

// JSON Schema definitions for data validation
export const DataSchemas = {
  Note: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["id", "content", "captureMethod", "createdAt", "updatedAt"],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Unique identifier for the note"
      },
      content: {
        type: "string",
        minLength: 1,
        maxLength: 10000,
        description: "The main content of the note"
      },
      captureMethod: {
        type: "string",
        enum: ["text", "voice", "image"],
        description: "Method used to capture the note"
      },
      tags: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
          maxLength: 50
        },
        maxItems: 20,
        description: "Tags associated with the note"
      },
      venue: {
        type: "string",
        maxLength: 200,
        description: "Venue where the note was captured or intended for"
      },
      audience: {
        type: "string",
        maxLength: 100,
        description: "Target audience type"
      },
      estimatedDuration: {
        type: "number",
        minimum: 0,
        maximum: 7200,
        description: "Estimated duration in seconds"
      },
      metadata: {
        type: "object",
        properties: {
          location: { $ref: "#/definitions/GeolocationData" },
          capturedAt: { type: "string", format: "date-time" },
          platform: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          duration: { type: "number", minimum: 0 },
          isPlaceholder: { type: "boolean" }
        },
        additionalProperties: true
      },
      attachments: {
        type: "array",
        items: { $ref: "#/definitions/Attachment" },
        maxItems: 10
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Creation timestamp"
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Last update timestamp"
      },
      version: {
        type: "integer",
        minimum: 1,
        description: "Version number for conflict resolution"
      }
    },
    additionalProperties: false
  },

  SetList: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["id", "name", "notes", "totalDuration", "createdAt", "updatedAt"],
    properties: {
      id: {
        type: "string",
        format: "uuid"
      },
      name: {
        type: "string",
        minLength: 1,
        maxLength: 200
      },
      notes: {
        type: "array",
        items: { $ref: "#/definitions/Note" },
        maxItems: 100
      },
      totalDuration: {
        type: "number",
        minimum: 0
      },
      venue: {
        type: "string",
        maxLength: 200
      },
      performanceDate: {
        type: "string",
        format: "date-time"
      },
      description: {
        type: "string",
        maxLength: 1000
      },
      feedback: {
        type: "array",
        items: { $ref: "#/definitions/PerformanceFeedback" }
      },
      createdAt: {
        type: "string",
        format: "date-time"
      },
      updatedAt: {
        type: "string",
        format: "date-time"
      },
      version: {
        type: "integer",
        minimum: 1
      }
    },
    additionalProperties: false
  },

  Venue: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["id", "name", "location", "characteristics", "createdAt", "updatedAt"],
    properties: {
      id: {
        type: "string",
        format: "uuid"
      },
      name: {
        type: "string",
        minLength: 1,
        maxLength: 200
      },
      location: {
        type: "string",
        minLength: 1,
        maxLength: 500
      },
      characteristics: {
        type: "object",
        properties: {
          audienceSize: {
            type: "integer",
            minimum: 1,
            maximum: 100000
          },
          audienceType: {
            type: "string",
            maxLength: 100
          },
          acoustics: {
            type: "string",
            enum: ["excellent", "good", "poor"]
          },
          lighting: {
            type: "string",
            enum: ["professional", "basic", "minimal"]
          },
          stageSize: {
            type: "string",
            enum: ["large", "medium", "small"]
          },
          microphoneType: {
            type: "string",
            maxLength: 100
          }
        },
        additionalProperties: true
      },
      description: {
        type: "string",
        maxLength: 1000
      },
      contacts: {
        type: "array",
        items: { type: "string", format: "uuid" }
      },
      performanceHistory: {
        type: "array",
        items: { $ref: "#/definitions/PerformanceHistoryItem" }
      },
      createdAt: {
        type: "string",
        format: "date-time"
      },
      updatedAt: {
        type: "string",
        format: "date-time"
      },
      version: {
        type: "integer",
        minimum: 1
      }
    },
    additionalProperties: false
  },

  Contact: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["id", "name", "role", "contactInfo", "createdAt", "updatedAt"],
    properties: {
      id: {
        type: "string",
        format: "uuid"
      },
      name: {
        type: "string",
        minLength: 1,
        maxLength: 200
      },
      role: {
        type: "string",
        minLength: 1,
        maxLength: 100
      },
      venue: {
        type: "string",
        format: "uuid"
      },
      contactInfo: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            maxLength: 320
          },
          phone: {
            type: "string",
            pattern: "^[+]?[0-9\\s\\-\\(\\)]{7,20}$"
          },
          social: {
            type: "object",
            patternProperties: {
              "^[a-zA-Z0-9_]+$": {
                type: "string",
                maxLength: 100
              }
            },
            additionalProperties: false
          },
          address: {
            type: "string",
            maxLength: 500
          }
        },
        additionalProperties: false
      },
      notes: {
        type: "string",
        maxLength: 2000
      },
      interactions: {
        type: "array",
        items: { $ref: "#/definitions/Interaction" }
      },
      reminders: {
        type: "array",
        items: { $ref: "#/definitions/Reminder" }
      },
      createdAt: {
        type: "string",
        format: "date-time"
      },
      updatedAt: {
        type: "string",
        format: "date-time"
      },
      version: {
        type: "integer",
        minimum: 1
      }
    },
    additionalProperties: false
  },

  Performance: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["id", "setListId", "venueId", "date", "status", "createdAt", "updatedAt"],
    properties: {
      id: {
        type: "string",
        format: "uuid"
      },
      setListId: {
        type: "string",
        format: "uuid"
      },
      venueId: {
        type: "string",
        format: "uuid"
      },
      date: {
        type: "string",
        format: "date-time"
      },
      startTime: {
        type: "string",
        format: "date-time"
      },
      endTime: {
        type: "string",
        format: "date-time"
      },
      actualDuration: {
        type: "number",
        minimum: 0
      },
      status: {
        type: "string",
        enum: ["scheduled", "in-progress", "completed", "cancelled"]
      },
      notes: {
        type: "string",
        maxLength: 2000
      },
      feedback: { $ref: "#/definitions/PerformanceFeedback" },
      createdAt: {
        type: "string",
        format: "date-time"
      },
      updatedAt: {
        type: "string",
        format: "date-time"
      },
      version: {
        type: "integer",
        minimum: 1
      }
    },
    additionalProperties: false
  },

  RehearsalSession: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["id", "setListId", "startTime", "currentNoteIndex", "isCompleted", "createdAt", "updatedAt"],
    properties: {
      id: {
        type: "string",
        format: "uuid"
      },
      setListId: {
        type: "string",
        format: "uuid"
      },
      startTime: {
        type: "string",
        format: "date-time"
      },
      endTime: {
        type: "string",
        format: "date-time"
      },
      totalDuration: {
        type: "number",
        minimum: 0
      },
      currentNoteIndex: {
        type: "integer",
        minimum: 0
      },
      noteTimings: {
        type: "array",
        items: { $ref: "#/definitions/NoteTiming" }
      },
      isCompleted: {
        type: "boolean"
      },
      createdAt: {
        type: "string",
        format: "date-time"
      },
      updatedAt: {
        type: "string",
        format: "date-time"
      },
      version: {
        type: "integer",
        minimum: 1
      }
    },
    additionalProperties: false
  },

  // Common definitions
  definitions: {
    GeolocationData: {
      type: "object",
      required: ["latitude", "longitude", "accuracy", "timestamp"],
      properties: {
        latitude: {
          type: "number",
          minimum: -90,
          maximum: 90
        },
        longitude: {
          type: "number",
          minimum: -180,
          maximum: 180
        },
        altitude: {
          type: "number"
        },
        accuracy: {
          type: "number",
          minimum: 0
        },
        altitudeAccuracy: {
          type: "number",
          minimum: 0
        },
        heading: {
          type: "number",
          minimum: 0,
          maximum: 360
        },
        speed: {
          type: "number",
          minimum: 0
        },
        timestamp: {
          type: "string",
          format: "date-time"
        }
      },
      additionalProperties: false
    },

    Attachment: {
      type: "object",
      required: ["id", "type", "url"],
      properties: {
        id: {
          type: "string",
          format: "uuid"
        },
        type: {
          type: "string",
          enum: ["image", "audio", "video", "file"]
        },
        url: {
          type: "string",
          format: "uri"
        },
        thumbnailUrl: {
          type: "string",
          format: "uri"
        },
        metadata: {
          type: "object",
          properties: {
            filename: { type: "string", maxLength: 255 },
            mimeType: { type: "string", maxLength: 100 },
            size: { type: "integer", minimum: 0 },
            duration: { type: "number", minimum: 0 },
            width: { type: "integer", minimum: 1 },
            height: { type: "integer", minimum: 1 },
            format: { type: "string", maxLength: 20 },
            sampleRate: { type: "integer", minimum: 1 },
            channels: { type: "integer", minimum: 1 }
          },
          additionalProperties: true
        }
      },
      additionalProperties: false
    },

    PerformanceFeedback: {
      type: "object",
      properties: {
        rating: {
          type: "number",
          minimum: 1,
          maximum: 5
        },
        audienceSize: {
          type: "integer",
          minimum: 1
        },
        audienceResponse: {
          type: "string",
          enum: ["excellent", "good", "mixed", "poor"]
        },
        notes: {
          type: "string",
          maxLength: 2000
        },
        materialFeedback: {
          type: "array",
          items: { $ref: "#/definitions/MaterialFeedback" }
        },
        venueRating: {
          type: "number",
          minimum: 1,
          maximum: 5
        },
        wouldReturnToVenue: {
          type: "boolean"
        },
        recordedAt: {
          type: "string",
          format: "date-time"
        }
      },
      additionalProperties: false
    },

    MaterialFeedback: {
      type: "object",
      required: ["noteId", "rating"],
      properties: {
        noteId: {
          type: "string",
          format: "uuid"
        },
        rating: {
          type: "number",
          minimum: 1,
          maximum: 5
        },
        response: {
          type: "string",
          enum: ["killed", "good", "okay", "bombed"]
        },
        notes: {
          type: "string",
          maxLength: 500
        }
      },
      additionalProperties: false
    },

    PerformanceHistoryItem: {
      type: "object",
      required: ["id", "date", "duration"],
      properties: {
        id: {
          type: "string",
          format: "uuid"
        },
        setListId: {
          type: "string",
          format: "uuid"
        },
        date: {
          type: "string",
          format: "date-time"
        },
        duration: {
          type: "number",
          minimum: 0
        },
        audienceSize: {
          type: "integer",
          minimum: 1
        },
        rating: {
          type: "number",
          minimum: 1,
          maximum: 5
        },
        notes: {
          type: "string",
          maxLength: 1000
        },
        createdAt: {
          type: "string",
          format: "date-time"
        }
      },
      additionalProperties: false
    },

    Interaction: {
      type: "object",
      required: ["id", "type", "description", "createdAt"],
      properties: {
        id: {
          type: "string",
          format: "uuid"
        },
        type: {
          type: "string",
          enum: ["call", "email", "meeting", "text", "social", "other"]
        },
        description: {
          type: "string",
          minLength: 1,
          maxLength: 1000
        },
        outcome: {
          type: "string",
          enum: ["positive", "negative", "neutral", "booked", "rejected"]
        },
        followUpRequired: {
          type: "boolean"
        },
        followUpDate: {
          type: "string",
          format: "date-time"
        },
        metadata: {
          type: "object",
          properties: {
            platform: { type: "string" },
            location: { type: "string" },
            duration: { type: "number", minimum: 0 }
          },
          additionalProperties: true
        },
        createdAt: {
          type: "string",
          format: "date-time"
        }
      },
      additionalProperties: false
    },

    Reminder: {
      type: "object",
      required: ["id", "type", "title", "description", "dueDate", "completed", "priority", "createdAt"],
      properties: {
        id: {
          type: "string",
          format: "uuid"
        },
        type: {
          type: "string",
          enum: ["follow-up", "performance", "rehearsal", "general"]
        },
        title: {
          type: "string",
          minLength: 1,
          maxLength: 200
        },
        description: {
          type: "string",
          minLength: 1,
          maxLength: 1000
        },
        dueDate: {
          type: "string",
          format: "date-time"
        },
        completed: {
          type: "boolean"
        },
        completedAt: {
          type: "string",
          format: "date-time"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"]
        },
        createdAt: {
          type: "string",
          format: "date-time"
        }
      },
      additionalProperties: false
    },

    NoteTiming: {
      type: "object",
      required: ["noteId", "duration", "timestamp"],
      properties: {
        noteId: {
          type: "string",
          format: "uuid"
        },
        duration: {
          type: "number",
          minimum: 0
        },
        timestamp: {
          type: "string",
          format: "date-time"
        }
      },
      additionalProperties: false
    }
  }
}

// Type definitions for schema validation
export interface SchemaValidationResult {
  valid: boolean
  errors: SchemaValidationError[]
}

export interface SchemaValidationError {
  path: string
  message: string
  value: any
  schema: any
}

// Data transformation contracts
export interface DataTransformer<TInput, TOutput> {
  transform(input: TInput): TOutput
  reverse(output: TOutput): TInput
  validate(data: any): SchemaValidationResult
}

// Platform-specific data adapters
export interface PlatformDataAdapter {
  // Convert from platform-specific format to standard format
  fromPlatform<T>(data: any, schema: string): T
  
  // Convert from standard format to platform-specific format
  toPlatform<T>(data: T, schema: string): any
  
  // Validate data against schema
  validate(data: any, schema: string): SchemaValidationResult
  
  // Get supported schemas
  getSupportedSchemas(): string[]
}

// Migration contracts for schema evolution
export interface SchemaMigration {
  fromVersion: number
  toVersion: number
  entityType: string
  migrate(data: any): any
  rollback(data: any): any
}

export interface MigrationManager {
  registerMigration(migration: SchemaMigration): void
  migrateData(data: any, entityType: string, fromVersion: number, toVersion: number): any
  getCurrentVersion(entityType: string): number
  getSupportedVersions(entityType: string): number[]
}

// Data consistency contracts
export interface ConsistencyRule {
  name: string
  entityTypes: string[]
  validate(entities: Record<string, any[]>): ConsistencyViolation[]
  repair(entities: Record<string, any[]>, violations: ConsistencyViolation[]): RepairResult
}

export interface ConsistencyViolation {
  rule: string
  severity: 'error' | 'warning' | 'info'
  message: string
  affectedEntities: EntityReference[]
  suggestedFix?: string
}

export interface EntityReference {
  type: string
  id: string
  field?: string
}

export interface RepairResult {
  success: boolean
  repairedViolations: ConsistencyViolation[]
  unrepairedViolations: ConsistencyViolation[]
  changes: EntityChange[]
}

export interface EntityChange {
  entityType: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  changes: Record<string, any>
}

// Export/Import contracts
export interface DataExporter {
  export(entities: Record<string, any[]>, format: ExportFormat): Promise<ExportResult>
  getSupportedFormats(): ExportFormat[]
}

export interface DataImporter {
  import(data: string | Blob, format: ExportFormat): Promise<ImportResult>
  validate(data: string | Blob, format: ExportFormat): Promise<ValidationResult>
  getSupportedFormats(): ExportFormat[]
}

export interface ExportFormat {
  name: string
  extension: string
  mimeType: string
  supportsPartialExport: boolean
  supportsCompression: boolean
}

export interface ExportResult {
  success: boolean
  data?: string | Blob
  format: ExportFormat
  entityCounts: Record<string, number>
  size: number
  error?: string
}

export interface ImportResult {
  success: boolean
  imported: Record<string, number>
  skipped: Record<string, number>
  errors: ImportError[]
  warnings: string[]
}

export interface ImportError {
  entityType: string
  entityData: any
  error: string
  line?: number
}

export interface ValidationResult {
  valid: boolean
  format: ExportFormat
  entityCounts: Record<string, number>
  errors: ValidationError[]
  warnings: string[]
}

export interface ValidationError {
  type: 'format' | 'schema' | 'reference' | 'constraint'
  message: string
  location?: string
  severity: 'error' | 'warning'
}

// Standard export formats
export const StandardExportFormats: ExportFormat[] = [
  {
    name: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
    supportsPartialExport: true,
    supportsCompression: true
  },
  {
    name: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
    supportsPartialExport: true,
    supportsCompression: false
  },
  {
    name: 'XML',
    extension: 'xml',
    mimeType: 'application/xml',
    supportsPartialExport: true,
    supportsCompression: true
  },
  {
    name: 'SQLite',
    extension: 'db',
    mimeType: 'application/x-sqlite3',
    supportsPartialExport: false,
    supportsCompression: false
  }
]

// Schema version management
export const SchemaVersions = {
  Note: 2,
  SetList: 2,
  Venue: 1,
  Contact: 2,
  Performance: 1,
  RehearsalSession: 1
}

// Default values for entities
export const DefaultValues = {
  Note: {
    tags: [],
    attachments: [],
    metadata: {},
    version: 1
  },
  SetList: {
    feedback: [],
    version: 1
  },
  Venue: {
    contacts: [],
    performanceHistory: [],
    version: 1
  },
  Contact: {
    interactions: [],
    reminders: [],
    version: 1
  },
  Performance: {
    status: 'scheduled',
    version: 1
  },
  RehearsalSession: {
    currentNoteIndex: 0,
    noteTimings: [],
    isCompleted: false,
    version: 1
  }
}