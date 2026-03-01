/**
 * V0/React Import Preprocessing Pipeline
 *
 * Transforms v0.dev/React code into parser-friendly JSX BEFORE importFromReact() runs.
 * This is purely string-based — it transforms JSX source code, not Block objects.
 *
 * Pipeline:
 *   1. Strip React boilerplate (imports, hooks, types, function wrappers)
 *   2. Resolve dynamic className builders (cn, clsx, twMerge)
 *   3. Map shadcn/ui components to HTML + Tailwind
 *   4. Convert Next.js components (Image → img, Link → a)
 *   5. Strip event handlers, preserve as data attrs
 *   6. Flatten JSX expressions in attributes
 *   7. Handle conditional rendering
 */

import type { Block } from "./types"

// ── Types ────────────────────────────────────────────────────────────

export interface PreprocessWarning {
  type: "unknown-component" | "stripped-handler" | "conditional-render" | "binding-flattened" | "inline-style-stripped"
  message: string
  original?: string
}

export interface PreprocessResult {
  code: string
  warnings: PreprocessWarning[]
  componentsMapped: string[]
  handlersStripped: string[]
  bindingsFlattened: string[]
}

export interface ImportValidation {
  blockCount: number
  warnings: string[]
  quality: number
}

// ── Shadcn/UI Component Mapping ──────────────────────────────────────

interface ComponentMapping {
  tag: string
  classes: string
}

interface ButtonVariantMapping {
  [variant: string]: string
}

const BUTTON_VARIANTS: ButtonVariantMapping = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
}

const BUTTON_SIZES: Record<string, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
}

const SHADCN_MAP: Record<string, ComponentMapping> = {
  Button: {
    tag: "button",
    classes: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  },
  Card: { tag: "div", classes: "rounded-xl border bg-card text-card-foreground shadow" },
  CardHeader: { tag: "div", classes: "flex flex-col space-y-1.5 p-6" },
  CardTitle: { tag: "h3", classes: "font-semibold leading-none tracking-tight" },
  CardDescription: { tag: "p", classes: "text-sm text-muted-foreground" },
  CardContent: { tag: "div", classes: "p-6 pt-0" },
  CardFooter: { tag: "div", classes: "flex items-center p-6 pt-0" },
  Badge: { tag: "span", classes: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors" },
  Input: { tag: "input", classes: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" },
  Textarea: { tag: "textarea", classes: "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" },
  Label: { tag: "label", classes: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" },
  Separator: { tag: "hr", classes: "shrink-0 bg-border h-[1px] w-full" },
  Avatar: { tag: "div", classes: "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full" },
  AvatarImage: { tag: "img", classes: "aspect-square h-full w-full" },
  AvatarFallback: { tag: "span", classes: "flex h-full w-full items-center justify-center rounded-full bg-muted" },
  Skeleton: { tag: "div", classes: "animate-pulse rounded-md bg-primary/10" },
  Switch: { tag: "button", classes: "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" },
  ScrollArea: { tag: "div", classes: "relative overflow-auto" },
  Tabs: { tag: "div", classes: "" },
  TabsList: { tag: "div", classes: "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground" },
  TabsTrigger: { tag: "button", classes: "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all" },
  TabsContent: { tag: "div", classes: "mt-2" },
  Dialog: { tag: "div", classes: "" },
  DialogContent: { tag: "div", classes: "fixed inset-0 z-50 flex items-center justify-center" },
  DialogHeader: { tag: "div", classes: "flex flex-col space-y-1.5 text-center sm:text-left" },
  DialogTitle: { tag: "h2", classes: "text-lg font-semibold leading-none tracking-tight" },
  DialogDescription: { tag: "p", classes: "text-sm text-muted-foreground" },
  DialogTrigger: { tag: "button", classes: "" },
  DialogFooter: { tag: "div", classes: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2" },
  Select: { tag: "div", classes: "relative" },
  SelectTrigger: { tag: "button", classes: "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" },
  SelectContent: { tag: "div", classes: "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md" },
  SelectItem: { tag: "div", classes: "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none" },
  SelectValue: { tag: "span", classes: "" },
  Accordion: { tag: "div", classes: "" },
  AccordionItem: { tag: "div", classes: "border-b" },
  AccordionTrigger: { tag: "button", classes: "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline" },
  AccordionContent: { tag: "div", classes: "overflow-hidden text-sm" },
  Table: { tag: "table", classes: "w-full caption-bottom text-sm" },
  TableHeader: { tag: "thead", classes: "[&_tr]:border-b" },
  TableBody: { tag: "tbody", classes: "[&_tr:last-child]:border-0" },
  TableRow: { tag: "tr", classes: "border-b transition-colors hover:bg-muted/50" },
  TableHead: { tag: "th", classes: "h-10 px-2 text-left align-middle font-medium text-muted-foreground" },
  TableCell: { tag: "td", classes: "p-2 align-middle" },
  AlertDialog: { tag: "div", classes: "" },
  Alert: { tag: "div", classes: "relative w-full rounded-lg border px-4 py-3 text-sm" },
  AlertTitle: { tag: "h5", classes: "mb-1 font-medium leading-none tracking-tight" },
  AlertDescription: { tag: "div", classes: "text-sm [&_p]:leading-relaxed" },
  Checkbox: { tag: "button", classes: "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" },
  RadioGroup: { tag: "div", classes: "grid gap-2" },
  RadioGroupItem: { tag: "button", classes: "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring" },
  Progress: { tag: "div", classes: "relative h-2 w-full overflow-hidden rounded-full bg-primary/20" },
  Slider: { tag: "div", classes: "relative flex w-full touch-none select-none items-center" },
  Tooltip: { tag: "div", classes: "" },
  TooltipTrigger: { tag: "button", classes: "" },
  TooltipContent: { tag: "div", classes: "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in" },
  Popover: { tag: "div", classes: "" },
  PopoverTrigger: { tag: "button", classes: "" },
  PopoverContent: { tag: "div", classes: "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none" },
  DropdownMenu: { tag: "div", classes: "" },
  DropdownMenuTrigger: { tag: "button", classes: "" },
  DropdownMenuContent: { tag: "div", classes: "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md" },
  DropdownMenuItem: { tag: "div", classes: "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground" },
  DropdownMenuSeparator: { tag: "hr", classes: "-mx-1 my-1 h-px bg-muted" },
  Sheet: { tag: "div", classes: "" },
  SheetContent: { tag: "div", classes: "fixed inset-y-0 right-0 z-50 flex h-full w-3/4 flex-col border-l bg-background shadow-lg sm:max-w-sm" },
  SheetHeader: { tag: "div", classes: "flex flex-col space-y-2 text-center sm:text-left" },
  SheetTitle: { tag: "h2", classes: "text-lg font-semibold text-foreground" },
  SheetDescription: { tag: "p", classes: "text-sm text-muted-foreground" },
  SheetTrigger: { tag: "button", classes: "" },
  Collapsible: { tag: "div", classes: "" },
  CollapsibleTrigger: { tag: "button", classes: "" },
  CollapsibleContent: { tag: "div", classes: "overflow-hidden" },
  AspectRatio: { tag: "div", classes: "relative w-full" },
  Breadcrumb: { tag: "nav", classes: "" },
  BreadcrumbList: { tag: "ol", classes: "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5" },
  BreadcrumbItem: { tag: "li", classes: "inline-flex items-center gap-1.5" },
  BreadcrumbLink: { tag: "a", classes: "transition-colors hover:text-foreground" },
  BreadcrumbSeparator: { tag: "span", classes: "[&>svg]:size-3.5" },
  BreadcrumbPage: { tag: "span", classes: "font-normal text-foreground" },
  Command: { tag: "div", classes: "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground" },
  CommandInput: { tag: "input", classes: "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" },
  CommandList: { tag: "div", classes: "max-h-[300px] overflow-y-auto overflow-x-hidden" },
  CommandItem: { tag: "div", classes: "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none" },
  CommandGroup: { tag: "div", classes: "overflow-hidden p-1 text-foreground" },
  HoverCard: { tag: "div", classes: "" },
  HoverCardTrigger: { tag: "button", classes: "" },
  HoverCardContent: { tag: "div", classes: "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md" },
  Menubar: { tag: "div", classes: "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm" },
  NavigationMenu: { tag: "nav", classes: "relative z-10 flex max-w-max flex-1 items-center justify-center" },
  NavigationMenuList: { tag: "ul", classes: "group flex flex-1 list-none items-center justify-center space-x-1" },
  NavigationMenuItem: { tag: "li", classes: "" },
  NavigationMenuLink: { tag: "a", classes: "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground" },
  Pagination: { tag: "nav", classes: "mx-auto flex w-full justify-center" },
  PaginationContent: { tag: "ul", classes: "flex flex-row items-center gap-1" },
  PaginationItem: { tag: "li", classes: "" },
  PaginationLink: { tag: "a", classes: "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors h-9 px-4 py-2 hover:bg-accent hover:text-accent-foreground" },
  Carousel: { tag: "div", classes: "relative" },
  CarouselContent: { tag: "div", classes: "flex" },
  CarouselItem: { tag: "div", classes: "min-w-0 shrink-0 grow-0 basis-full" },
  CarouselPrevious: { tag: "button", classes: "absolute left-[-12px] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full" },
  CarouselNext: { tag: "button", classes: "absolute right-[-12px] top-1/2 -translate-y-1/2 h-8 w-8 rounded-full" },
  Calendar: { tag: "div", classes: "p-3" },
  Toggle: { tag: "button", classes: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground h-9 px-3" },
  ToggleGroup: { tag: "div", classes: "flex items-center justify-center gap-1" },
  Toaster: { tag: "div", classes: "" },
  Sonner: { tag: "div", classes: "" },
  ResizablePanel: { tag: "div", classes: "flex-1" },
  ResizablePanelGroup: { tag: "div", classes: "flex h-full w-full" },
  ResizableHandle: { tag: "div", classes: "relative flex w-px items-center justify-center bg-border" },
}

// ── Step 1: Strip React Boilerplate ──────────────────────────────────

function stripBoilerplate(code: string): string {
  let cleaned = code

  // Remove "use client" / "use server" directives
  cleaned = cleaned.replace(/^["']use (?:client|server)["'];?\s*\n?/gm, "")

  // Remove import statements (multiline)
  cleaned = cleaned.replace(/import\s+(?:(?:\{[^}]*\}|[\w*]+(?:\s*,\s*\{[^}]*\})?)\s+from\s+)?["'][^"']*["'];?\s*\n?/g, "")

  // Remove TypeScript type/interface declarations
  cleaned = cleaned.replace(/(?:export\s+)?(?:type|interface)\s+\w+[\s\S]*?(?:\n\}|=\s*[^;]+;)\s*\n?/g, "")

  // Remove const type assertions and type annotations on standalone lines
  cleaned = cleaned.replace(/^type\s+\w+\s*=\s*[^;]+;\s*\n?/gm, "")

  // Remove hook declarations: const [x, setX] = useState(...)
  cleaned = cleaned.replace(/const\s+\[[\w\s,]+\]\s*=\s*(?:React\.)?useState\s*(?:<[^>]*>)?\([^)]*\);?\s*\n?/g, "")

  // Remove useEffect blocks
  cleaned = cleaned.replace(/(?:React\.)?useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[[^\]]*\]\s*\);?\s*\n?/g, "")

  // Remove useCallback blocks
  cleaned = cleaned.replace(/const\s+\w+\s*=\s*(?:React\.)?useCallback\s*\([\s\S]*?\}\s*,\s*\[[^\]]*\]\s*\);?\s*\n?/g, "")

  // Remove useMemo blocks
  cleaned = cleaned.replace(/const\s+\w+\s*=\s*(?:React\.)?useMemo\s*\([\s\S]*?\}\s*,\s*\[[^\]]*\]\s*\);?\s*\n?/g, "")

  // Remove useRef declarations
  cleaned = cleaned.replace(/const\s+\w+\s*=\s*(?:React\.)?useRef\s*(?:<[^>]*>)?\([^)]*\);?\s*\n?/g, "")

  // Remove standalone const/let/var declarations (non-function, non-JSX)
  cleaned = cleaned.replace(/^(?:const|let|var)\s+\w+\s*(?::\s*\w+(?:<[^>]*>)?\s*)?=\s*(?:(?!=>)[^;{])+;\s*\n?/gm, "")

  // Unwrap: export default function Name(...) { return (...) }
  cleaned = cleaned.replace(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*(?::\s*[\w.<>[\]| ]+)?\s*\{/g, "")

  // Unwrap: function Name(...) { return (...) }
  cleaned = cleaned.replace(/function\s+\w+\s*\([^)]*\)\s*(?::\s*[\w.<>[\]| ]+)?\s*\{/g, "")

  // Unwrap: const Name = (...) => { return (...) } or (...) => (...)
  cleaned = cleaned.replace(/(?:export\s+(?:default\s+)?)?(?:const|let)\s+\w+\s*(?::\s*[\w.<>[\]| ]+)?\s*=\s*(?:\([^)]*\)|[\w]+)\s*(?::\s*[\w.<>[\]| ]+)?\s*=>\s*[\({]?\s*/g, "")

  // Remove return ( wrapper
  cleaned = cleaned.replace(/return\s*\(\s*/g, "")

  // Remove trailing ); } at end
  cleaned = cleaned.replace(/\)\s*;?\s*\}\s*;?\s*$/g, "")

  // Remove React Fragment wrappers
  cleaned = cleaned.replace(/^\s*<>\s*\n?/, "")
  cleaned = cleaned.replace(/\s*<\/>\s*$/, "")
  cleaned = cleaned.replace(/^\s*<React\.Fragment>\s*\n?/, "")
  cleaned = cleaned.replace(/\s*<\/React\.Fragment>\s*$/, "")

  return cleaned.trim()
}

// ── Step 2: Resolve Dynamic className Builders ───────────────────────

function resolveClassNameBuilders(code: string): string {
  // Match className={cn(...)} or className={clsx(...)} or className={twMerge(...)}
  // Also match className={`template ${expr}`} template literals
  return code.replace(
    /className=\{(?:cn|clsx|twMerge|twJoin|cva)\(([\s\S]*?)\)\}/g,
    (_match, inner: string) => {
      const classes = extractStringLiterals(inner)
      return `className="${classes.join(" ").trim()}"`
    }
  ).replace(
    // Handle template literal classNames: className={`base ${conditional}`}
    /className=\{`([^`]*)`\}/g,
    (_match, template: string) => {
      // Extract literal parts, strip ${...} expressions
      const literal = template.replace(/\$\{[^}]*\}/g, "").replace(/\s+/g, " ").trim()
      return `className="${literal}"`
    }
  )
}

/**
 * Extract string literals from a cn/clsx argument list.
 * Takes truthy branches of ternaries, drops falsy conditions.
 */
function extractStringLiterals(input: string): string[] {
  const results: string[] = []

  // Match quoted strings (single or double)
  const stringRe = /["']([^"']+)["']/g
  let m: RegExpExecArray | null

  // Collect all string literals
  const allStrings: string[] = []
  while ((m = stringRe.exec(input)) !== null) {
    allStrings.push(m[1])
  }

  // For ternary expressions: take the truthy branch string (first one after ?)
  // Simple heuristic: just collect all string literals — they represent
  // the union of possible classes, which is the best we can do statically
  for (const s of allStrings) {
    if (s.trim()) results.push(s.trim())
  }

  return results
}

// ── Step 3: Map Shadcn/UI Components ─────────────────────────────────

function mapShadcnComponents(code: string, warnings: PreprocessWarning[], componentsMapped: string[]): string {
  let result = code

  // First handle Button with variant/size props specially
  result = result.replace(
    /<Button((?:\s+(?:[^>]|=\{[^}]*\}))*?)(\s*\/?\s*>)/g,
    (match, attrs: string, closing: string) => {
      const variantMatch = attrs.match(/variant=["'](\w+)["']/)
      const sizeMatch = attrs.match(/size=["'](\w+)["']/)
      const variant = variantMatch?.[1] || "default"
      const size = sizeMatch?.[1] || "default"

      const baseClasses = SHADCN_MAP.Button.classes
      const variantClasses = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.default
      const sizeClasses = BUTTON_SIZES[size] || BUTTON_SIZES.default

      // Remove variant and size attrs
      let cleanAttrs = attrs
        .replace(/\s*variant=["']\w+["']/g, "")
        .replace(/\s*size=["']\w+["']/g, "")
        .replace(/\s*asChild/g, "")

      // Merge with existing className if present
      const existingClassMatch = cleanAttrs.match(/className=["']([^"']*)["']/)
      const existingClasses = existingClassMatch?.[1] || ""
      cleanAttrs = cleanAttrs.replace(/\s*className=["'][^"']*["']/g, "")

      const allClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${existingClasses}`.replace(/\s+/g, " ").trim()

      if (!componentsMapped.includes("Button")) componentsMapped.push("Button")
      return `<button className="${allClasses}"${cleanAttrs}${closing}`
    }
  )
  result = result.replace(/<\/Button>/g, "</button>")

  // Now handle all other shadcn components
  for (const [name, mapping] of Object.entries(SHADCN_MAP)) {
    if (name === "Button") continue // Already handled above

    // Self-closing: <Component ... />
    const selfCloseRe = new RegExp(`<${name}((?:\\s+(?:[^>]|=\\{[^}]*\\}))*?)\\s*/>`, "g")
    result = result.replace(selfCloseRe, (_match, attrs: string) => {
      let cleanAttrs = stripComponentProps(attrs, name)
      const merged = mergeWithExistingClasses(cleanAttrs, mapping.classes)
      cleanAttrs = merged.attrs
      const allClasses = merged.classes

      if (!componentsMapped.includes(name)) componentsMapped.push(name)
      if (allClasses) {
        return `<${mapping.tag} className="${allClasses}"${cleanAttrs} />`
      }
      return `<${mapping.tag}${cleanAttrs} />`
    })

    // Opening tag: <Component ...>
    const openRe = new RegExp(`<${name}((?:\\s+(?:[^>]|=\\{[^}]*\\}))*?)>`, "g")
    result = result.replace(openRe, (_match, attrs: string) => {
      let cleanAttrs = stripComponentProps(attrs, name)
      const merged = mergeWithExistingClasses(cleanAttrs, mapping.classes)
      cleanAttrs = merged.attrs
      const allClasses = merged.classes

      if (!componentsMapped.includes(name)) componentsMapped.push(name)
      if (allClasses) {
        return `<${mapping.tag} className="${allClasses}"${cleanAttrs}>`
      }
      return `<${mapping.tag}${cleanAttrs}>`
    })

    // Closing tag: </Component>
    const closeRe = new RegExp(`</${name}>`, "g")
    result = result.replace(closeRe, `</${mapping.tag}>`)
  }

  // Handle unknown PascalCase components (not in our map, not HTML elements)
  result = result.replace(
    /<([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)((?:\s+(?:[^>]|=\{[^}]*\}))*?)\s*\/>/g,
    (_match, name: string, attrs: string) => {
      // Skip motion.* components — the parser handles those natively
      if (name.startsWith("motion.")) return _match
      warnings.push({
        type: "unknown-component",
        message: `Unknown component <${name} /> mapped to <div>`,
        original: name,
      })
      return `<div data-original-component="${name}"${attrs} />`
    }
  )

  result = result.replace(
    /<([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)((?:\s+(?:[^>]|=\{[^}]*\}))*?)>/g,
    (_match, name: string, attrs: string) => {
      if (name.startsWith("motion.")) return _match
      warnings.push({
        type: "unknown-component",
        message: `Unknown component <${name}> mapped to <div>`,
        original: name,
      })
      return `<div data-original-component="${name}"${attrs}>`
    }
  )

  result = result.replace(
    /<\/([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)>/g,
    (_match, name: string) => {
      if (name.startsWith("motion.")) return _match
      return `</div>`
    }
  )

  return result
}

/** Strip component-specific props that don't map to HTML attributes */
function stripComponentProps(attrs: string, componentName: string): string {
  let cleaned = attrs
    // Remove asChild prop
    .replace(/\s*asChild/g, "")
    // Remove variant prop
    .replace(/\s*variant=["'][^"']*["']/g, "")
    .replace(/\s*variant=\{[^}]*\}/g, "")
    // Remove size prop (except on standard HTML)
    .replace(/\s*size=["'][^"']*["']/g, "")
    .replace(/\s*size=\{[^}]*\}/g, "")
    // Remove orientation prop
    .replace(/\s*orientation=["'][^"']*["']/g, "")
    // Remove decorative prop
    .replace(/\s*decorative/g, "")
    // Remove align/side/sideOffset props (popover/tooltip)
    .replace(/\s*(?:align|side|sideOffset|alignOffset|collisionPadding)=["'][^"']*["']/g, "")
    .replace(/\s*(?:align|side|sideOffset|alignOffset|collisionPadding)=\{[^}]*\}/g, "")
    // Remove loop, value, onValueChange etc. (shadcn control props)
    .replace(/\s*(?:loop|defaultValue|value|onValueChange|onSelect|modal|open|onOpenChange|defaultOpen|checked|onCheckedChange|disabled|required)=\{[^}]*\}/g, "")
    .replace(/\s*(?:loop|defaultValue|value|onValueChange|onSelect|modal|open|onOpenChange|defaultOpen|checked|onCheckedChange)=["'][^"']*["']/g, "")
    // Remove forceMount
    .replace(/\s*forceMount/g, "")

  return cleaned
}

/** Merge component mapping classes with any existing className on the element */
function mergeWithExistingClasses(attrs: string, mappingClasses: string): { attrs: string; classes: string } {
  const existingMatch = attrs.match(/className=["']([^"']*)["']/)
  const existingClasses = existingMatch?.[1] || ""
  const cleanedAttrs = attrs.replace(/\s*className=["'][^"']*["']/g, "")

  const allClasses = mappingClasses && existingClasses
    ? `${mappingClasses} ${existingClasses}`
    : mappingClasses || existingClasses

  return { attrs: cleanedAttrs, classes: allClasses.replace(/\s+/g, " ").trim() }
}

// ── Step 4: Convert Next.js Components ───────────────────────────────

function convertNextjsComponents(code: string): string {
  let result = code

  // <Image ... /> → <img ... />
  // Keep src, alt, className. Convert width/height to attrs. Drop Next.js-specific props.
  result = result.replace(
    /<Image((?:\s+(?:[^>]|=\{[^}]*\}))*?)\s*\/?>/g,
    (_match, attrs: string) => {
      let cleanAttrs = attrs
        // Remove Next.js specific props
        .replace(/\s*(?:fill|priority|loading|quality|placeholder|blurDataURL|unoptimized|sizes|loader)=\{[^}]*\}/g, "")
        .replace(/\s*(?:fill|priority|loading|quality|placeholder|blurDataURL|unoptimized|sizes)=["'][^"']*["']/g, "")
        .replace(/\s*(?:fill|priority|unoptimized)\b(?!=)/g, "")
      return `<img${cleanAttrs} />`
    }
  )

  // <Link href="..." ...>...</Link> → <a href="..." ...>...</a>
  result = result.replace(/<Link\b/g, "<a")
  result = result.replace(/<\/Link>/g, "</a>")
  // Remove Link-specific props from the <a> tags
  result = result.replace(
    /<a((?:\s+(?:[^>]|=\{[^}]*\}))*?)>/g,
    (_match, attrs: string) => {
      let cleanAttrs = attrs
        .replace(/\s*(?:prefetch|scroll|replace|shallow|passHref|legacyBehavior)=\{[^}]*\}/g, "")
        .replace(/\s*(?:prefetch|scroll|replace|shallow|passHref|legacyBehavior)=["'][^"']*["']/g, "")
        .replace(/\s*(?:prefetch|passHref|legacyBehavior)\b(?!=)/g, "")
      return `<a${cleanAttrs}>`
    }
  )

  return result
}

// ── Step 5: Strip Event Handlers ─────────────────────────────────────

function stripEventHandlers(code: string, warnings: PreprocessWarning[], handlersStripped: string[]): string {
  const handlerRe = /\s*(on[A-Z]\w*)=\{[^}]*\}/g

  return code.replace(handlerRe, (_match, handlerName: string) => {
    const dataAttr = `data-had-${handlerName.toLowerCase()}`
    if (!handlersStripped.includes(handlerName)) {
      handlersStripped.push(handlerName)
      warnings.push({
        type: "stripped-handler",
        message: `Event handler ${handlerName} stripped, marked with ${dataAttr}`,
        original: handlerName,
      })
    }
    return ` ${dataAttr}="true"`
  })
}

// ── Step 6: Flatten JSX Expressions in Attributes ────────────────────

function flattenJSXExpressions(code: string, warnings: PreprocessWarning[], bindingsFlattened: string[]): string {
  let result = code

  // Handle style={{...}} → strip, add data-had-inline-style
  result = result.replace(
    /\s*style=\{\{[^}]*\}\}/g,
    () => {
      warnings.push({
        type: "inline-style-stripped",
        message: "Inline style object stripped",
      })
      return ` data-had-inline-style="true"`
    }
  )

  // Handle src={expression} → src="/placeholder.svg" data-binding-src="expression"
  result = result.replace(
    /\bsrc=\{([^}]+)\}/g,
    (_match, expr: string) => {
      const binding = expr.trim()
      if (!bindingsFlattened.includes(`src:${binding}`)) {
        bindingsFlattened.push(`src:${binding}`)
        warnings.push({
          type: "binding-flattened",
          message: `Dynamic src binding flattened: ${binding}`,
          original: binding,
        })
      }
      return `src="/placeholder.svg" data-binding-src="${escapeAttr(binding)}"`
    }
  )

  // Handle href={expression} → href="#" data-binding-href="expression"
  result = result.replace(
    /\bhref=\{([^}]+)\}/g,
    (_match, expr: string) => {
      const binding = expr.trim()
      if (!bindingsFlattened.includes(`href:${binding}`)) {
        bindingsFlattened.push(`href:${binding}`)
        warnings.push({
          type: "binding-flattened",
          message: `Dynamic href binding flattened: ${binding}`,
          original: binding,
        })
      }
      return `href="#" data-binding-href="${escapeAttr(binding)}"`
    }
  )

  // Handle alt={expression} → alt="Image" data-binding-alt="expression"
  result = result.replace(
    /\balt=\{([^}]+)\}/g,
    (_match, expr: string) => {
      const binding = expr.trim()
      if (!bindingsFlattened.includes(`alt:${binding}`)) {
        bindingsFlattened.push(`alt:${binding}`)
      }
      return `alt="Image" data-binding-alt="${escapeAttr(binding)}"`
    }
  )

  // Handle other expression attributes: key={...}, id={...}, etc.
  // But NOT className (handled separately) and NOT data- attributes
  result = result.replace(
    /\b((?!className|data-|on[A-Z])[a-zA-Z]+)=\{([^}]+)\}/g,
    (_match, attrName: string, expr: string) => {
      // Skip if this is a known safe string-value attribute already handled
      if (["src", "href", "alt"].includes(attrName)) return _match

      const binding = expr.trim()
      // If it's a simple string/number literal, keep it
      if (/^["'].*["']$/.test(binding) || /^\d+$/.test(binding)) {
        return `${attrName}=${binding}`
      }

      if (!bindingsFlattened.includes(`${attrName}:${binding}`)) {
        bindingsFlattened.push(`${attrName}:${binding}`)
      }
      return `data-binding-${attrName}="${escapeAttr(binding)}"`
    }
  )

  return result
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// ── Step 7: Handle Conditional Rendering ─────────────────────────────

function handleConditionalRendering(code: string, warnings: PreprocessWarning[]): string {
  let result = code

  // Handle {condition && <JSX>} → keep <JSX>, strip condition
  // Match: { expression && <tag or (  — capture the JSX part
  result = result.replace(
    /\{[^{}]*?&&\s*(\([^)]*\)|<[\s\S]*?(?:\/>|<\/\w+>))\s*\}/g,
    (_match, jsx: string) => {
      warnings.push({
        type: "conditional-render",
        message: "Conditional render (&&) unwrapped — always showing element",
      })
      // Unwrap parens if present
      let unwrapped = jsx.trim()
      if (unwrapped.startsWith("(") && unwrapped.endsWith(")")) {
        unwrapped = unwrapped.slice(1, -1).trim()
      }
      return unwrapped
    }
  )

  // Handle {condition ? <A> : <B>} → keep truthy branch <A>
  // Simplified: match ternary with JSX on both branches
  result = result.replace(
    /\{[^{}]*?\?\s*(\([^)]*\)|<[\s\S]*?(?:\/>|<\/\w+>))\s*:\s*(?:\([^)]*\)|<[\s\S]*?(?:\/>|<\/\w+>)|null|undefined|"")\s*\}/g,
    (_match, truthyBranch: string) => {
      warnings.push({
        type: "conditional-render",
        message: "Ternary render unwrapped — keeping truthy branch",
      })
      let unwrapped = truthyBranch.trim()
      if (unwrapped.startsWith("(") && unwrapped.endsWith(")")) {
        unwrapped = unwrapped.slice(1, -1).trim()
      }
      return unwrapped
    }
  )

  // Remove .map() calls that produce JSX — keep placeholder
  result = result.replace(
    /\{[\w.]+\.map\s*\(\s*(?:\([^)]*\)|[\w]+)\s*=>\s*(?:\([\s\S]*?\)|<[\s\S]*?(?:\/>|<\/\w+>))\s*\)\s*\}/g,
    (_match) => {
      warnings.push({
        type: "conditional-render",
        message: "Array .map() rendering stripped — static content preserved",
      })
      // Try to extract the JSX template from the map body
      const jsxMatch = _match.match(/=>\s*(?:\(\s*)?([\s\S]*?)(?:\s*\))?\s*\)\s*\}$/)
      if (jsxMatch) {
        let template = jsxMatch[1].trim()
        // Remove key prop
        template = template.replace(/\s*key=\{[^}]*\}/g, "")
        return template
      }
      return "<!-- map rendering removed -->"
    }
  )

  // Clean up remaining JSX expression wrappers containing just text
  // {" "} → space, {"text"} → text
  result = result.replace(/\{"([^"]*)"\}/g, "$1")
  result = result.replace(/\{'([^']*)'\}/g, "$1")

  return result
}

// ── Main Pipeline ────────────────────────────────────────────────────

export function preprocessForImport(code: string): PreprocessResult {
  const warnings: PreprocessWarning[] = []
  const componentsMapped: string[] = []
  const handlersStripped: string[] = []
  const bindingsFlattened: string[] = []

  // Step 1: Strip React boilerplate
  let processed = stripBoilerplate(code)

  // Step 2: Resolve className builders (cn, clsx, twMerge)
  processed = resolveClassNameBuilders(processed)

  // Step 3: Map shadcn/ui components to HTML + Tailwind
  processed = mapShadcnComponents(processed, warnings, componentsMapped)

  // Step 4: Convert Next.js components (Image → img, Link → a)
  processed = convertNextjsComponents(processed)

  // Step 5: Strip event handlers
  processed = stripEventHandlers(processed, warnings, handlersStripped)

  // Step 6: Flatten JSX expressions in attributes
  processed = flattenJSXExpressions(processed, warnings, bindingsFlattened)

  // Step 7: Handle conditional rendering
  processed = handleConditionalRendering(processed, warnings)

  return {
    code: processed,
    warnings,
    componentsMapped,
    handlersStripped,
    bindingsFlattened,
  }
}

// ── Post-Import Validation ───────────────────────────────────────────

export function validateImport(blocks: Block[], preprocessResult: PreprocessResult): ImportValidation {
  const warnings: string[] = []
  let quality = 100

  let blockCount = 0
  let unlabeledDivs = 0

  function walk(block: Block) {
    blockCount++

    // Count unlabeled divs (no label, no meaningful className, tag is div)
    if (block.tag === "div" && !block.label && (!block.className || block.className.trim() === "")) {
      unlabeledDivs++
    }

    // Check for data-binding-* attrs (lost bindings)
    if (block.attrs) {
      for (const key of Object.keys(block.attrs)) {
        if (key.startsWith("data-binding-")) {
          const attrName = key.replace("data-binding-", "")
          warnings.push(`Dynamic binding lost for "${attrName}": ${block.attrs[key]}`)
          quality -= 3
        }
        if (key.startsWith("data-had-on") || key.startsWith("data-had-On")) {
          warnings.push(`Event handler stripped: ${key.replace("data-had-", "")}`)
          quality -= 2
        }
        if (key === "data-original-component") {
          warnings.push(`Unknown component "${block.attrs[key]}" mapped to div`)
          quality -= 5
        }
      }
    }

    if (block.children) {
      for (const child of block.children) {
        walk(child)
      }
    }
  }

  for (const block of blocks) {
    walk(block)
  }

  // Deduct for unlabeled divs (max -15)
  const divPenalty = Math.min(unlabeledDivs, 15)
  quality -= divPenalty
  if (unlabeledDivs > 0) {
    warnings.push(`${unlabeledDivs} unlabeled div element(s) — consider adding labels`)
  }

  // Add preprocessing warnings
  for (const w of preprocessResult.warnings) {
    warnings.push(w.message)
  }

  // Clamp quality to 0-100
  quality = Math.max(0, Math.min(100, quality))

  return { blockCount, warnings, quality }
}
