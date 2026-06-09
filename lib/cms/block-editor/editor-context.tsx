"use client"

import {
  createContext,
  useContext,
  useCallback,
  useReducer,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import type { Block, BlockTag, DragState, PageLayout } from "./types"
import type { BlockSpotlight } from "./workflow-types"
import { isContainerTag } from "./types"
import { BLOCK_TEMPLATES } from "./block-templates"
import {
  generateId,
  findBlockById,
  findParentBlock,
  insertBlock,
  removeBlockById,
  updateBlockInTree,
  moveBlockInTree,
  duplicateBlockDeep,
  getBlockPath,
  rehydrateParentIds,
} from "./tree-utils"
import {
  type SavedPage,
  savePage as savePageToApi,
  getPage as getPageFromApi,
  getPagesList,
  deletePage as deletePageFromApi,
  createNewPage,
  getCurrentPageId,
  setCurrentPageId,
} from "./storage"
import { serializeBlocksToJSX, parseJSXToBlocks } from "./serialization"

function toPascalCase(str: string): string {
  return str
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}

/* ------------------------------------------------------------------ */
/*  Viewed File (for code panel file browsing)                         */
/* ------------------------------------------------------------------ */

export interface ViewedFile {
  path: string
  content: string
  title: string
  isReadOnly: boolean
  sourceType: "page" | "template" | "component" | "layout"
  sourceId: string
}

/* ------------------------------------------------------------------ */
/*  State + Reducer                                                    */
/* ------------------------------------------------------------------ */

interface EditorState {
  blocks: Block[]
  selectedBlockId: string | null
  hoveredBlockId: string | null
  dragState: DragState | null
  clipboard: Block | null
  history: Block[][]
  historyIndex: number
  // Page management
  currentPage: SavedPage | null
  hasUnsavedChanges: boolean
  saveStatus: "idle" | "saving" | "saved" | "error"
  lastSavedAt: string | null
  // Loading state
  isLoading: boolean
  // Code editor sync
  jsxSyncDirection: "visual" | "code" | null
  // Currently viewed file in code panel
  viewedFile: ViewedFile | null
  // AI spotlight state (Kofi)
  activeSpotlights: BlockSpotlight[]
}

type EditorAction =
  | { type: "SET_BLOCKS"; blocks: Block[] }
  | { type: "TRANSFORM_BLOCKS"; fn: (prev: Block[]) => Block[] }
  | { type: "SELECT_BLOCK"; id: string | null }
  | { type: "SET_HOVERED"; id: string | null }
  | { type: "SET_DRAG_STATE"; dragState: DragState | null }
  | { type: "SET_CLIPBOARD"; block: Block }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_ALL" }
  | { type: "SET_CURRENT_PAGE"; page: SavedPage | null }
  | { type: "SET_SAVE_STATUS"; status: EditorState["saveStatus"] }
  | { type: "MARK_SAVED"; timestamp: string; page: SavedPage }
  | { type: "LOAD_PAGE"; page: SavedPage }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_BLOCKS_FROM_JSX"; blocks: Block[] }
  | { type: "SET_SYNC_DIRECTION"; direction: EditorState["jsxSyncDirection"] }
  | { type: "SET_VIEWED_FILE"; file: ViewedFile | null }
  | { type: "SET_SPOTLIGHTS"; spotlights: BlockSpotlight[] }
  | { type: "CLEAR_SPOTLIGHTS" }

function pushHistory(state: EditorState, blocks: Block[]): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(blocks)
  if (newHistory.length > 50) newHistory.shift()
  return {
    ...state,
    blocks,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_BLOCKS":
      return { ...pushHistory(state, action.blocks), hasUnsavedChanges: true, jsxSyncDirection: "visual" }
    case "TRANSFORM_BLOCKS":
      return { ...pushHistory(state, action.fn(state.blocks)), hasUnsavedChanges: true, jsxSyncDirection: "visual" }
    case "SELECT_BLOCK":
      return { ...state, selectedBlockId: action.id }
    case "SET_HOVERED":
      return { ...state, hoveredBlockId: action.id }
    case "SET_DRAG_STATE":
      return { ...state, dragState: action.dragState }
    case "SET_CLIPBOARD":
      return { ...state, clipboard: action.block }
    case "UNDO": {
      if (state.historyIndex <= 0) return state
      const i = state.historyIndex - 1
      return { ...state, blocks: state.history[i], historyIndex: i, selectedBlockId: null, hasUnsavedChanges: true }
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state
      const i = state.historyIndex + 1
      return { ...state, blocks: state.history[i], historyIndex: i, selectedBlockId: null, hasUnsavedChanges: true }
    }
    case "CLEAR_ALL":
      return {
        ...state,
        blocks: [],
        selectedBlockId: null,
        hoveredBlockId: null,
        dragState: null,
        clipboard: null,
        history: [[]],
        historyIndex: 0,
        hasUnsavedChanges: true,
      }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.page }
    case "SET_SAVE_STATUS":
      return { ...state, saveStatus: action.status }
    case "MARK_SAVED":
      return {
        ...state,
        currentPage: action.page,
        hasUnsavedChanges: false,
        saveStatus: "saved",
        lastSavedAt: action.timestamp,
      }
    case "LOAD_PAGE":
      return {
        ...state,
        blocks: action.page.blocks,
        currentPage: action.page,
        selectedBlockId: null,
        hoveredBlockId: null,
        history: [action.page.blocks],
        historyIndex: 0,
        hasUnsavedChanges: false,
        saveStatus: "idle",
        lastSavedAt: action.page.updatedAt,
        isLoading: false,
        jsxSyncDirection: null,
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.loading }
    case "SET_BLOCKS_FROM_JSX": {
      const serializedOld = JSON.stringify(state.blocks)
      const serializedNew = JSON.stringify(action.blocks)
      if (serializedOld === serializedNew) {
        return { ...state, jsxSyncDirection: "code" }
      }
      return {
        ...pushHistory(state, action.blocks),
        hasUnsavedChanges: true,
        jsxSyncDirection: "code",
      }
    }
    case "SET_SYNC_DIRECTION":
      return { ...state, jsxSyncDirection: action.direction }
    case "SET_VIEWED_FILE":
      return { ...state, viewedFile: action.file }
    case "SET_SPOTLIGHTS":
      return { ...state, activeSpotlights: action.spotlights }
    case "CLEAR_SPOTLIGHTS":
      return { ...state, activeSpotlights: [] }
    default:
      return state
  }
}

/* ------------------------------------------------------------------ */
/*  Context shape                                                      */
/* ------------------------------------------------------------------ */

interface EditorContextValue {
  state: EditorState

  /** Add a block from a palette template label */
  addBlockFromTemplate: (label: string, parentId?: string | null, index?: number) => void
  /** Add a raw block (used by AI) */
  addBlockRaw: (block: Block, parentId?: string | null, index?: number) => void
  removeBlock: (id: string) => void
  /** Update any top-level fields on a block (className, textContent, attrs, tag) */
  updateBlock: (id: string, updates: Partial<Block>) => void
  duplicateBlock: (id: string) => void
  moveBlock: (blockId: string, targetParentId: string | null, targetIndex: number) => void
  selectBlock: (id: string | null) => void
  setHoveredBlock: (id: string | null) => void
  getSelectedBlock: () => Block | null
  getBlockById: (id: string) => Block | null
  getParentBlock: (id: string) => Block | null
  getBlockBreadcrumb: (id: string) => Block[]
  setDragState: (dragState: DragState | null) => void
  copyBlock: (id: string) => void
  pasteBlock: (parentId?: string | null, index?: number) => void
  /** Paste only the className from clipboard onto target block */
  pasteStyle: (targetId: string) => void
  /** Wrap a block in a new div container */
  wrapInContainer: (blockId: string) => void
  /** Unwrap a container, moving its children to its position */
  unwrapContainer: (blockId: string) => void
  setBlocks: (blocks: Block[]) => void
  clearAll: () => void
  undo: () => void
  redo: () => void

  // Page management
  /** Save current page (creates new if none exists) */
  saveCurrentPage: () => Promise<void>
  /** Load a page by ID */
  loadPage: (id: string) => Promise<void>
  /** Create a new blank page */
  newPage: (title?: string) => void
  /** Update page metadata (title, slug) */
  updatePageMeta: (updates: Partial<Pick<SavedPage, "title" | "slug">>) => void
  /** Publish the current page */
  publishPage: () => Promise<void>
  /** Unpublish the current page */
  unpublishPage: () => Promise<void>
  /** Delete a page by ID */
  deletePage: (id: string) => Promise<void>
  /** Get all saved pages */
  getPages: () => Promise<SavedPage[]>

  // Code editor integration
  /** Serialized JSX of current blocks (kept in sync with visual editor) */
  jsxSource: string
  /** Set blocks from JSX string (code -> visual sync) */
  setBlocksFromJSX: (jsx: string) => { success: boolean; errors: string[] }
  /** Get current JSX source on demand */
  getJSXSource: () => string
  /** Open a file in the code panel */
  openFile: (file: ViewedFile) => void
  /** Close the currently viewed file */
  closeFile: () => void

  // AI Spotlight (Kofi)
  /** Set active spotlights on the canvas */
  setSpotlights: (spotlights: BlockSpotlight[]) => void
  /** Clear all active spotlights */
  clearSpotlights: () => void
  /** Scroll to and highlight a specific block */
  scrollToBlock: (blockId: string) => void
}

export type { EditorContextValue }

const EditorContext = createContext<EditorContextValue | null>(null)

const initialState: EditorState = {
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  dragState: null,
  clipboard: null,
  history: [[]],
  historyIndex: 0,
  currentPage: null,
  hasUnsavedChanges: false,
  saveStatus: "idle",
  lastSavedAt: null,
  isLoading: false,
  jsxSyncDirection: null,
  viewedFile: null,
  activeSpotlights: [],
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  ContentAdapter (for non-page content: partials, site settings)     */
/* ------------------------------------------------------------------ */

export interface ContentAdapter {
  load(): Promise<{ blocks: Block[]; title: string; id?: string }>
  save(blocks: Block[], title: string): Promise<{ id: string }>
}

interface EditorProviderProps {
  children: ReactNode
  /** Page ID to load on mount (for editing existing pages) */
  pageId?: string
  /** Custom content adapter for non-page content (partials, headers, footers) */
  adapter?: ContentAdapter
  /** Initial blocks (for new pages with pre-populated content) */
  initialBlocks?: Block[]
  /** Editor mode */
  mode?: "web" | "email"
}

export function EditorProvider({ children, pageId, adapter, initialBlocks, mode = "web" }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    blocks: initialBlocks || [],
    history: [initialBlocks || []],
    isLoading: !!pageId,
  })
  const stateRef = useRef(state)
  stateRef.current = state

  /* ---- Block CRUD ---- */

  const addBlockFromTemplate = useCallback(
    (label: string, parentId?: string | null, index?: number) => {
      const template = BLOCK_TEMPLATES.find((t) => t.label === label)
      if (!template) return

      const newBlock: Block = {
        id: generateId(),
        tag: template.tag,
        className: template.defaultClassName,
        textContent: template.defaultTextContent,
        attrs: template.defaultAttrs ? { ...template.defaultAttrs } : undefined,
        children: template.isContainer ? [] : undefined,
        parentId: parentId ?? null,
        // Commerce blocks get their default commerce binding
        commerce: template.defaultCommerce ? { ...template.defaultCommerce } : undefined,
        componentName: template.componentName,
        frameworkRequirement: template.frameworkRequirement,
      }

      dispatch({ type: "TRANSFORM_BLOCKS", fn: (prev) => insertBlock(prev, newBlock, parentId ?? null, index) })
      dispatch({ type: "SELECT_BLOCK", id: newBlock.id })
    },
    []
  )

  const addBlockRaw = useCallback(
    (block: Block, parentId?: string | null, index?: number) => {
      dispatch({
        type: "TRANSFORM_BLOCKS",
        fn: (prev) => insertBlock(prev, { ...block, parentId: parentId ?? null }, parentId ?? null, index),
      })
      dispatch({ type: "SELECT_BLOCK", id: block.id })
    },
    []
  )

  const removeBlock = useCallback((id: string) => {
    dispatch({ type: "TRANSFORM_BLOCKS", fn: (prev) => removeBlockById(prev, id) })
    if (stateRef.current.selectedBlockId === id) {
      dispatch({ type: "SELECT_BLOCK", id: null })
    }
  }, [])

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    dispatch({
      type: "TRANSFORM_BLOCKS",
      fn: (prev) => updateBlockInTree(prev, id, updates),
    })
  }, [])

  const duplicateBlock = useCallback((id: string) => {
    const block = findBlockById(stateRef.current.blocks, id)
    if (!block) return
    const dup = duplicateBlockDeep(block)
    const parent = findParentBlock(stateRef.current.blocks, id)
    const siblings = parent ? parent.children || [] : stateRef.current.blocks
    const currentIndex = siblings.findIndex((b) => b.id === id)
    dispatch({
      type: "TRANSFORM_BLOCKS",
      fn: (prev) => insertBlock(prev, { ...dup, parentId: parent?.id ?? null }, parent?.id ?? null, currentIndex + 1),
    })
    dispatch({ type: "SELECT_BLOCK", id: dup.id })
  }, [])

  const moveBlock = useCallback(
    (blockId: string, targetParentId: string | null, targetIndex: number) => {
      dispatch({
        type: "TRANSFORM_BLOCKS",
        fn: (prev) => {
          if (targetParentId) {
            const path = getBlockPath(prev, targetParentId)
            if (path.some((b) => b.id === blockId)) return prev
          }
          return moveBlockInTree(prev, blockId, targetParentId, targetIndex)
        },
      })
    },
    []
  )

  const selectBlock = useCallback((id: string | null) => dispatch({ type: "SELECT_BLOCK", id }), [])
  const setHoveredBlock = useCallback((id: string | null) => dispatch({ type: "SET_HOVERED", id }), [])

  const getSelectedBlock = useCallback((): Block | null => {
    const s = stateRef.current
    return findBlockById(s.blocks, s.selectedBlockId ?? "") ?? null
  }, [])

  const getBlockById = useCallback((id: string): Block | null => findBlockById(stateRef.current.blocks, id), [])
  const getParentBlock = useCallback((id: string): Block | null => findParentBlock(stateRef.current.blocks, id), [])
  const getBlockBreadcrumb = useCallback((id: string): Block[] => getBlockPath(stateRef.current.blocks, id), [])

  const setDragState = useCallback((dragState: DragState | null) => dispatch({ type: "SET_DRAG_STATE", dragState }), [])

  const copyBlock = useCallback((id: string) => {
    const block = findBlockById(stateRef.current.blocks, id)
    if (!block) return
    dispatch({ type: "SET_CLIPBOARD", block: duplicateBlockDeep(block) })
  }, [])

  const pasteBlock = useCallback((parentId?: string | null, index?: number) => {
    const clip = stateRef.current.clipboard
    if (!clip) return
    const pasted = duplicateBlockDeep(clip)
    dispatch({
      type: "TRANSFORM_BLOCKS",
      fn: (prev) => insertBlock(prev, pasted, parentId ?? null, index),
    })
    dispatch({ type: "SELECT_BLOCK", id: pasted.id })
  }, [])

  const pasteStyle = useCallback((targetId: string) => {
    const clip = stateRef.current.clipboard
    if (!clip) return
    dispatch({
      type: "TRANSFORM_BLOCKS",
      fn: (prev) => updateBlockInTree(prev, targetId, { className: clip.className }),
    })
  }, [])

  const wrapInContainer = useCallback((blockId: string) => {
    const block = findBlockById(stateRef.current.blocks, blockId)
    if (!block) return

    const parent = findParentBlock(stateRef.current.blocks, blockId)
    const siblings = parent ? parent.children || [] : stateRef.current.blocks
    const index = siblings.findIndex((b) => b.id === blockId)

    const containerId = generateId()
    const container: Block = {
      id: containerId,
      tag: "div",
      className: "flex flex-col gap-4 p-4",
      children: [{ ...block, parentId: containerId }],
      parentId: parent?.id ?? null,
    }

    dispatch({
      type: "TRANSFORM_BLOCKS",
      fn: (prev) => {
        const removed = removeBlockById(prev, blockId)
        return insertBlock(removed, container, parent?.id ?? null, index)
      },
    })
    dispatch({ type: "SELECT_BLOCK", id: containerId })
  }, [])

  const unwrapContainer = useCallback((blockId: string) => {
    const block = findBlockById(stateRef.current.blocks, blockId)
    if (!block || !block.children || block.children.length === 0) return

    const parent = findParentBlock(stateRef.current.blocks, blockId)
    const siblings = parent ? parent.children || [] : stateRef.current.blocks
    const index = siblings.findIndex((b) => b.id === blockId)

    const childrenToPromote = block.children.map((child) => ({
      ...child,
      parentId: parent?.id ?? null,
    }))

    dispatch({
      type: "TRANSFORM_BLOCKS",
      fn: (prev) => {
        let result = removeBlockById(prev, blockId)
        for (let i = childrenToPromote.length - 1; i >= 0; i--) {
          result = insertBlock(result, childrenToPromote[i], parent?.id ?? null, index)
        }
        return result
      },
    })
    dispatch({ type: "SELECT_BLOCK", id: childrenToPromote[0]?.id ?? null })
  }, [])

  const setBlocks = useCallback((blocks: Block[]) => {
    dispatch({ type: "SET_BLOCKS", blocks })
    dispatch({ type: "SELECT_BLOCK", id: null })
  }, [])

  const clearAll = useCallback(() => dispatch({ type: "CLEAR_ALL" }), [])
  const undo = useCallback(() => dispatch({ type: "UNDO" }), [])
  const redo = useCallback(() => dispatch({ type: "REDO" }), [])

  /* ---- Page Management (API-backed) ---- */

  const saveCurrentPage = useCallback(async () => {
    const currentState = stateRef.current
    dispatch({ type: "SET_SAVE_STATUS", status: "saving" })

    try {
      const now = new Date().toISOString()

      // Use adapter if provided (for partials, site settings, etc.)
      if (adapter) {
        const title = currentState.currentPage?.title || "Untitled"
        const result = await adapter.save(currentState.blocks, title)
        const syntheticPage: SavedPage = {
          id: result.id,
          slug: currentState.currentPage?.slug || "",
          title,
          blocks: currentState.blocks,
          status: currentState.currentPage?.status || "draft",
          createdAt: currentState.currentPage?.createdAt || now,
          updatedAt: now,
        }
        dispatch({ type: "MARK_SAVED", timestamp: now, page: syntheticPage })
        return
      }

      // Default page-based save
      let page = currentState.currentPage
      if (!page) {
        page = createNewPage()
      }

      const pageToSave: SavedPage = {
        ...page,
        blocks: currentState.blocks,
        updatedAt: now,
      }

      const saved = await savePageToApi(pageToSave)
      if (saved) {
        setCurrentPageId(saved.id)
        dispatch({ type: "MARK_SAVED", timestamp: now, page: saved })

        // Auto-capture thumbnail after successful save
        try {
          const el = document.querySelector("[data-screenshot-target]") as HTMLElement | null
          if (el) {
            const { captureAsThumbnail } = await import("./screenshot")
            const thumbnail = await captureAsThumbnail(el)
            dispatch({ type: "SET_CURRENT_PAGE", page: { ...saved, thumbnail } })
          }
        } catch {
          // Thumbnail capture is best-effort, don't block save
        }
      } else {
        dispatch({ type: "SET_SAVE_STATUS", status: "error" })
      }
    } catch {
      dispatch({ type: "SET_SAVE_STATUS", status: "error" })
    }
  }, [adapter])

  const loadPage = useCallback(async (id: string) => {
    dispatch({ type: "SET_LOADING", loading: true })
    const page = await getPageFromApi(id)
    if (page) {
      dispatch({ type: "LOAD_PAGE", page })
      setCurrentPageId(id)
    } else {
      dispatch({ type: "SET_LOADING", loading: false })
    }
  }, [])

  const newPage = useCallback((title = "Untitled Page") => {
    const page = createNewPage(title)
    dispatch({ type: "LOAD_PAGE", page })
    setCurrentPageId(null)
  }, [])

  const updatePageMeta = useCallback((updates: Partial<Pick<SavedPage, "title" | "slug">>) => {
    const currentState = stateRef.current
    if (!currentState.currentPage) return

    const updatedPage: SavedPage = {
      ...currentState.currentPage,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: "SET_CURRENT_PAGE", page: updatedPage })
    dispatch({ type: "SET_SAVE_STATUS", status: "idle" })
  }, [])

  const publishPage = useCallback(async () => {
    const currentState = stateRef.current
    let page = currentState.currentPage

    if (!page) {
      page = createNewPage()
    }

    dispatch({ type: "SET_SAVE_STATUS", status: "saving" })

    try {
      const now = new Date().toISOString()
      const publishedPage: SavedPage = {
        ...page,
        blocks: currentState.blocks,
        status: "published",
        updatedAt: now,
        publishedAt: page.publishedAt || now,
      }

      const saved = await savePageToApi(publishedPage)
      if (saved) {
        setCurrentPageId(saved.id)
        dispatch({ type: "MARK_SAVED", timestamp: now, page: saved })
      } else {
        dispatch({ type: "SET_SAVE_STATUS", status: "error" })
      }
    } catch {
      dispatch({ type: "SET_SAVE_STATUS", status: "error" })
    }
  }, [])

  const unpublishPage = useCallback(async () => {
    const currentState = stateRef.current
    if (!currentState.currentPage) return

    dispatch({ type: "SET_SAVE_STATUS", status: "saving" })

    try {
      const now = new Date().toISOString()
      const unpublishedPage: SavedPage = {
        ...currentState.currentPage,
        blocks: currentState.blocks,
        status: "draft",
        updatedAt: now,
      }

      const saved = await savePageToApi(unpublishedPage)
      if (saved) {
        dispatch({ type: "MARK_SAVED", timestamp: now, page: saved })
      } else {
        dispatch({ type: "SET_SAVE_STATUS", status: "error" })
      }
    } catch {
      dispatch({ type: "SET_SAVE_STATUS", status: "error" })
    }
  }, [])

  const deletePage = useCallback(async (id: string) => {
    const success = await deletePageFromApi(id)
    if (success) {
      const currentState = stateRef.current
      if (currentState.currentPage?.id === id) {
        dispatch({ type: "SET_CURRENT_PAGE", page: null })
        dispatch({ type: "SET_BLOCKS", blocks: [] })
        setCurrentPageId(null)
      }
    }
  }, [])

  const getPages = useCallback(async () => {
    return getPagesList()
  }, [])

  /* ---- Code Editor Integration ---- */

  const jsxSource = useMemo(() => {
    const name = toPascalCase(state.currentPage?.title || "Page")
    return serializeBlocksToJSX(state.blocks, { componentName: name })
  }, [state.blocks, state.currentPage?.title])

  const setBlocksFromJSX = useCallback((jsx: string): { success: boolean; errors: string[] } => {
    const { blocks, errors } = parseJSXToBlocks(jsx)

    if (errors.length > 0 && blocks.length === 0) {
      return { success: false, errors }
    }

    dispatch({ type: "SET_BLOCKS_FROM_JSX", blocks: rehydrateParentIds(blocks) })

    return { success: true, errors }
  }, [])

  const getJSXSource = useCallback((): string => {
    const name = toPascalCase(stateRef.current.currentPage?.title || "Page")
    return serializeBlocksToJSX(stateRef.current.blocks, { componentName: name })
  }, [])

  const openFile = useCallback((file: ViewedFile) => {
    dispatch({ type: "SET_VIEWED_FILE", file })
  }, [])

  const closeFile = useCallback(() => {
    dispatch({ type: "SET_VIEWED_FILE", file: null })
  }, [])

  /* ---- AI Spotlight (Kofi) ---- */

  const setSpotlights = useCallback((spotlights: BlockSpotlight[]) => {
    dispatch({ type: "SET_SPOTLIGHTS", spotlights })
  }, [])

  const clearSpotlights = useCallback(() => {
    dispatch({ type: "CLEAR_SPOTLIGHTS" })
  }, [])

  const scrollToBlock = useCallback((blockId: string) => {
    // Find the block DOM element and scroll it into view
    const el = document.querySelector(`[data-block-id="${blockId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [])

  // Load content on mount (adapter or page)
  useEffect(() => {
    if (adapter) {
      // Load from adapter (partials, site settings, etc.)
      dispatch({ type: "SET_LOADING", loading: true })
      adapter.load().then((result) => {
        const syntheticPage: SavedPage = {
          id: result.id || "",
          slug: "",
          title: result.title,
          blocks: result.blocks,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        dispatch({ type: "LOAD_PAGE", page: syntheticPage })
      }).catch(() => {
        dispatch({ type: "SET_LOADING", loading: false })
      })
    } else if (pageId) {
      // Load specific page from API
      loadPage(pageId)
    } else {
      // Check for last edited page
      const lastPageId = getCurrentPageId()
      if (lastPageId) {
        loadPage(lastPageId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, adapter])

  // Auto-save effect (debounced 30s)
  useEffect(() => {
    if (!state.hasUnsavedChanges || !state.currentPage) return

    const timeout = setTimeout(() => {
      saveCurrentPage()
    }, 30000)

    return () => clearTimeout(timeout)
  }, [state.hasUnsavedChanges, state.currentPage, state.blocks, saveCurrentPage])

  return (
    <EditorContext.Provider
      value={{
        state,
        addBlockFromTemplate,
        addBlockRaw,
        removeBlock,
        updateBlock,
        duplicateBlock,
        moveBlock,
        selectBlock,
        setHoveredBlock,
        getSelectedBlock,
        getBlockById,
        getParentBlock,
        getBlockBreadcrumb,
        setDragState,
        copyBlock,
        pasteBlock,
        pasteStyle,
        wrapInContainer,
        unwrapContainer,
        setBlocks,
        clearAll,
        undo,
        redo,
        // Page management
        saveCurrentPage,
        loadPage,
        newPage,
        updatePageMeta,
        publishPage,
        unpublishPage,
        deletePage,
        getPages,
        // Code editor integration
        jsxSource,
        setBlocksFromJSX,
        getJSXSource,
        openFile,
        closeFile,
        // AI Spotlight (Kofi)
        setSpotlights,
        clearSpotlights,
        scrollToBlock,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) throw new Error("useEditor must be used within an EditorProvider")
  return context
}
