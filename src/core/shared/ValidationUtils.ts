/**
 * Validation utilities for cross-platform data validation
 * Provides consistent validation across all platforms
 */

import { DataSchemas } from '../contracts/DataSchemas'

/**
 * JSON Schema validator
 */
export class SchemaValidator {
  private static compiledSchemas = new Map<string, CompiledSchema>()

  /**
   * Validate data against a schema
   */
  static validate(data: any, schemaName: string): ValidationResult {
    const schema = DataSchemas[schemaName as keyof typeof DataSchemas]
    if (!schema) {
      return {
        valid: false,
        errors: [`Schema '${schemaName}' not found`]
      }
    }

    return this.validateAgainstSchema(data, schema)
  }

  /**
   * Validate data against a custom schema
   */
  static validateAgainstSchema(data: any, schema: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      this.validateRecursive(data, schema, '', errors, warnings)
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static validateRecursive(
    data: any,
    schema: any,
    path: string,
    errors: string[],
    warnings: string[]
  ): void {
    // Handle $ref references
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/definitions/', '')
      const refSchema = DataSchemas.definitions[refPath as keyof typeof DataSchemas.definitions]
      if (refSchema) {
        this.validateRecursive(data, refSchema, path, errors, warnings)
        return
      } else {
        errors.push(`${path}: Reference '${schema.$ref}' not found`)
        return
      }
    }

    // Type validation
    if (schema.type) {
      if (!this.validateType(data, schema.type)) {
        errors.push(`${path}: Expected ${schema.type}, got ${typeof data}`)
        return
      }
    }

    // Required properties
    if (schema.required && schema.type === 'object') {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          errors.push(`${path}: Missing required property '${requiredProp}'`)
        }
      }
    }

    // Object properties
    if (schema.type === 'object' && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in data) {
          this.validateRecursive(
            data[propName],
            propSchema,
            path ? `${path}.${propName}` : propName,
            errors,
            warnings
          )
        }
      }

      // Additional properties
      if (schema.additionalProperties === false) {
        const allowedProps = new Set(Object.keys(schema.properties))
        for (const propName of Object.keys(data)) {
          if (!allowedProps.has(propName)) {
            warnings.push(`${path}: Unexpected property '${propName}'`)
          }
        }
      }
    }

    // Array items
    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        this.validateRecursive(
          item,
          schema.items,
          `${path}[${index}]`,
          errors,
          warnings
        )
      })

      // Array length constraints
      if (schema.maxItems && data.length > schema.maxItems) {
        errors.push(`${path}: Array too long (${data.length} > ${schema.maxItems})`)
      }
      if (schema.minItems && data.length < schema.minItems) {
        errors.push(`${path}: Array too short (${data.length} < ${schema.minItems})`)
      }
    }

    // String constraints
    if (schema.type === 'string' && typeof data === 'string') {
      if (schema.minLength && data.length < schema.minLength) {
        errors.push(`${path}: String too short (${data.length} < ${schema.minLength})`)
      }
      if (schema.maxLength && data.length > schema.maxLength) {
        errors.push(`${path}: String too long (${data.length} > ${schema.maxLength})`)
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
        errors.push(`${path}: String does not match pattern`)
      }
      if (schema.format && !this.validateFormat(data, schema.format)) {
        errors.push(`${path}: Invalid ${schema.format} format`)
      }
    }

    // Number constraints
    if ((schema.type === 'number' || schema.type === 'integer') && typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push(`${path}: Number too small (${data} < ${schema.minimum})`)
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push(`${path}: Number too large (${data} > ${schema.maximum})`)
      }
      if (schema.type === 'integer' && !Number.isInteger(data)) {
        errors.push(`${path}: Expected integer, got ${data}`)
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(`${path}: Value must be one of: ${schema.enum.join(', ')}`)
    }
  }

  private static validateType(data: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof data === 'string'
      case 'number':
        return typeof data === 'number' && !isNaN(data)
      case 'integer':
        return typeof data === 'number' && Number.isInteger(data)
      case 'boolean':
        return typeof data === 'boolean'
      case 'array':
        return Array.isArray(data)
      case 'object':
        return typeof data === 'object' && data !== null && !Array.isArray(data)
      case 'null':
        return data === null
      default:
        return true
    }
  }

  private static validateFormat(data: string, format: string): boolean {
    switch (format) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)
      case 'uri':
        try {
          new URL(data)
          return true
        } catch {
          return false
        }
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data)
      case 'date-time':
        return !isNaN(Date.parse(data))
      case 'date':
        return /^\d{4}-\d{2}-\d{2}$/.test(data) && !isNaN(Date.parse(data))
      case 'time':
        return /^\d{2}:\d{2}:\d{2}$/.test(data)
      default:
        return true
    }
  }
}

/**
 * Business logic validators
 */
export class BusinessValidators {
  /**
   * Validate note content
   */
  static validateNoteContent(content: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!content || content.trim().length === 0) {
      errors.push('Note content cannot be empty')
    }

    if (content.length > 10000) {
      errors.push('Note content is too long (max 10,000 characters)')
    }

    if (content.length < 3) {
      warnings.push('Note content is very short')
    }

    // Check for potentially problematic content
    if (content.includes('<script>')) {
      errors.push('Note content contains potentially unsafe script tags')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate tags
   */
  static validateTags(tags: string[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (tags.length > 20) {
      errors.push('Too many tags (max 20)')
    }

    const uniqueTags = new Set(tags)
    if (uniqueTags.size !== tags.length) {
      warnings.push('Duplicate tags detected')
    }

    for (const tag of tags) {
      if (!tag || tag.trim().length === 0) {
        errors.push('Empty tags are not allowed')
      }
      if (tag.length > 50) {
        errors.push(`Tag "${tag}" is too long (max 50 characters)`)
      }
      if (!/^[a-zA-Z0-9\-_\s]+$/.test(tag)) {
        warnings.push(`Tag "${tag}" contains special characters`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate duration
   */
  static validateDuration(duration: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (duration < 0) {
      errors.push('Duration cannot be negative')
    }

    if (duration > 7200) { // 2 hours
      warnings.push('Duration is very long (over 2 hours)')
    }

    if (duration > 0 && duration < 10) {
      warnings.push('Duration is very short (under 10 seconds)')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!email) {
      errors.push('Email is required')
      return { valid: false, errors, warnings }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format')
    }

    if (email.length > 320) {
      errors.push('Email is too long')
    }

    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    const domain = email.split('@')[1]?.toLowerCase()
    if (domain) {
      const similarDomain = commonDomains.find(d => 
        this.levenshteinDistance(domain, d) === 1
      )
      if (similarDomain) {
        warnings.push(`Did you mean ${email.replace(domain, similarDomain)}?`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!phone) {
      return { valid: true, errors, warnings } // Phone is optional
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')

    if (digitsOnly.length < 7) {
      errors.push('Phone number is too short')
    }

    if (digitsOnly.length > 15) {
      errors.push('Phone number is too long')
    }

    // Check for valid format patterns
    const validPatterns = [
      /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/, // US format
      /^\+?[1-9]\d{1,14}$/ // International format
    ]

    const isValidFormat = validPatterns.some(pattern => pattern.test(phone))
    if (!isValidFormat) {
      warnings.push('Phone number format may not be recognized')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate venue name
   */
  static validateVenueName(name: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!name || name.trim().length === 0) {
      errors.push('Venue name is required')
    }

    if (name.length > 200) {
      errors.push('Venue name is too long (max 200 characters)')
    }

    if (name.length < 2) {
      warnings.push('Venue name is very short')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate set list
   */
  static validateSetList(setList: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!setList.name || setList.name.trim().length === 0) {
      errors.push('Set list name is required')
    }

    if (!setList.notes || !Array.isArray(setList.notes)) {
      errors.push('Set list must have notes array')
    } else {
      if (setList.notes.length === 0) {
        warnings.push('Set list is empty')
      }

      if (setList.notes.length > 100) {
        warnings.push('Set list is very long (over 100 notes)')
      }

      // Check for duplicate notes
      const noteIds = setList.notes.map((note: any) => note.id)
      const uniqueIds = new Set(noteIds)
      if (uniqueIds.size !== noteIds.length) {
        warnings.push('Set list contains duplicate notes')
      }
    }

    if (setList.totalDuration && setList.totalDuration > 7200) {
      warnings.push('Set list is very long (over 2 hours)')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }
}

/**
 * Data sanitization utilities
 */
export class DataSanitizer {
  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    // Remove script tags and their content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove dangerous attributes
    html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    html = html.replace(/\s*javascript\s*:/gi, '')
    
    // Remove style attributes that could contain expressions
    html = html.replace(/\s*style\s*=\s*["'][^"']*expression[^"']*["']/gi, '')
    
    return html
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 10000) // Limit length
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Remove multiple underscores
      .substring(0, 255) // Limit length
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return ''
      }
      
      return parsed.toString()
    } catch {
      return ''
    }
  }
}

/**
 * Form validation utilities
 */
export class FormValidator {
  private rules: ValidationRule[] = []

  /**
   * Add validation rule
   */
  addRule(rule: ValidationRule): this {
    this.rules.push(rule)
    return this
  }

  /**
   * Validate form data
   */
  validate(data: Record<string, any>): FormValidationResult {
    const fieldErrors: Record<string, string[]> = {}
    const fieldWarnings: Record<string, string[]> = {}
    let isValid = true

    for (const rule of this.rules) {
      const value = data[rule.field]
      const result = rule.validator(value, data)

      if (!result.valid) {
        isValid = false
        fieldErrors[rule.field] = result.errors
      }

      if (result.warnings && result.warnings.length > 0) {
        fieldWarnings[rule.field] = result.warnings
      }
    }

    return {
      valid: isValid,
      fieldErrors,
      fieldWarnings
    }
  }

  /**
   * Create a required field validator
   */
  static required(message: string = 'This field is required'): FieldValidator {
    return (value: any) => ({
      valid: value !== null && value !== undefined && value !== '',
      errors: value !== null && value !== undefined && value !== '' ? [] : [message]
    })
  }

  /**
   * Create a minimum length validator
   */
  static minLength(min: number, message?: string): FieldValidator {
    return (value: any) => {
      const length = typeof value === 'string' ? value.length : 0
      const valid = length >= min
      return {
        valid,
        errors: valid ? [] : [message || `Minimum length is ${min} characters`]
      }
    }
  }

  /**
   * Create a maximum length validator
   */
  static maxLength(max: number, message?: string): FieldValidator {
    return (value: any) => {
      const length = typeof value === 'string' ? value.length : 0
      const valid = length <= max
      return {
        valid,
        errors: valid ? [] : [message || `Maximum length is ${max} characters`]
      }
    }
  }

  /**
   * Create an email validator
   */
  static email(message: string = 'Invalid email format'): FieldValidator {
    return (value: any) => {
      if (!value) return { valid: true, errors: [] }
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      return {
        valid,
        errors: valid ? [] : [message]
      }
    }
  }

  /**
   * Create a custom validator
   */
  static custom(validator: (value: any, data: Record<string, any>) => boolean, message: string): FieldValidator {
    return (value: any, data: Record<string, any>) => ({
      valid: validator(value, data),
      errors: validator(value, data) ? [] : [message]
    })
  }
}

// Type definitions
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

export interface FormValidationResult {
  valid: boolean
  fieldErrors: Record<string, string[]>
  fieldWarnings: Record<string, string[]>
}

export interface ValidationRule {
  field: string
  validator: FieldValidator
}

export type FieldValidator = (value: any, data?: Record<string, any>) => ValidationResult

interface CompiledSchema {
  validate: (data: any) => ValidationResult
}