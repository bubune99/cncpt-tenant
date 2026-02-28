"use client"

import { PageBuilder } from "@/components/cms/block-editor/page-builder"
import { siteFooterAdapter } from "@/lib/cms/block-editor/content-adapters"
import { useMemo } from "react"

export default function FooterBlockEditorPage() {
  const adapter = useMemo(() => siteFooterAdapter(), [])

  return (
    <PageBuilder
      adapter={adapter}
      editorLabel="Global Footer"
      hidePageMeta
    />
  )
}
