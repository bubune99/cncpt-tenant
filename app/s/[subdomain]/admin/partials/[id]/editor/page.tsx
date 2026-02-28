"use client"

import { useParams } from "next/navigation"
import { PageBuilder } from "@/components/cms/block-editor/page-builder"
import { partialAdapter } from "@/lib/cms/block-editor/content-adapters"
import { useMemo } from "react"

export default function PartialEditorPage() {
  const params = useParams<{ id: string }>()
  const adapter = useMemo(() => partialAdapter(params.id), [params.id])

  return (
    <PageBuilder
      adapter={adapter}
      editorLabel="Partial Template"
      hidePageMeta
    />
  )
}
