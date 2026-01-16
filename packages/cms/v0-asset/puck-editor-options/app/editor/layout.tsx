import type React from "react"
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>{children}</div>
}
