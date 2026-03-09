"use client"

import { useRef, Children } from "react"
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function ParallaxDepth({ children, config, className, style }: MotionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const intensity = (config.intensity as number) ?? 0.5

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const childArray = Children.toArray(children)

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ position: "relative", ...style }}
    >
      {childArray.map((child, i) => {
        const depth = ((i + 1) / childArray.length) * intensity * 40
        return (
          <ParallaxLayer key={i} mouseX={mouseX} mouseY={mouseY} depth={depth}>
            {child}
          </ParallaxLayer>
        )
      })}
    </div>
  )
}

function ParallaxLayer({ children, mouseX, mouseY, depth }: {
  children: React.ReactNode
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  depth: number
}) {
  const x = useSpring(useTransform(mouseX, [-0.5, 0.5], [-depth, depth]), { stiffness: 100, damping: 20 })
  const y = useSpring(useTransform(mouseY, [-0.5, 0.5], [-depth, depth]), { stiffness: 100, damping: 20 })

  return (
    <motion.div style={{ x, y }}>
      {children}
    </motion.div>
  )
}

registerMotionWrapper({
  key: "parallaxDepth",
  label: "Parallax Depth",
  category: "cursor",
  component: ParallaxDepth,
  defaultConfig: { intensity: 0.5 },
  editorFields: [
    { key: "intensity", label: "Intensity", type: "slider", min: 0.1, max: 1.5, step: 0.1, defaultValue: 0.5 },
  ],
})
