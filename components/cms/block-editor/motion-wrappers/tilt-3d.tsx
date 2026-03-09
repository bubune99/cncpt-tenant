"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function Tilt3D({ children, config, className, style }: MotionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const maxTilt = (config.maxTilt as number) ?? 15
  const perspective = (config.perspective as number) ?? 1000
  const hoverScale = (config.scale as number) ?? 1.02

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]), { stiffness: 200, damping: 20 })
  const scale = useSpring(1, { stiffness: 200, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
    scale.set(hoverScale)
  }

  const handleMouseLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
    scale.set(1)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective, rotateX, rotateY, scale, transformStyle: "preserve-3d", ...style }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

registerMotionWrapper({
  key: "tilt3d",
  label: "3D Tilt",
  category: "cursor",
  component: Tilt3D,
  defaultConfig: { maxTilt: 15, perspective: 1000, scale: 1.02 },
  editorFields: [
    { key: "maxTilt", label: "Max Tilt", type: "slider", min: 5, max: 30, step: 1, defaultValue: 15 },
    { key: "perspective", label: "Perspective", type: "slider", min: 400, max: 2000, step: 100, defaultValue: 1000 },
    { key: "scale", label: "Hover Scale", type: "slider", min: 1, max: 1.1, step: 0.01, defaultValue: 1.02 },
  ],
})
