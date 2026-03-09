"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function Magnetic({ children, config, className, style }: MotionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const strength = (config.strength as number) ?? 0.3
  const radius = (config.radius as number) ?? 200

  const x = useSpring(0, { stiffness: 150, damping: 15 })
  const y = useSpring(0, { stiffness: 150, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < radius) {
      x.set(dx * strength)
      y.set(dy * strength)
    }
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

registerMotionWrapper({
  key: "magnetic",
  label: "Magnetic",
  category: "cursor",
  component: Magnetic,
  defaultConfig: { strength: 0.3, radius: 200 },
  editorFields: [
    { key: "strength", label: "Strength", type: "slider", min: 0.1, max: 1, step: 0.05, defaultValue: 0.3 },
    { key: "radius", label: "Radius (px)", type: "slider", min: 50, max: 500, step: 25, defaultValue: 200 },
  ],
})
