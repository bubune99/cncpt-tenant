/**
 * Form templates — pre-built field definitions for common use cases.
 *
 * Each template provides a starting point that admins can customize in the
 * form editor after creation. Templates write to the same FormField[] schema
 * the editor expects, so behavior is identical to a hand-built form.
 */

import type { FormField } from "./types"

export interface FormTemplate {
  id: string
  name: string
  description: string
  icon: string // lucide icon name (resolved at the call site)
  fields: FormField[]
  defaultSubmitText?: string
  defaultSuccessMessage?: string
}

// ID generator that's stable across server/client renders. Uses the field
// `name` slug + a per-template counter — the form editor will assign new ids
// on save anyway, but we want consistent ids inside a template definition.
const fid = (slug: string, n: number) => `tpl-${slug}-${n}`

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "blank",
    name: "Blank form",
    description: "Start from scratch with no fields",
    icon: "FileText",
    fields: [],
  },

  {
    id: "contact",
    name: "Contact",
    description: "Name, email, message — the classic contact form",
    icon: "Mail",
    defaultSubmitText: "Send message",
    defaultSuccessMessage: "Thanks for reaching out — we'll get back to you soon.",
    fields: [
      {
        id: fid("contact", 1),
        name: "name",
        type: "text",
        label: "Your name",
        placeholder: "Jane Doe",
        validation: [{ type: "required", message: "Please enter your name" }],
        width: "full",
      },
      {
        id: fid("contact", 2),
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "you@example.com",
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Please enter a valid email" },
        ],
        width: "full",
      },
      {
        id: fid("contact", 3),
        name: "message",
        type: "textarea",
        label: "Message",
        placeholder: "How can we help?",
        rows: 5,
        validation: [{ type: "required", message: "Please enter a message" }],
        width: "full",
      },
    ],
  },

  {
    id: "newsletter",
    name: "Newsletter signup",
    description: "Single email field for list growth",
    icon: "Mail",
    defaultSubmitText: "Subscribe",
    defaultSuccessMessage: "You're in! Check your inbox to confirm.",
    fields: [
      {
        id: fid("newsletter", 1),
        name: "first_name",
        type: "text",
        label: "First name",
        placeholder: "Optional",
        width: "half",
      },
      {
        id: fid("newsletter", 2),
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "you@example.com",
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Please enter a valid email" },
        ],
        width: "half",
      },
    ],
  },

  {
    id: "rsvp",
    name: "RSVP / Event registration",
    description: "Attendance, dietary needs, plus-ones",
    icon: "CalendarDays",
    defaultSubmitText: "Confirm RSVP",
    defaultSuccessMessage: "Got it — see you there!",
    fields: [
      {
        id: fid("rsvp", 1),
        name: "name",
        type: "text",
        label: "Full name",
        validation: [{ type: "required", message: "Name is required" }],
        width: "full",
      },
      {
        id: fid("rsvp", 2),
        name: "email",
        type: "email",
        label: "Email",
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Invalid email" },
        ],
        width: "half",
      },
      {
        id: fid("rsvp", 3),
        name: "attending",
        type: "radio",
        label: "Will you attend?",
        options: [
          { value: "yes", label: "Yes, I'll be there" },
          { value: "no", label: "Sorry, can't make it" },
          { value: "maybe", label: "Maybe" },
        ],
        validation: [{ type: "required", message: "Please choose one" }],
        width: "half",
      },
      {
        id: fid("rsvp", 4),
        name: "guests",
        type: "number",
        label: "Number of additional guests",
        defaultValue: 0,
        min: 0,
        max: 10,
        width: "half",
      },
      {
        id: fid("rsvp", 5),
        name: "dietary",
        type: "textarea",
        label: "Dietary restrictions or accessibility needs",
        placeholder: "Optional — let us know how we can accommodate you",
        rows: 3,
        width: "full",
      },
    ],
  },

  {
    id: "feedback",
    name: "Feedback",
    description: "Rating + comments + optional contact",
    icon: "MessageSquare",
    defaultSubmitText: "Send feedback",
    defaultSuccessMessage: "Thanks — your feedback helps us improve.",
    fields: [
      {
        id: fid("feedback", 1),
        name: "rating",
        type: "rating",
        label: "How would you rate your experience?",
        min: 1,
        max: 5,
        validation: [{ type: "required", message: "Please give a rating" }],
        width: "full",
      },
      {
        id: fid("feedback", 2),
        name: "comments",
        type: "textarea",
        label: "What can we do better?",
        rows: 5,
        width: "full",
      },
      {
        id: fid("feedback", 3),
        name: "email",
        type: "email",
        label: "Email (optional, if you want a reply)",
        width: "full",
      },
    ],
  },

  {
    id: "quote",
    name: "Quote request",
    description: "Project details + budget + timeline",
    icon: "FileText",
    defaultSubmitText: "Request quote",
    defaultSuccessMessage: "Thanks — we'll review your request and reply with a quote shortly.",
    fields: [
      {
        id: fid("quote", 1),
        name: "name",
        type: "text",
        label: "Your name",
        validation: [{ type: "required", message: "Name is required" }],
        width: "half",
      },
      {
        id: fid("quote", 2),
        name: "company",
        type: "text",
        label: "Company",
        width: "half",
      },
      {
        id: fid("quote", 3),
        name: "email",
        type: "email",
        label: "Email",
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Invalid email" },
        ],
        width: "half",
      },
      {
        id: fid("quote", 4),
        name: "phone",
        type: "phone",
        label: "Phone",
        width: "half",
      },
      {
        id: fid("quote", 5),
        name: "project",
        type: "textarea",
        label: "Tell us about your project",
        rows: 5,
        validation: [{ type: "required", message: "Please describe your project" }],
        width: "full",
      },
      {
        id: fid("quote", 6),
        name: "budget",
        type: "select",
        label: "Estimated budget",
        options: [
          { value: "under-1k", label: "Under $1,000" },
          { value: "1k-5k", label: "$1,000 – $5,000" },
          { value: "5k-25k", label: "$5,000 – $25,000" },
          { value: "25k-100k", label: "$25,000 – $100,000" },
          { value: "100k-plus", label: "$100,000+" },
          { value: "unsure", label: "Not sure yet" },
        ],
        width: "half",
      },
      {
        id: fid("quote", 7),
        name: "timeline",
        type: "select",
        label: "Timeline",
        options: [
          { value: "asap", label: "ASAP" },
          { value: "1-month", label: "Within 1 month" },
          { value: "3-months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
        ],
        width: "half",
      },
    ],
  },

  {
    id: "volunteer",
    name: "Volunteer signup",
    description: "Availability + interests + contact",
    icon: "Users",
    defaultSubmitText: "Sign up to volunteer",
    defaultSuccessMessage: "Thanks for offering your time — we'll be in touch.",
    fields: [
      {
        id: fid("volunteer", 1),
        name: "name",
        type: "text",
        label: "Full name",
        validation: [{ type: "required", message: "Name is required" }],
        width: "full",
      },
      {
        id: fid("volunteer", 2),
        name: "email",
        type: "email",
        label: "Email",
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Invalid email" },
        ],
        width: "half",
      },
      {
        id: fid("volunteer", 3),
        name: "phone",
        type: "phone",
        label: "Phone",
        width: "half",
      },
      {
        id: fid("volunteer", 4),
        name: "availability",
        type: "multiselect",
        label: "When are you available?",
        options: [
          { value: "weekday-morning", label: "Weekday mornings" },
          { value: "weekday-afternoon", label: "Weekday afternoons" },
          { value: "weekday-evening", label: "Weekday evenings" },
          { value: "weekend", label: "Weekends" },
          { value: "remote", label: "Remote / flexible" },
        ],
        width: "full",
      },
      {
        id: fid("volunteer", 5),
        name: "interests",
        type: "textarea",
        label: "What kind of work interests you?",
        rows: 4,
        width: "full",
      },
    ],
  },

  {
    id: "donation-inquiry",
    name: "Donation inquiry",
    description: "Amount range + frequency + dedication",
    icon: "Heart",
    defaultSubmitText: "Submit inquiry",
    defaultSuccessMessage: "Thank you for your interest in supporting us — we'll follow up shortly.",
    fields: [
      {
        id: fid("donation", 1),
        name: "name",
        type: "text",
        label: "Your name",
        validation: [{ type: "required", message: "Name is required" }],
        width: "half",
      },
      {
        id: fid("donation", 2),
        name: "email",
        type: "email",
        label: "Email",
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Invalid email" },
        ],
        width: "half",
      },
      {
        id: fid("donation", 3),
        name: "amount",
        type: "select",
        label: "Donation amount",
        options: [
          { value: "25", label: "$25" },
          { value: "50", label: "$50" },
          { value: "100", label: "$100" },
          { value: "250", label: "$250" },
          { value: "500", label: "$500" },
          { value: "custom", label: "Other amount" },
        ],
        width: "half",
      },
      {
        id: fid("donation", 4),
        name: "frequency",
        type: "radio",
        label: "Frequency",
        options: [
          { value: "one-time", label: "One-time" },
          { value: "monthly", label: "Monthly" },
          { value: "annual", label: "Annual" },
        ],
        defaultValue: "one-time",
        width: "half",
      },
      {
        id: fid("donation", 5),
        name: "dedication",
        type: "text",
        label: "In honor of (optional)",
        placeholder: "Name or memorial dedication",
        width: "full",
      },
    ],
  },

  {
    id: "job-application",
    name: "Job application",
    description: "Position + resume + cover letter",
    icon: "Briefcase",
    defaultSubmitText: "Submit application",
    defaultSuccessMessage: "Thanks for applying — we'll review your application and get back to you.",
    fields: [
      {
        id: fid("job", 1),
        name: "name",
        type: "text",
        label: "Full name",
        validation: [{ type: "required", message: "Name is required" }],
        width: "full",
      },
      {
        id: fid("job", 2),
        name: "email",
        type: "email",
        label: "Email",
        validation: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Invalid email" },
        ],
        width: "half",
      },
      {
        id: fid("job", 3),
        name: "phone",
        type: "phone",
        label: "Phone",
        validation: [{ type: "required", message: "Phone is required" }],
        width: "half",
      },
      {
        id: fid("job", 4),
        name: "position",
        type: "text",
        label: "Position you're applying for",
        validation: [{ type: "required", message: "Please specify the role" }],
        width: "full",
      },
      {
        id: fid("job", 5),
        name: "resume",
        type: "file",
        label: "Resume / CV",
        accept: ".pdf,.doc,.docx",
        validation: [{ type: "required", message: "Please upload your resume" }],
        width: "full",
      },
      {
        id: fid("job", 6),
        name: "cover_letter",
        type: "textarea",
        label: "Why are you interested in this role?",
        rows: 6,
        width: "full",
      },
      {
        id: fid("job", 7),
        name: "linkedin",
        type: "url",
        label: "LinkedIn (optional)",
        placeholder: "https://linkedin.com/in/...",
        width: "full",
      },
    ],
  },

  {
    id: "bug-report",
    name: "Bug report",
    description: "Severity + steps to reproduce + expected vs actual",
    icon: "AlertCircle",
    defaultSubmitText: "Report bug",
    defaultSuccessMessage: "Thanks — we've logged your report and will investigate.",
    fields: [
      {
        id: fid("bug", 1),
        name: "title",
        type: "text",
        label: "Short title",
        placeholder: "e.g. Cart total wrong on mobile",
        validation: [{ type: "required", message: "Title is required" }],
        width: "full",
      },
      {
        id: fid("bug", 2),
        name: "severity",
        type: "select",
        label: "Severity",
        options: [
          { value: "low", label: "Low — minor UI issue" },
          { value: "medium", label: "Medium — noticeable but not blocking" },
          { value: "high", label: "High — blocks important workflow" },
          { value: "critical", label: "Critical — site is broken or losing data" },
        ],
        defaultValue: "medium",
        validation: [{ type: "required", message: "Choose a severity" }],
        width: "half",
      },
      {
        id: fid("bug", 3),
        name: "browser",
        type: "text",
        label: "Browser / device",
        placeholder: "e.g. Chrome 130 on iOS",
        width: "half",
      },
      {
        id: fid("bug", 4),
        name: "steps",
        type: "textarea",
        label: "Steps to reproduce",
        placeholder: "1. Go to /cart\\n2. Add 2 items\\n3. ...",
        rows: 5,
        validation: [{ type: "required", message: "Please describe the steps" }],
        width: "full",
      },
      {
        id: fid("bug", 5),
        name: "expected",
        type: "textarea",
        label: "What you expected to happen",
        rows: 3,
        width: "half",
      },
      {
        id: fid("bug", 6),
        name: "actual",
        type: "textarea",
        label: "What actually happened",
        rows: 3,
        width: "half",
      },
      {
        id: fid("bug", 7),
        name: "email",
        type: "email",
        label: "Your email (optional, for follow-up)",
        width: "full",
      },
    ],
  },
]

export function getTemplateById(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((t) => t.id === id)
}
