"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring, motion } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function CountUp({ children, config, className, style }: MotionWrapperProps) {
  const duration = (config.duration as number) ?? 2
  const prefix = (config.prefix as string) ?? ""
  const suffix = (config.suffix as string) ?? ""

  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  // Extract number from children
  const targetNumber = extractNumber(children)

  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })

  useEffect(() => {
    if (isInView && targetNumber !== null) {
      motionValue.set(targetNumber)
    }
  }, [isInView, targetNumber, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (v) => {
      if (ref.current) {
        const formatted = targetNumber !== null && targetNumber % 1 !== 0
          ? v.toFixed(1)
          : Math.round(v).toLocaleString()
        ref.current.textContent = `${prefix}${formatted}${suffix}`
      }
    })
    return unsubscribe
  }, [springValue, prefix, suffix, targetNumber])

  return (
    <motion.span
      ref={ref}
      className={className}
      style={style}
    >
      {prefix}0{suffix}
    </motion.span>
  )
}

function extractNumber(children: React.ReactNode): number | null {
  if (typeof children === "number") return children
  if (typeof children === "string") {
    const n = parseFloat(children.replace(/[^0-9.-]/g, ""))
    return isNaN(n) ? null : n
  }
  // Try to extract from child element
  if (children && typeof children === "object" && "props" in (children as unknown as object)) {
    const props = (children as unknown as { props?: { children?: React.ReactNode; textContent?: string } }).props
    if (typeof props?.children === "string") return extractNumber(props.children)
    if (typeof props?.textContent === "string") return extractNumber(props.textContent)
  }
  return null
}

registerMotionWrapper({
  key: "countUp",
  label: "Count Up",
  category: "text",
  component: CountUp,
  defaultConfig: { duration: 2, prefix: "", suffix: "" },
  editorFields: [
    { key: "duration", label: "Duration (s)", type: "slider", min: 0.5, max: 5, step: 0.5, defaultValue: 2 },
    { key: "prefix", label: "Prefix", type: "number", defaultValue: "" },
    { key: "suffix", label: "Suffix", type: "number", defaultValue: "" },
  ],
})
