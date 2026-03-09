"use client"

import { useRef, useEffect } from "react"
import { useScroll, useTransform } from "framer-motion"
import { registerMotionWrapper, type MotionWrapperProps } from "@/lib/cms/block-editor/motion-wrappers/registry"

const PATHS: Record<string, string> = {
  wave: "M 0 50 Q 25 0 50 50 Q 75 100 100 50",
  arc: "M 0 80 Q 50 0 100 80",
  circle: "M 50 10 A 40 40 0 1 1 49.99 10",
}

function TextPath({ children, config, className, style }: MotionWrapperProps) {
  const pathType = (config.path as string) ?? "wave"
  const letterSpacing = (config.letterSpacing as number) ?? 4

  const containerRef = useRef<HTMLDivElement>(null)
  const textPathRef = useRef<SVGTextPathElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const startOffset = useTransform(scrollYProgress, [0, 1], [0, 100])

  useEffect(() => {
    const el = textPathRef.current
    if (!el) return
    const unsub = startOffset.on("change", (v) => {
      el.setAttribute("startOffset", `${v}%`)
    })
    return unsub
  }, [startOffset])

  const text = extractText(children) || "Text Path Animation"
  const d = PATHS[pathType] || PATHS.wave

  return (
    <div ref={containerRef} className={className} style={style}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <path id="motionPath" d={d} fill="none" />
        </defs>
        <text style={{ letterSpacing, fontSize: 8, fill: "currentColor" }}>
          <textPath
            ref={textPathRef}
            href="#motionPath"
            startOffset="0%"
          >
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}

function extractText(children: React.ReactNode): string | null {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  if (children && typeof children === "object" && "props" in (children as unknown as object)) {
    const props = (children as unknown as { props?: { children?: React.ReactNode; textContent?: string } }).props
    if (typeof props?.children === "string") return props.children
    if (typeof props?.textContent === "string") return props.textContent
  }
  return null
}

registerMotionWrapper({
  key: "textPath",
  label: "Text Path",
  category: "text",
  component: TextPath,
  defaultConfig: { path: "wave", letterSpacing: 4 },
  editorFields: [
    { key: "path", label: "Path Shape", type: "select", options: [
      { label: "Wave", value: "wave" },
      { label: "Arc", value: "arc" },
      { label: "Circle", value: "circle" },
    ], defaultValue: "wave" },
    { key: "letterSpacing", label: "Letter Spacing", type: "slider", min: 0, max: 12, step: 1, defaultValue: 4 },
  ],
})
