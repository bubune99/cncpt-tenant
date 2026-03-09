/**
 * V0/React Import Preprocessing Pipeline
 *
 * Transforms v0.dev/React code into parser-friendly JSX BEFORE the AST parser runs.
 * This is purely string-based — it transforms JSX source code, not Block objects.
 *
 * Pipeline:
 *   1. Resolve dynamic className builders (cn, clsx, twMerge)
 *   1b. Strip overlay/popout content (Sheet, Dialog, etc.)
 *   1c. Normalize Lucide icons → <span data-icon="..." />
 *   2. Map shadcn/ui components to HTML + Tailwind
 *   3. Convert Next.js components (Image → img, Link → a)
 *   4. Strip event handlers, preserve as data attrs
 *
 * NOTE: Boilerplate stripping, JSX expression flattening, and conditional rendering
 * are handled by the AST parser (ast-parser.ts) — NOT here.
 */

import type { Block } from "./types"

// ── Types ────────────────────────────────────────────────────────────

export interface PreprocessWarning {
  type: "unknown-component" | "stripped-handler"
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

  // Framer Motion wrappers — transparent (strip tags, keep children)
  AnimatePresence: { tag: "div", classes: "" },

  // forwardRef type params that leak as component names
  HTMLButtonElement: { tag: "button", classes: "" },
  HTMLDivElement: { tag: "div", classes: "" },
  HTMLHeadingElement: { tag: "h2", classes: "" },
  HTMLParagraphElement: { tag: "p", classes: "" },
  HTMLInputElement: { tag: "input", classes: "" },
  HTMLAnchorElement: { tag: "a", classes: "" },
  HTMLFormElement: { tag: "form", classes: "" },
  HTMLSpanElement: { tag: "span", classes: "" },
  HTMLImageElement: { tag: "img", classes: "" },
  HTMLLIElement: { tag: "li", classes: "" },
  HTMLUListElement: { tag: "ul", classes: "" },
  HTMLOListElement: { tag: "ol", classes: "" },
  HTMLTableElement: { tag: "table", classes: "" },
  HTMLSelectElement: { tag: "select", classes: "" },
  HTMLTextAreaElement: { tag: "textarea", classes: "" },
}

// ── Step 1: Resolve Dynamic className Builders ───────────────────────

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

// ── Step 1c: Normalize Lucide Icons ──────────────────────────────────
//
// Lucide icon components (<ShoppingBag />, <Star className="h-4 w-4" />, etc.)
// are unknown custom tags that render as nothing. Convert them to
// <span data-icon="IconName" ... aria-hidden="true" /> so the block renderer
// can display an icon placeholder.

const LUCIDE_ICONS = new Set([
  "ShoppingBag", "ShoppingCart", "Printer", "Star", "Heart", "ArrowRight",
  "ArrowLeft", "ChevronRight", "ChevronDown", "ChevronUp", "ChevronLeft",
  "Plus", "Minus", "X", "Check", "Search", "Menu", "Home", "Settings",
  "User", "Users", "Mail", "Phone", "MapPin", "Calendar", "Clock", "Camera",
  "Image", "Video", "Music", "File", "Folder", "Download", "Upload", "Share",
  "Share2", "ExternalLink", "Link", "Copy", "Trash", "Trash2", "Edit", "Edit2",
  "Eye", "EyeOff", "Lock", "Unlock", "Key", "Shield", "AlertTriangle",
  "AlertCircle", "Info", "HelpCircle", "CheckCircle", "XCircle", "Gift",
  "Sparkles", "Zap", "Flame", "Sun", "Moon", "Cloud", "Package", "Award",
  "Trophy", "Target", "Flag", "Bookmark", "Tag", "Hash", "AtSign", "Globe",
  "Wifi", "Bluetooth", "Battery", "Monitor", "Smartphone", "Tablet", "Laptop",
  "Server", "Database", "Code", "Terminal", "GitBranch", "Github", "Twitter",
  "Facebook", "Instagram", "Linkedin", "Youtube", "Paintbrush", "Palette",
  "Scissors", "Layers", "Grid", "Layout", "Sidebar", "PanelLeft", "Move",
  "GripVertical", "MoreHorizontal", "MoreVertical", "Filter", "SortAsc",
  "SortDesc", "RefreshCw", "RotateCcw", "Play", "Pause", "SkipForward",
  "SkipBack", "Volume", "VolumeX", "Mic", "MicOff", "Headphones", "Bell",
  "BellOff", "MessageSquare", "MessageCircle", "Send", "Inbox", "Archive",
  "Save", "FileText", "Clipboard", "List", "ListOrdered", "Table", "BarChart",
  "PieChart", "LineChart", "Activity", "TrendingUp", "TrendingDown",
  "DollarSign", "CreditCard", "Wallet", "Receipt", "Store", "Truck",
  "Navigation", "Compass", "Map", "Building", "Warehouse", "Factory", "Wrench",
  "Tool", "Hammer", "Lightbulb", "Rocket", "Plane", "Car", "Train", "Bus",
  "Bike", "Footprints", "PartyPopper", "Ticket", "Crown",
  // Additional common ones
  "ArrowUp", "ArrowDown", "RotateCw", "Maximize", "Minimize", "LogIn",
  "LogOut", "Power", "Loader", "Loader2", "AlertOctagon", "ThumbsUp",
  "ThumbsDown", "StarHalf", "CircleDot", "Circle", "Square", "Triangle",
  "Hexagon", "Pen", "PenTool", "Type", "Bold", "Italic", "Underline",
  "AlignLeft", "AlignCenter", "AlignRight", "AlignJustify", "Indent",
  "Outdent", "WrapText", "Crop", "ZoomIn", "ZoomOut", "Aperture",
])

function normalizeLucideIcons(code: string, componentsMapped: string[]): string {
  let result = code

  // Build a regex alternation from icon names for efficient matching
  // We process self-closing and open/close tags separately

  // Self-closing: <IconName /> or <IconName className="..." />
  result = result.replace(
    /<([A-Z][A-Za-z0-9]*)((?:\s+(?:[^>]|=\{[^}]*\}))*?)\s*\/>/g,
    (_match, name: string, attrs: string) => {
      if (!LUCIDE_ICONS.has(name)) return _match

      if (!componentsMapped.includes(name)) componentsMapped.push(name)

      // Inject data-icon and aria-hidden, preserve existing attrs
      const hasAriaHidden = /aria-hidden/.test(attrs)
      const ariaAttr = hasAriaHidden ? "" : ' aria-hidden="true"'
      return `<span data-icon="${name}"${attrs}${ariaAttr} />`
    }
  )

  // Opening tag: <IconName className="...">
  result = result.replace(
    /<([A-Z][A-Za-z0-9]*)((?:\s+(?:[^>]|=\{[^}]*\}))*?)>/g,
    (_match, name: string, attrs: string) => {
      if (!LUCIDE_ICONS.has(name)) return _match

      if (!componentsMapped.includes(name)) componentsMapped.push(name)

      const hasAriaHidden = /aria-hidden/.test(attrs)
      const ariaAttr = hasAriaHidden ? "" : ' aria-hidden="true"'
      return `<span data-icon="${name}"${attrs}${ariaAttr}>`
    }
  )

  // Closing tag: </IconName> → </span>
  result = result.replace(
    /<\/([A-Z][A-Za-z0-9]*)>/g,
    (_match, name: string) => {
      if (!LUCIDE_ICONS.has(name)) return _match
      return "</span>"
    }
  )

  return result
}

// ── Step 2: Map Shadcn/UI Components ─────────────────────────────────

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

  // Handle remaining icon-like components not caught by Lucide normalization (step 1c).
  // Self-closing PascalCase tags with icon sizing classes → span[data-icon]
  result = result.replace(
    /<([A-Z][A-Za-z0-9]*)((?:\s+(?:[^>]|=\{[^}]*\}))*?)\s*\/>/g,
    (_match, name: string, attrs: string) => {
      // Skip if already handled by SHADCN_MAP or Lucide normalization
      if (SHADCN_MAP[name]) return _match
      if (LUCIDE_ICONS.has(name)) return _match  // Already handled in step 1c
      if (name.startsWith("motion")) return _match
      // Check if this looks like an icon (has size classes like h-4 w-4, or no attrs at all)
      const isLikelyIcon = /className=["'][^"']*(?:h-\d|w-\d|size-\d)/.test(attrs) || !attrs.trim()
      if (isLikelyIcon && /^[A-Z][a-z]/.test(name)) {
        if (!componentsMapped.includes(name)) componentsMapped.push(name)
        return `<span data-icon="${name}"${attrs} aria-hidden="true" />`
      }
      return _match
    }
  )

  // Unknown PascalCase components are now preserved as-is.
  // The parser accepts any tag — custom components get tag=ComponentName
  // and componentName=ComponentName automatically.
  // We just log them for informational purposes.
  const unknownComponentRe = /<([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)[\s/>]/g
  let ucMatch
  const seen = new Set<string>()
  while ((ucMatch = unknownComponentRe.exec(result)) !== null) {
    const name = ucMatch[1]
    if (name.startsWith("motion.")) continue
    if (SHADCN_MAP[name]) continue
    if (seen.has(name)) continue
    seen.add(name)
    warnings.push({
      type: "unknown-component",
      message: `Custom component <${name}> preserved as-is`,
      original: name,
    })
  }

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

// ── Step 1b: Extract Overlay/Popout Content as Interactions ───────────
//
// State-dependent overlay components (Sheet, Dialog, Popover, DropdownMenu, etc.)
// can't render as static HTML — they need JS state to toggle open/close.
//
// Instead of stripping them entirely, we EXTRACT the overlay content and store it
// as a data-interaction attribute on the trigger element. The parser then stores
// this as block.interaction, and the renderer/SDK can hydrate it at runtime.
//
// Pattern:
//   <Sheet>
//     <SheetTrigger asChild><button>Open</button></SheetTrigger>
//     <SheetContent side="left"><nav>...</nav></SheetContent>
//   </Sheet>
//
// Becomes:
//   <button data-interaction-type="sheet" data-interaction-side="left"
//           data-interaction-content="<nav>...</nav>">Open</button>

/** Map overlay wrapper tag → interaction type */
const OVERLAY_TYPE_MAP: Record<string, string> = {
  Sheet: "sheet",
  Dialog: "dialog",
  AlertDialog: "alert-dialog",
  Popover: "popover",
  DropdownMenu: "dropdown",
  Tooltip: "tooltip",
  HoverCard: "tooltip",
  Collapsible: "collapsible",
  Command: "dialog",
}

/** Content tags for each overlay type — the part that appears when triggered */
const OVERLAY_CONTENT_TAG_MAP: Record<string, string> = {
  Sheet: "SheetContent",
  Dialog: "DialogContent",
  AlertDialog: "AlertDialogContent",
  Popover: "PopoverContent",
  DropdownMenu: "DropdownMenuContent",
  Tooltip: "TooltipContent",
  HoverCard: "HoverCardContent",
  Collapsible: "CollapsibleContent",
  Command: "CommandList",
}

/** Tags inside overlay content that provide metadata (title, description) */
const OVERLAY_META_TAGS: Record<string, string> = {
  SheetTitle: "title",
  SheetDescription: "description",
  DialogTitle: "title",
  DialogDescription: "description",
  AlertDialogTitle: "title",
  AlertDialogDescription: "description",
}

/** All overlay-related tags that should be stripped/transformed */
const ALL_OVERLAY_TAGS = new Set([
  "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription",
  "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription", "DialogFooter",
  "PopoverContent",
  "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator",
  "TooltipContent",
  "HoverCardContent",
  "AlertDialogContent",
  "CollapsibleContent",
  "CommandList", "CommandInput", "CommandGroup", "CommandItem",
  "Sheet", "Dialog", "AlertDialog", "Popover", "DropdownMenu",
  "Tooltip", "HoverCard", "Collapsible", "Command",
])

/**
 * Extract content between a matched tag pair, handling nesting.
 * Returns { inner, endIndex } or null if no match.
 * Matches the exact tag name (won't confuse Sheet with SheetContent).
 */
function extractTagContent(code: string, tagName: string, startFrom: number): { inner: string; endIndex: number } | null {
  // Match opening tag: <TagName> or <TagName attr="...">
  // Must be followed by whitespace or > (not more word chars, to avoid Sheet matching SheetContent)
  const openRe = new RegExp(`<${tagName}(?=\\s|>)((?:\\s+[^>]*)?)>`)
  const openMatch = openRe.exec(code.slice(startFrom))
  if (!openMatch) return null

  const openStart = startFrom + openMatch.index
  const afterOpen = openStart + openMatch[0].length
  const closeTag = `</${tagName}>`

  // Simple character scan to find matching close tag
  let depth = 1
  let pos = afterOpen
  while (pos < code.length && depth > 0) {
    const nextClose = code.indexOf(closeTag, pos)
    if (nextClose === -1) break // malformed

    // Count any opening tags between pos and nextClose
    const openScanRe = new RegExp(`<${tagName}(?=\\s|>)`, "g")
    const segment = code.slice(pos, nextClose)
    let openInSegment
    while ((openInSegment = openScanRe.exec(segment)) !== null) {
      // Check if it's self-closing by scanning ahead
      const afterName = pos + openInSegment.index + tagName.length + 1
      const restOfTag = code.slice(afterName, code.indexOf(">", afterName) + 1)
      if (!restOfTag.endsWith("/>")) {
        depth++ // Real opening tag, not self-closing
      }
    }

    depth-- // For the close tag we found
    if (depth === 0) {
      return {
        inner: code.slice(afterOpen, nextClose),
        endIndex: nextClose + closeTag.length,
      }
    }
    pos = nextClose + closeTag.length
  }
  return null
}

/**
 * Extract attributes from an opening tag string.
 */
function extractTagAttrs(code: string, tagName: string, startFrom: number): Record<string, string> {
  const re = new RegExp(`<${tagName}((?:\\s+[^>]*)?)>`)
  const match = re.exec(code.slice(startFrom))
  if (!match) return {}

  const attrStr = match[1] || ""
  const attrs: Record<string, string> = {}
  const attrRe = /(\w+)=["']([^"']*?)["']/g
  let m
  while ((m = attrRe.exec(attrStr)) !== null) {
    attrs[m[1]] = m[2]
  }
  return attrs
}

/**
 * Extract overlay content and convert to interaction data attributes on the trigger.
 * This preserves ALL content — trigger children become the visible block,
 * overlay content becomes data-interaction-content for runtime hydration.
 */
function extractOverlayContent(code: string, warnings: PreprocessWarning[]): string {
  let result = code
  let foundOverlays = false

  for (const [wrapperTag, interactionType] of Object.entries(OVERLAY_TYPE_MAP)) {
    const contentTag = OVERLAY_CONTENT_TAG_MAP[wrapperTag]
    const triggerTag = `${wrapperTag}Trigger`

    // Process each wrapper occurrence
    let safetyCount = 0
    // Check for exact tag match (not SheetContent when looking for Sheet)
    const wrapperCheckRe = new RegExp(`<${wrapperTag}[\\s>]`)
    while (wrapperCheckRe.test(result) && safetyCount < 50) {
      safetyCount++

      const wrapperContent = extractTagContent(result, wrapperTag, 0)
      if (!wrapperContent) break

      foundOverlays = true
      const inner = wrapperContent.inner

      // Extract trigger content
      let triggerJSX = ""
      const triggerContent = extractTagContent(inner, triggerTag, 0)
      if (triggerContent) {
        triggerJSX = triggerContent.inner.trim()
      }

      // Extract overlay content (what appears when triggered)
      let overlayJSX = ""
      const overlayContent = extractTagContent(inner, contentTag, 0)
      if (overlayContent) {
        overlayJSX = overlayContent.inner.trim()
      }

      // Extract metadata (title, description) from inside the overlay
      let overlayTitle = ""
      let overlayDescription = ""
      for (const [metaTag, metaType] of Object.entries(OVERLAY_META_TAGS)) {
        if (!overlayJSX.includes(`<${metaTag}`)) continue
        const metaContent = extractTagContent(overlayJSX, metaTag, 0)
        if (metaContent) {
          if (metaType === "title") overlayTitle = metaContent.inner.trim()
          if (metaType === "description") overlayDescription = metaContent.inner.trim()
        }
      }

      // Extract config attrs from the content tag (e.g., side="left")
      const contentAttrs = extractTagAttrs(inner, contentTag, 0)
      const side = contentAttrs.side || ""

      // Build interaction data attributes for the trigger
      const interactionAttrs: string[] = [
        `data-interaction-type="${interactionType}"`,
      ]
      if (side) interactionAttrs.push(`data-interaction-side="${side}"`)
      if (overlayTitle) interactionAttrs.push(`data-interaction-title="${overlayTitle}"`)
      if (overlayDescription) interactionAttrs.push(`data-interaction-description="${overlayDescription}"`)

      // Store the overlay content as an escaped data attribute
      // The parser will deserialize this into block.interaction.content
      if (overlayJSX) {
        // Clean overlay content: strip metadata wrappers (SheetHeader, DialogHeader, etc.)
        let cleanedOverlay = overlayJSX
        // Remove header/footer wrappers but keep their content
        for (const stripTag of ["SheetHeader", "DialogHeader", "DialogFooter", "SheetDescription", "DialogDescription", "SheetTitle", "DialogTitle"]) {
          cleanedOverlay = cleanedOverlay.replace(
            new RegExp(`<${stripTag}(?:\\s+[^>]*)?>([\\s\\S]*?)</${stripTag}>`, "g"),
            "$1"
          )
          cleanedOverlay = cleanedOverlay.replace(
            new RegExp(`<${stripTag}(?:\\s+[^>]*)?\\s*/>`, "g"),
            ""
          )
        }
        cleanedOverlay = cleanedOverlay.trim()

        if (cleanedOverlay) {
          // Escape for use as attribute value (double-encode quotes)
          const escaped = cleanedOverlay
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
          interactionAttrs.push(`data-interaction-content="${escaped}"`)
        }
      }

      // Build the replacement: inject interaction attrs into the trigger's root element
      let replacement: string
      if (triggerJSX) {
        // Inject interaction attrs into the first element of the trigger content
        const firstTagRe = /^(\s*<\w+)/
        const injected = triggerJSX.replace(firstTagRe, `$1 ${interactionAttrs.join(" ")}`)
        replacement = injected !== triggerJSX ? injected : triggerJSX
      } else {
        // No trigger — create a placeholder div with interaction data
        replacement = `<div ${interactionAttrs.join(" ")} />`
      }

      // Replace the entire wrapper with the annotated trigger
      const wrapperStart = result.indexOf(`<${wrapperTag}`)
      result = result.slice(0, wrapperStart) + replacement + result.slice(wrapperContent.endIndex)
    }
  }

  if (foundOverlays) {
    warnings.push({
      type: "stripped-handler",
      message: `Extracted overlay content as interaction data (preserves Sheet, Dialog, Dropdown, etc. for runtime hydration)`,
    })
  }

  return result
}

// ── Step 3: Convert Next.js Components ───────────────────────────────

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

// ── Step 4: Strip Event Handlers ─────────────────────────────────────

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

// ── Main Pipeline ────────────────────────────────────────────────────

export function preprocessForImport(code: string): PreprocessResult {
  const warnings: PreprocessWarning[] = []
  const componentsMapped: string[] = []
  const handlersStripped: string[] = []
  const bindingsFlattened: string[] = []

  let processed = code

  // Step 1: Resolve className builders (cn, clsx, twMerge)
  processed = resolveClassNameBuilders(processed)

  // Step 1b: Extract overlay content as interaction data (Sheet, Dialog, etc.)
  // Must run BEFORE shadcn mapping so we can match original component names
  processed = extractOverlayContent(processed, warnings)

  // Step 1c: Normalize Lucide icons → <span data-icon="..." />
  // Must run BEFORE shadcn mapping so icons aren't caught by the generic
  // unknown-component handler
  processed = normalizeLucideIcons(processed, componentsMapped)

  // Step 2: Map shadcn/ui components to HTML + Tailwind
  processed = mapShadcnComponents(processed, warnings, componentsMapped)

  // Step 3: Convert Next.js components (Image → img, Link → a)
  processed = convertNextjsComponents(processed)

  // Step 4: Strip event handlers
  processed = stripEventHandlers(processed, warnings, handlersStripped)

  // Step 5: Strip React-internal props (key, ref) from JSX before parsing
  processed = stripReactInternalProps(processed)

  return {
    code: processed,
    warnings,
    componentsMapped,
    handlersStripped,
    bindingsFlattened,
  }
}

// ── Step 5: Strip React-Internal Props ────────────────────────────────

function stripReactInternalProps(code: string): string {
  return code
    // key="..." or key='...'
    .replace(/\s+key=["'][^"']*["']/g, "")
    // key={...}
    .replace(/\s+key=\{[^}]*\}/g, "")
    // ref={...}
    .replace(/\s+ref=\{[^}]*\}/g, "")
    // suppressHydrationWarning, suppressContentEditableWarning (bare or with value)
    .replace(/\s+suppress(?:Hydration|ContentEditable)Warning(?:=\{[^}]*\})?/g, "")
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
        // data-original-component no longer used — custom tags preserved natively
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
