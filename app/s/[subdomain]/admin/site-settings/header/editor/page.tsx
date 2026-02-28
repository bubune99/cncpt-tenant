"use client"

import { PageBuilder } from "@/components/cms/block-editor/page-builder"
import { siteHeaderAdapter } from "@/lib/cms/block-editor/content-adapters"
import { useMemo } from "react"

export default function HeaderBlockEditorPage() {
  const adapter = useMemo(() => siteHeaderAdapter(), [])

  return (
    <PageBuilder
      adapter={adapter}
      editorLabel="Global Header"
      hidePageMeta
    />
  )
}
