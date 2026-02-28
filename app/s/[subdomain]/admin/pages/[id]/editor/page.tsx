"use client";

import { use } from "react";
import { PageBuilder } from "@/components/cms/block-editor/page-builder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BlockEditorPage({ params }: PageProps) {
  const { id } = use(params);

  return <PageBuilder pageId={id} />;
}
