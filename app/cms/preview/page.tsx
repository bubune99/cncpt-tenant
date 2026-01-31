"use client"

import { Render } from "@puckeditor/core"
import "@puckeditor/core/puck.css"
import puckConfig from "@/puck/config"
import type { Data } from "@puckeditor/core"

const initialData: Data = {
  content: [],
  root: {
    props: {},
  },
}
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/cms/ui/button"

export default function PreviewPage() {
  const [data, setData] = useState(initialData)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("puck-demo-data")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData(parsed)
        setIsEmpty(parsed.content.length === 0)
      } catch (e) {
        console.error("Failed to parse saved data:", e)
      }
    }
  }, [])

  if (isEmpty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">No Content Yet</h1>
          <p className="text-muted-foreground">Head to the editor to create your first page!</p>
          <Button asChild>
            <Link href="/editor">Open Editor</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <Button asChild variant="outline" size="sm">
          <Link href="/editor">Edit Page</Link>
        </Button>
      </div>
      <Render config={puckConfig} data={data} />
    </div>
  )
}
