"use client";

import { useParams } from "next/navigation";
import { PageBuilder } from "@/components/cms/block-editor/page-builder";

export default function BlockEditorPage() {
  const { id } = useParams<{ id: string }>();

  return <PageBuilder pageId={id} />;
}
