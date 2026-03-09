"use client"

import { motion } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

function TextReveal({ children, config, className, style, animation }: MotionWrapperProps) {
  const by = (config.by as string) ?? "word"
  const staggerDelay = (config.staggerDelay as number) ?? 0.05

  // Extract text from children — if it's a string child, split it
  const text = extractText(children)
  if (!text) {
    // Fallback: just wrap children with a simple inView animation
    return (
      <motion.div
        className={className}
        style={style}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    )
  }

  const units = by === "char" ? text.split("") : text.split(/\s+/)
  const separator = by === "char" ? "" : " "

  return (
    <motion.div
      className={className}
      style={{ ...style, display: "flex", flexWrap: "wrap" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {units.map((unit, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.4, delay: i * staggerDelay }}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {unit}{i < units.length - 1 ? separator : ""}
        </motion.span>
      ))}
    </motion.div>
  )
}

function extractText(children: React.ReactNode): string | null {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  // Try to extract from single child element's textContent
  if (children && typeof children === "object" && "props" in (children as unknown as object)) {
    const props = (children as unknown as { props?: { children?: React.ReactNode; textContent?: string } }).props
    if (typeof props?.children === "string") return props.children
    if (typeof props?.textContent === "string") return props.textContent
  }
  return null
}

registerMotionWrapper({
  key: "textReveal",
  label: "Text Reveal",
  category: "text",
  component: TextReveal,
  defaultConfig: { by: "word", staggerDelay: 0.05 },
  editorFields: [
    { key: "by", label: "Split By", type: "select", options: [{ label: "Word", value: "word" }, { label: "Character", value: "char" }], defaultValue: "word" },
    { key: "staggerDelay", label: "Stagger Delay (s)", type: "slider", min: 0.01, max: 0.2, step: 0.01, defaultValue: 0.05 },
  ],
})
