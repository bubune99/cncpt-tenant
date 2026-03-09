"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function Marquee({ children, config, className, style }: MotionWrapperProps) {
  const speed = (config.speed as number) ?? 30
  const direction = (config.direction as string) ?? "left"
  const pauseOnHover = (config.pauseOnHover as boolean) ?? true
  const gap = (config.gap as number) ?? 16

  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const xTarget = direction === "left" ? "-50%" : "50%"

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflow: "hidden", ...style }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <motion.div
        style={{
          display: "flex",
          gap,
          width: "fit-content",
        }}
        animate={isPaused ? undefined : { x: [direction === "left" ? "0%" : "-50%", xTarget] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
        {/* Duplicate for seamless loop */}
        {children}
      </motion.div>
    </div>
  )
}

registerMotionWrapper({
  key: "marquee",
  label: "Marquee",
  category: "autonomous",
  component: Marquee,
  defaultConfig: { speed: 30, direction: "left", pauseOnHover: true, gap: 16 },
  editorFields: [
    { key: "speed", label: "Speed (s)", type: "slider", min: 5, max: 60, step: 5, defaultValue: 30 },
    { key: "direction", label: "Direction", type: "select", options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }], defaultValue: "left" },
    { key: "pauseOnHover", label: "Pause on Hover", type: "toggle", defaultValue: true },
    { key: "gap", label: "Gap (px)", type: "slider", min: 0, max: 64, step: 4, defaultValue: 16 },
  ],
})
