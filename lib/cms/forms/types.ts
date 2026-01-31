/**
 * Form Builder Types
 */

// Field types supported by the form builder
export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'url'
  | 'hidden'
  | 'rating'
  | 'range'

// Validation rule types
export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom'

// Validation rule
export interface ValidationRule {
  type: ValidationRuleType
  value?: string | number
  message: string
}

// Select/Radio option
export interface FieldOption {
  value: string
  label: string
}

// Conditional logic
export interface FieldCondition {
  field: string // Field name to check
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty'
  value?: string | number | boolean
}

// Form field definition
export interface FormField {
  id: string
  name: string
  type: FormFieldType
  label: string
  placeholder?: string
  description?: string
  defaultValue?: string | number | boolean | string[]
  options?: FieldOption[] // For select, multiselect, radio
  validation?: ValidationRule[]
  conditions?: FieldCondition[] // Show field only if conditions are met
  width?: 'full' | 'half' | 'third' // Grid width
  rows?: number // For textarea
  accept?: string // For file upload
  min?: number // For number, range
  max?: number // For number, range
  step?: number // For number, range
}

// Form definition
export interface FormDefinition {
  id: string
  name: string
  slug: string
  description?: string
  fields: FormField[]
  settings: FormSettings
  createdAt: string
  updatedAt: string
}

// Form settings
export interface FormSettings {
  submitButtonText: string
  successMessage: string
  redirectUrl?: string
  notifyEmails: string[]
  captchaEnabled: boolean
  storeSubmissions: boolean
  limitSubmissions?: number
  closeAfterDate?: string
}

// Form submission data
export interface FormSubmissionData {
  formId: string
  data: Record<string, any>
  metadata?: {
    ipAddress?: string
    userAgent?: string
    referrer?: string
    timestamp: string
  }
}

// Submission response
export interface FormSubmissionResponse {
  success: boolean
  message: string
  submissionId?: string
  redirectUrl?: string
  errors?: Record<string, string>
}

// Default field templates
export const FIELD_TEMPLATES: Record<string, Partial<FormField>> = {
  name: {
    type: 'text',
    label: 'Name',
    placeholder: 'Enter your name',
    validation: [{ type: 'required', message: 'Name is required' }],
  },
  email: {
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    validation: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Please enter a valid email' },
    ],
  },
  phone: {
    type: 'phone',
    label: 'Phone',
    placeholder: 'Enter your phone number',
  },
  message: {
    type: 'textarea',
    label: 'Message',
    placeholder: 'Enter your message',
    rows: 4,
    validation: [{ type: 'required', message: 'Message is required' }],
  },
  company: {
    type: 'text',
    label: 'Company',
    placeholder: 'Enter your company name',
  },
  website: {
    type: 'url',
    label: 'Website',
    placeholder: 'https://example.com',
    validation: [{ type: 'url', message: 'Please enter a valid URL' }],
  },
  subscribe: {
    type: 'checkbox',
    label: 'Subscribe to newsletter',
    defaultValue: false,
  },
}

// Default form settings
export const DEFAULT_FORM_SETTINGS: FormSettings = {
  submitButtonText: 'Submit',
  successMessage: 'Thank you for your submission!',
  notifyEmails: [],
  captchaEnabled: false,
  storeSubmissions: true,
}
