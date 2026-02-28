"use client"

import { useState, useCallback, useEffect } from "react"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/cms/ui/popover"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import { Label } from "@/components/cms/ui/label"
import { Pipette, X } from "lucide-react"
import { cn } from "@/lib/cms/utils"

// Tailwind color to hex mappings for common colors
const TAILWIND_COLORS: Record<string, string> = {
  "white": "#ffffff",
  "black": "#000000",
  "transparent": "transparent",
  "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0", "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8", "slate-500": "#64748b", "slate-600": "#475569", "slate-700": "#334155",
  "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
  "gray-50": "#f9fafb", "gray-100": "#f3f4f6", "gray-200": "#e5e7eb", "gray-300": "#d1d5db",
  "gray-400": "#9ca3af", "gray-500": "#6b7280", "gray-600": "#4b5563", "gray-700": "#374151",
  "gray-800": "#1f2937", "gray-900": "#111827", "gray-950": "#030712",
  "red-500": "#ef4444", "red-600": "#dc2626", "red-700": "#b91c1c",
  "orange-500": "#f97316", "orange-600": "#ea580c",
  "amber-500": "#f59e0b", "amber-600": "#d97706",
  "yellow-500": "#eab308", "yellow-600": "#ca8a04",
  "lime-500": "#84cc16", "lime-600": "#65a30d",
  "green-500": "#22c55e", "green-600": "#16a34a",
  "emerald-500": "#10b981", "emerald-600": "#059669",
  "teal-500": "#14b8a6", "teal-600": "#0d9488",
  "cyan-500": "#06b6d4", "cyan-600": "#0891b2",
  "sky-500": "#0ea5e9", "sky-600": "#0284c7",
  "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8",
  "indigo-500": "#6366f1", "indigo-600": "#4f46e5",
  "violet-500": "#8b5cf6", "violet-600": "#7c3aed",
  "purple-500": "#a855f7", "purple-600": "#9333ea",
  "fuchsia-500": "#d946ef", "fuchsia-600": "#c026d3",
  "pink-500": "#ec4899", "pink-600": "#db2777",
  "rose-500": "#f43f5e", "rose-600": "#e11d48",
}

// Reverse lookup: hex to Tailwind class
const HEX_TO_TAILWIND = Object.entries(TAILWIND_COLORS).reduce((acc, [name, hex]) => {
  if (hex !== "transparent") acc[hex.toLowerCase()] = name
  return acc
}, {} as Record<string, string>)

// Quick access swatches
const PRESET_COLORS = [
  "#ffffff", "#f8fafc", "#e2e8f0", "#94a3b8", "#475569", "#1e293b", "#0f172a", "#020617",
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
]

// Recently used colors (stored in component state for now)
const MAX_RECENT = 8

interface ColorPickerProps {
  value: string // Current Tailwind class like "bg-blue-600" or "bg-[#ff0000]"
  onChange: (value: string) => void
  prefix?: "bg" | "text" | "border" | "from" | "via" | "to"
  label?: string
  allowTransparent?: boolean
  allowGradient?: boolean
}

/**
 * Extract the color value from a Tailwind class
 */
function extractColorFromClass(cls: string, prefix: string): string | null {
  // Handle arbitrary values: bg-[#ff0000] or bg-[rgba(0,0,0,0.5)]
  const arbitraryMatch = cls.match(new RegExp(`^${prefix}-\\[(.+)\\]$`))
  if (arbitraryMatch) return arbitraryMatch[1]
  
  // Handle standard Tailwind colors: bg-blue-600
  const colorMatch = cls.match(new RegExp(`^${prefix}-(.+)$`))
  if (colorMatch) {
    const colorName = colorMatch[1]
    if (colorName === "transparent") return "transparent"
    if (colorName === "white") return "#ffffff"
    if (colorName === "black") return "#000000"
    return TAILWIND_COLORS[colorName] || null
  }
  
  return null
}

/**
 * Convert a hex color to a Tailwind class
 */
function hexToTailwindClass(hex: string, prefix: string): string {
  if (!hex) return ""
  if (hex === "transparent") return `${prefix}-transparent`
  
  const normalized = hex.toLowerCase()
  const tailwindName = HEX_TO_TAILWIND[normalized]
  
  if (tailwindName) {
    return `${prefix}-${tailwindName}`
  }
  
  // Use arbitrary value for custom colors
  return `${prefix}-[${hex}]`
}

export function ColorPicker({
  value,
  onChange,
  prefix = "bg",
  label,
  allowTransparent = true,
}: ColorPickerProps) {
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  
  // Extract current color from the class
  const currentHex = extractColorFromClass(value, prefix) || "#000000"
  const displayColor = currentHex === "transparent" ? "transparent" : currentHex
  
  const handleColorChange = useCallback((hex: string) => {
    const newClass = hexToTailwindClass(hex, prefix)
    onChange(newClass)
    
    // Add to recent colors
    if (hex && hex !== "transparent") {
      setRecentColors(prev => {
        const filtered = prev.filter(c => c !== hex)
        return [hex, ...filtered].slice(0, MAX_RECENT)
      })
    }
  }, [onChange, prefix])
  
  const handlePresetClick = useCallback((hex: string) => {
    handleColorChange(hex)
  }, [handleColorChange])
  
  // Eyedropper API (Chromium only)
  const handleEyedropper = useCallback(async () => {
    if (!("EyeDropper" in window)) return
    
    try {
      // @ts-expect-error EyeDropper is not in TS types yet
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      handleColorChange(result.sRGBHex)
    } catch {
      // User cancelled or error
    }
  }, [handleColorChange])
  
  const hasEyedropper = typeof window !== "undefined" && "EyeDropper" in window
  
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 justify-start gap-2 px-3 font-normal"
          >
            <div
              className={cn(
                "h-5 w-5 rounded border border-border",
                displayColor === "transparent" && "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')]"
              )}
              style={{ backgroundColor: displayColor === "transparent" ? undefined : displayColor }}
            />
            <span className="text-xs font-mono truncate max-w-[120px]">
              {value || "None"}
            </span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-64 p-3" align="start">
          <div className="flex flex-col gap-3">
            {/* Color picker */}
            <HexColorPicker
              color={displayColor === "transparent" ? "#ffffff" : displayColor}
              onChange={handleColorChange}
              style={{ width: "100%", height: "140px" }}
            />
            
            {/* Hex input + eyedropper */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1 rounded-md border border-border bg-input px-2">
                <span className="text-xs text-muted-foreground">#</span>
                <HexColorInput
                  color={displayColor === "transparent" ? "" : displayColor}
                  onChange={handleColorChange}
                  prefixed={false}
                  className="h-8 flex-1 bg-transparent text-xs font-mono text-foreground outline-none"
                />
              </div>
              {hasEyedropper && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEyedropper}
                  className="h-8 w-8 p-0"
                  title="Pick color from screen"
                >
                  <Pipette size={14} />
                </Button>
              )}
            </div>
            
            {/* Transparent option */}
            {allowTransparent && (
              <Button
                variant={displayColor === "transparent" ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleColorChange("transparent")}
                className="h-7 text-xs"
              >
                Transparent
              </Button>
            )}
            
            {/* Preset swatches */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Presets
              </span>
              <div className="grid grid-cols-8 gap-1">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => handlePresetClick(hex)}
                    className={cn(
                      "h-5 w-5 rounded border border-border transition-transform hover:scale-110",
                      displayColor === hex && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
            
            {/* Recent colors */}
            {recentColors.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent
                </span>
                <div className="flex gap-1 flex-wrap">
                  {recentColors.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => handlePresetClick(hex)}
                      className={cn(
                        "h-5 w-5 rounded border border-border transition-transform hover:scale-110",
                        displayColor === hex && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Clear button */}
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <X size={12} className="mr-1" /> Remove Color
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Simpler inline color swatch button for use in Quick Styles
 */
export function ColorSwatchButton({
  color,
  isSelected,
  onClick,
  label,
}: {
  color: string
  isSelected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-6 w-6 rounded border transition-transform hover:scale-110",
        isSelected ? "ring-2 ring-primary ring-offset-1 border-primary" : "border-border"
      )}
      style={{ backgroundColor: color }}
      title={label}
    />
  )
}
