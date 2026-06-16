'use client'

/**
 * Applies completed block-editor tool outputs to the live canvas — a faithful,
 * self-contained mirror of the apply logic in ai-chat-panel.tsx, so the new
 * chat panel drives the editor identically without modifying the working one.
 *
 * Deduped by toolCallId; auto-saves once the stream goes idle.
 */

import { useCallback, useEffect, useRef } from 'react'
import { isToolUIPart, type UIMessage } from 'ai'
import type { Block } from '@/lib/cms/block-editor/types'
import { isContainerTag } from '@/lib/cms/block-editor/types'
import { generateId, rehydrateParentIds } from '@/lib/cms/block-editor/tree-utils'
import type { useEditor } from '@/lib/cms/block-editor/editor-context'

type Editor = ReturnType<typeof useEditor>

const BUILDING_TOOLS = new Set([
  'setPageBlocks', 'addBlock', 'updateBlock', 'removeBlock', 'moveBlock',
  'generateImage', 'importAndAnalyze', 'repairBlock',
])

const toolNameFromPartType = (partType: string): string => partType.replace(/^tool-/, '')

function applyToolOutput(ed: Editor, toolName: string, output: Record<string, unknown>) {
  switch (toolName) {
    case 'setPageBlocks': {
      const raw = output.blocks
      if (Array.isArray(raw) && raw.length > 0) {
        const ensureIds = (blocks: Block[]): Block[] =>
          blocks.map((b) => ({ ...b, id: b.id || generateId(), children: b.children ? ensureIds(b.children) : undefined }))
        ed.setBlocks(rehydrateParentIds(ensureIds(raw as Block[])))
      }
      break
    }
    case 'addBlock': {
      const rawBlock = output.block as Record<string, unknown> | undefined
      if (!rawBlock) break
      const tag = (rawBlock.tag as Block['tag']) || 'div'
      const newBlock: Block = {
        id: (rawBlock.id as string) || generateId(),
        tag,
        className: (rawBlock.className as string) || '',
        textContent: (rawBlock.textContent as string) || undefined,
        attrs: rawBlock.attrs as Record<string, string> | undefined,
        children: isContainerTag(tag) ? [] : undefined,
        parentId: null,
        animation: rawBlock.animation as Block['animation'] | undefined,
      }
      if (Array.isArray(rawBlock.children) && rawBlock.children.length > 0) {
        newBlock.children = rehydrateParentIds(rawBlock.children as Block[], newBlock.id)
      }
      ed.addBlockRaw(newBlock, (output.parentId as string) ?? null, (output.index as number) ?? undefined)
      break
    }
    case 'updateBlock': {
      const blockId = output.blockId as string
      if (!blockId) break
      const updates: Partial<Block> = {}
      if (output.className != null) updates.className = output.className as string
      if (output.textContent != null) updates.textContent = output.textContent as string
      if (output.attrs != null) updates.attrs = output.attrs as Record<string, string>
      if (output.tag != null) updates.tag = output.tag as Block['tag']
      if (output.animation != null) updates.animation = output.animation as Block['animation']
      ed.updateBlock(blockId, updates)
      break
    }
    case 'removeBlock': {
      const blockId = output.blockId as string
      if (blockId) ed.removeBlock(blockId)
      break
    }
    case 'moveBlock': {
      const blockId = output.blockId as string
      if (blockId) ed.moveBlock(blockId, (output.targetParentId as string) ?? null, (output.targetIndex as number) ?? 0)
      break
    }
    case 'generateImage': {
      if (output._action === 'error' || output.error) break
      const rawImgBlock = output.block as Record<string, unknown> | undefined
      if (!rawImgBlock) break
      const imgBlock: Block = {
        id: (rawImgBlock.id as string) || generateId(),
        tag: (rawImgBlock.tag as Block['tag']) || 'img',
        className: (rawImgBlock.className as string) || 'w-full h-auto object-cover',
        attrs: rawImgBlock.attrs as Record<string, string> | undefined,
        children: undefined,
        parentId: null,
      }
      ed.addBlockRaw(imgBlock, (output.parentId as string) ?? null, (output.index as number) ?? undefined)
      break
    }
    case 'importAndAnalyze': {
      if (!output.success) break
      if (output._action === 'setPageBlocks' && Array.isArray(output.blocks)) {
        const ensureIds = (blocks: Block[]): Block[] =>
          blocks.map((b) => ({ ...b, id: b.id || generateId(), children: b.children ? ensureIds(b.children) : undefined }))
        ed.setBlocks(rehydrateParentIds(ensureIds(output.blocks as Block[])))
      }
      break
    }
    case 'repairBlock': {
      const action = output._action as string
      if (action === 'removeBlock') {
        const blockId = output.blockId as string
        if (blockId) ed.removeBlock(blockId)
      } else if (action === 'updateBlock') {
        const blockId = output.blockId as string
        if (!blockId) break
        const updates: Partial<Block> = {}
        if (output.className != null) updates.className = output.className as string
        if (output.textContent != null) updates.textContent = output.textContent as string
        if (output.tag != null) updates.tag = output.tag as Block['tag']
        if (output.commerce != null) updates.commerce = output.commerce as Block['commerce']
        if (output.componentName != null) updates.componentName = output.componentName as string
        if (output.partialId != null) updates.partialId = output.partialId as string
        ed.updateBlock(blockId, updates)
      }
      break
    }
    default:
      break
  }
}

export function useApplyToolOutputs(messages: UIMessage[], status: string, editor: Editor) {
  const editorRef = useRef(editor)
  editorRef.current = editor
  const appliedRef = useRef<Set<string>>(new Set())
  const savePendingRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant' || !msg.parts) continue
      for (const part of msg.parts) {
        if (!isToolUIPart(part)) continue
        if (part.state !== 'output-available') continue
        if (appliedRef.current.has(part.toolCallId)) continue
        appliedRef.current.add(part.toolCallId)
        const toolName = toolNameFromPartType(part.type)
        if (BUILDING_TOOLS.has(toolName)) {
          const output = part.output ?? part.input
          if (output) {
            applyToolOutput(editorRef.current, toolName, output as Record<string, unknown>)
            savePendingRef.current = true
          }
        }
      }
    }
  }, [messages])

  const applyImprovementFix = useCallback((blockId: string, fix: Partial<Block>) => {
    if (!blockId) return
    editorRef.current.updateBlock(blockId, fix)
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !savePendingRef.current) return
    savePendingRef.current = false
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => { editorRef.current.saveCurrentPage() }, 500)
  }, [status])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  return { applyImprovementFix }
}
