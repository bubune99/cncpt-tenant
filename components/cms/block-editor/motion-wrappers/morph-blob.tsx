"use client"

import { motion } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

const BLOB_KEYFRAMES = [
  "30% 70% 70% 30% / 30% 30% 70% 70%",
  "60% 40% 30% 70% / 60% 30% 70% 40%",
  "40% 60% 60% 40% / 50% 60% 40% 50%",
  "70% 30% 50% 50% / 40% 70% 30% 60%",
  "30% 70% 70% 30% / 30% 30% 70% 70%",
]

function MorphBlob({ children, config, className, style }: MotionWrapperProps) {
  const intensity = (config.intensity as number) ?? 0.3
  const speed = (config.speed as number) ?? 4

  // Scale keyframes by intensity (mix between circle and blob shapes)
  const keyframes = intensity >= 0.8 ? BLOB_KEYFRAMES : BLOB_KEYFRAMES.map((_, i) =>
    i === 0 || i === BLOB_KEYFRAMES.length - 1
      ? "50% 50% 50% 50% / 50% 50% 50% 50%"
      : BLOB_KEYFRAMES[i]
  )

  return (
    <motion.div
      className={className}
      style={{ overflow: "hidden", ...style }}
      animate={{ borderRadius: keyframes }}
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
  key: "morphBlob",
  label: "Morph Blob",
  category: "autonomous",
  component: MorphBlob,
  defaultConfig: { intensity: 0.3, speed: 4 },
  editorFields: [
    { key: "intensity", label: "Intensity", type: "slider", min: 0.1, max: 1, step: 0.1, defaultValue: 0.3 },
    { key: "speed", label: "Duration (s)", type: "slider", min: 2, max: 10, step: 0.5, defaultValue: 4 },
  ],
})
