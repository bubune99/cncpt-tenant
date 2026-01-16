"use client"

import dynamic from "next/dynamic"
import "@measured/puck/puck.css"
import { puckConfig, initialData } from "@/lib/puck-config"
import { useState, useEffect } from "react"

const Puck = dynamic(() => import("@measured/puck").then((mod) => mod.Puck), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading editor...</p>
    </div>
  ),
})

export default function EditorPage() {
  const [data, setData] = useState(initialData)

  // Load saved data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("puck-demo-data")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData(parsed)
      } catch (e) {
        console.error("Failed to parse saved data:", e)
      }
    }
  }, [])

  const handlePublish = (newData: typeof data) => {
    localStorage.setItem("puck-demo-data", JSON.stringify(newData))
    alert("Page saved! View it on the preview page.")
  }

  return (
    <div style={{ height: "100vh", width: "100%", overflow: "hidden" }}>
      <Puck config={puckConfig} data={data} onPublish={handlePublish} />
    </div>
  )
}
