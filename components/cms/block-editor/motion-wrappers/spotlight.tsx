"use client"

import { useRef, useEffect } from "react"
import { useMotionValue } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function Spotlight({ children, config, className, style }: MotionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const maskX = useMotionValue(50)
  const maskY = useMotionValue(50)

  const size = (config.size as number) ?? 300
  const dimOpacity = (config.opacity as number) ?? 0.15

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    maskX.set(xPct)
    maskY.set(yPct)
  }

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const unsubX = maskX.on("change", (v) => el.style.setProperty("--mx", `${v}%`))
    const unsubY = maskY.on("change", (v) => el.style.setProperty("--my", `${v}%`))
    return () => { unsubX(); unsubY() }
  }, [maskX, maskY])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {children}
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          background: `rgba(0,0,0,${1 - dimOpacity})`,
          maskImage: `radial-gradient(circle ${size}px at var(--mx, 50%) var(--my, 50%), transparent 30%, black 100%)`,
          WebkitMaskImage: `radial-gradient(circle ${size}px at var(--mx, 50%) var(--my, 50%), transparent 30%, black 100%)`,
        }}
      />
    </div>
  )
}

registerMotionWrapper({
  key: "spotlight",
  label: "Spotlight",
  category: "cursor",
  component: Spotlight,
  defaultConfig: { size: 300, opacity: 0.15 },
  editorFields: [
    { key: "size", label: "Beam Size (px)", type: "slider", min: 100, max: 600, step: 25, defaultValue: 300 },
    { key: "opacity", label: "Visible Area Opacity", type: "slider", min: 0.05, max: 0.5, step: 0.05, defaultValue: 0.15 },
  ],
})
