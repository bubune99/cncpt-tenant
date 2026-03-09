"use client"

import { motion } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function FloatIdle({ children, config, className, style }: MotionWrapperProps) {
  const amplitude = (config.amplitude as number) ?? 10
  const rotation = (config.rotation as number) ?? 3
  const speed = (config.speed as number) ?? 3

  return (
    <motion.div
      className={className}
      style={style}
      animate={{
        y: [0, -amplitude, 0],
        rotate: [0, rotation, 0, -rotation, 0],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

registerMotionWrapper({
  key: "floatIdle",
  label: "Float",
  category: "autonomous",
  component: FloatIdle,
  defaultConfig: { amplitude: 10, rotation: 3, speed: 3 },
  editorFields: [
    { key: "amplitude", label: "Amplitude (px)", type: "slider", min: 3, max: 30, step: 1, defaultValue: 10 },
    { key: "rotation", label: "Rotation (deg)", type: "slider", min: 0, max: 10, step: 0.5, defaultValue: 3 },
    { key: "speed", label: "Duration (s)", type: "slider", min: 1, max: 8, step: 0.5, defaultValue: 3 },
  ],
})
