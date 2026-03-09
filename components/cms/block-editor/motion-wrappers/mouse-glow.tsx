"use client"

import { useRef } from "react"
import { motion, useMotionValue } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function MouseGlow({ children, config, className, style }: MotionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)

  const color = (config.color as string) ?? "#8b5cf6"
  const size = (config.size as number) ?? 200
  const opacity = (config.opacity as number) ?? 0.4

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    x.set(-200)
    y.set(-200)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      <motion.div
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          opacity,
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

registerMotionWrapper({
  key: "mouseGlow",
  label: "Mouse Glow",
  category: "cursor",
  component: MouseGlow,
  defaultConfig: { color: "#8b5cf6", size: 200, opacity: 0.4 },
  editorFields: [
    { key: "color", label: "Glow Color", type: "color", defaultValue: "#8b5cf6" },
    { key: "size", label: "Size (px)", type: "slider", min: 100, max: 500, step: 25, defaultValue: 200 },
    { key: "opacity", label: "Opacity", type: "slider", min: 0.1, max: 1, step: 0.05, defaultValue: 0.4 },
  ],
})
