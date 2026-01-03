'use client'

/**
 * Dynamic Form Renderer
 *
 * Renders a form based on JSON field definitions
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { FormField, FormDefinition, FieldCondition } from '@/lib/forms/types'

interface DynamicFormProps {
  form: FormDefinition
  onSubmit?: (data: Record<string, any>) => void
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
  className?: string
}

export function DynamicForm({
  form,
  onSubmit,
  onSuccess,
  onError,
  className,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    // Initialize with default values
    const initial: Record<string, any> = {}
    form.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue
      }
    })
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Check if a field should be visible based on conditions
  const shouldShowField = useCallback(
    (field: FormField): boolean => {
      if (!field.conditions || field.conditions.length === 0) return true

      return field.conditions.every((condition) =>
        evaluateCondition(condition, formData)
      )
    },
    [formData]
  )

  // Evaluate a single condition
  const evaluateCondition = (
    condition: FieldCondition,
    data: Record<string, any>
  ): boolean => {
    const value = data[condition.field]

    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'notEquals':
        return value !== condition.value
      case 'contains':
        return String(value || '').includes(String(condition.value))
      case 'notContains':
        return !String(value || '').includes(String(condition.value))
      case 'isEmpty':
        return value === undefined || value === null || value === ''
      case 'isNotEmpty':
        return value !== undefined && value !== null && value !== ''
      default:
        return true
    }
  }

  // Handle field change
  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage(null)
    setErrors({})

    try {
      if (onSubmit) {
        onSubmit(formData)
        return
      }

      // Submit to API
      const response = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors)
        }
        setSubmitMessage(result.message || 'Submission failed')
        onError?.(result)
      } else {
        setSubmitSuccess(true)
        setSubmitMessage(result.message)
        onSuccess?.(result)

        // Redirect if configured
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl
        }
      }
    } catch (error) {
      setSubmitMessage('An error occurred. Please try again.')
      onError?.(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If submitted successfully, show success message
  if (submitSuccess) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-green-600 text-lg font-medium mb-2">
          {submitMessage || form.settings.successMessage}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.fields.map((field) => {
          if (!shouldShowField(field)) return null

          const width =
            field.width === 'half'
              ? 'md:col-span-1'
              : field.width === 'third'
                ? 'md:col-span-1'
                : 'md:col-span-2'

          return (
            <div key={field.id} className={cn('col-span-1', width)}>
              {renderField(field, formData, errors, handleChange)}
            </div>
          )
        })}
      </div>

      {submitMessage && !submitSuccess && (
        <div className="text-red-600 text-sm">{submitMessage}</div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? 'Submitting...' : form.settings.submitButtonText}
      </Button>
    </form>
  )
}

// Render individual field based on type
function renderField(
  field: FormField,
  data: Record<string, any>,
  errors: Record<string, string>,
  onChange: (name: string, value: any) => void
): React.ReactNode {
  const value = data[field.name]
  const error = errors[field.name]
  const isRequired = field.validation?.some((v) => v.type === 'required')

  const labelElement = (
    <Label htmlFor={field.id} className="mb-1.5 block">
      {field.label}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </Label>
  )

  const errorElement = error && (
    <p className="text-red-500 text-sm mt-1">{error}</p>
  )

  const descriptionElement = field.description && (
    <p className="text-gray-500 text-sm mt-1">{field.description}</p>
  )

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <div>
          {labelElement}
          <Input
            id={field.id}
            name={field.name}
            type={field.type === 'phone' ? 'tel' : field.type}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'number':
      return (
        <div>
          {labelElement}
          <Input
            id={field.id}
            name={field.name}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(field.name, e.target.valueAsNumber || '')}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={error ? 'border-red-500' : ''}
          />
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'textarea':
      return (
        <div>
          {labelElement}
          <Textarea
            id={field.id}
            name={field.name}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            className={error ? 'border-red-500' : ''}
          />
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'select':
      return (
        <div>
          {labelElement}
          <Select
            value={value || ''}
            onValueChange={(v) => onChange(field.name, v)}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'radio':
      return (
        <div>
          {labelElement}
          <RadioGroup
            value={value || ''}
            onValueChange={(v) => onChange(field.name, v)}
            className="mt-2"
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'checkbox':
      return (
        <div className="flex items-start space-x-2">
          <Checkbox
            id={field.id}
            checked={value || false}
            onCheckedChange={(checked) => onChange(field.name, checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor={field.id} className="font-normal cursor-pointer">
              {field.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {descriptionElement}
            {errorElement}
          </div>
        </div>
      )

    case 'date':
      return (
        <div>
          {labelElement}
          <Input
            id={field.id}
            name={field.name}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'time':
      return (
        <div>
          {labelElement}
          <Input
            id={field.id}
            name={field.name}
            type="time"
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'datetime':
      return (
        <div>
          {labelElement}
          <Input
            id={field.id}
            name={field.name}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'file':
      return (
        <div>
          {labelElement}
          <Input
            id={field.id}
            name={field.name}
            type="file"
            accept={field.accept}
            onChange={(e) => onChange(field.name, e.target.files?.[0] || null)}
            className={error ? 'border-red-500' : ''}
          />
          {descriptionElement}
          {errorElement}
        </div>
      )

    case 'hidden':
      return (
        <input
          type="hidden"
          name={field.name}
          value={value || field.defaultValue || ''}
        />
      )

    case 'range':
      return (
        <div>
          {labelElement}
          <div className="flex items-center gap-4">
            <input
              id={field.id}
              name={field.name}
              type="range"
              value={value ?? field.min ?? 0}
              onChange={(e) => onChange(field.name, parseInt(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12 text-right">
              {value ?? field.min ?? 0}
            </span>
          </div>
          {descriptionElement}
          {errorElement}
        </div>
      )

    default:
      return null
  }
}

export default DynamicForm
