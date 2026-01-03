/**
 * Media Folders - Folder Management Operations
 */

import { prisma } from '../db'
import type {
  FolderWithRelations,
  FolderTree,
  FolderCreateInput,
  FolderUpdateInput,
} from './types'

// Type augmentation for Prisma client with MediaFolder model
// This allows the code to compile before prisma generate is run
type PrismaWithMediaFolder = typeof prisma & {
  mediaFolder: {
    findMany: (args: any) => Promise<any[]>
    findUnique: (args: any) => Promise<any | null>
    findFirst: (args: any) => Promise<any | null>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    updateMany: (args: any) => Promise<{ count: number }>
    delete: (args: any) => Promise<any>
    deleteMany: (args: any) => Promise<{ count: number }>
    aggregate: (args: any) => Promise<any>
  }
  media: {
    updateMany: (args: any) => Promise<{ count: number }>
  }
}

const db = prisma as PrismaWithMediaFolder

// =============================================================================
// LIST FOLDERS
// =============================================================================

export async function listFolders(parentId?: string | null): Promise<FolderWithRelations[]> {
  const folders = await db.mediaFolder.findMany({
    where: parentId === undefined ? {} : { parentId },
    include: {
      parent: true,
      _count: {
        select: {
          media: true,
          children: true,
        },
      },
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })

  return folders as FolderWithRelations[]
}

// =============================================================================
// GET FOLDER TREE
// =============================================================================

export async function getFolderTree(): Promise<FolderTree[]> {
  const folders = await db.mediaFolder.findMany({
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
    orderBy: [{ depth: 'asc' }, { position: 'asc' }, { name: 'asc' }],
  })

  // Build tree structure
  const folderMap = new Map<string, FolderTree>()
  const rootFolders: FolderTree[] = []

  // First pass: create all folder nodes
  for (const folder of folders) {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
      mediaCount: folder._count.media,
    })
  }

  // Second pass: build hierarchy
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        rootFolders.push(node)
      }
    } else {
      rootFolders.push(node)
    }
  }

  return rootFolders
}

// =============================================================================
// GET SINGLE FOLDER
// =============================================================================

export async function getFolder(id: string): Promise<FolderWithRelations | null> {
  const folder = await db.mediaFolder.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      },
      _count: {
        select: {
          media: true,
          children: true,
        },
      },
    },
  })

  return folder as FolderWithRelations | null
}

// =============================================================================
// GET FOLDER BY PATH
// =============================================================================

export async function getFolderByPath(path: string): Promise<FolderWithRelations | null> {
  const folder = await db.mediaFolder.findFirst({
    where: { path },
    include: {
      parent: true,
      children: {
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      },
      _count: {
        select: {
          media: true,
          children: true,
        },
      },
    },
  })

  return folder as FolderWithRelations | null
}

// =============================================================================
// CREATE FOLDER
// =============================================================================

export async function createFolder(input: FolderCreateInput): Promise<FolderWithRelations> {
  const { name, parentId, ...rest } = input

  // Generate slug if not provided
  const slug = rest.slug || generateSlug(name)

  // Calculate path and depth
  let path = `/${slug}`
  let depth = 0

  if (parentId) {
    const parent = await db.mediaFolder.findUnique({
      where: { id: parentId },
    })
    if (parent) {
      path = `${parent.path}/${slug}`
      depth = parent.depth + 1
    }
  }

  // Get max position for siblings
  const maxPosition = await db.mediaFolder.aggregate({
    where: { parentId: parentId || null },
    _max: { position: true },
  })

  const folder = await db.mediaFolder.create({
    data: {
      name,
      slug,
      path,
      depth,
      position: (maxPosition._max.position || 0) + 1,
      parentId,
      ...rest,
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          media: true,
          children: true,
        },
      },
    },
  })

  return folder as FolderWithRelations
}

// =============================================================================
// UPDATE FOLDER
// =============================================================================

export async function updateFolder(id: string, input: FolderUpdateInput): Promise<FolderWithRelations> {
  const current = await db.mediaFolder.findUnique({
    where: { id },
  })

  if (!current) {
    throw new Error('Folder not found')
  }

  const updateData: any = { ...input }

  // If name changes, update slug and path
  if (input.name && input.name !== current.name) {
    const newSlug = input.slug || generateSlug(input.name)
    updateData.slug = newSlug

    // Update path for this folder and all descendants
    const oldPath = current.path
    let newPath: string

    if (current.parentId) {
      const parent = await db.mediaFolder.findUnique({
        where: { id: current.parentId },
      })
      newPath = parent ? `${parent.path}/${newSlug}` : `/${newSlug}`
    } else {
      newPath = `/${newSlug}`
    }

    updateData.path = newPath

    // Update all descendant paths
    await prisma.$executeRaw`
      UPDATE media_folders
      SET path = REPLACE(path, ${oldPath}, ${newPath})
      WHERE path LIKE ${oldPath + '/%'}
    `
  }

  // If parent changes, update path and depth
  if (input.parentId !== undefined && input.parentId !== current.parentId) {
    let newPath: string
    let newDepth: number

    if (input.parentId) {
      const newParent = await db.mediaFolder.findUnique({
        where: { id: input.parentId },
      })
      if (!newParent) {
        throw new Error('Parent folder not found')
      }
      // Prevent circular reference
      if (newParent.path.startsWith(current.path)) {
        throw new Error('Cannot move folder into its own descendant')
      }
      newPath = `${newParent.path}/${current.slug}`
      newDepth = newParent.depth + 1
    } else {
      newPath = `/${current.slug}`
      newDepth = 0
    }

    const oldPath = current.path
    const depthDiff = newDepth - current.depth

    updateData.path = newPath
    updateData.depth = newDepth

    // Update all descendant paths and depths
    await prisma.$executeRaw`
      UPDATE media_folders
      SET
        path = REPLACE(path, ${oldPath}, ${newPath}),
        depth = depth + ${depthDiff}
      WHERE path LIKE ${oldPath + '/%'}
    `
  }

  const folder = await db.mediaFolder.update({
    where: { id },
    data: updateData,
    include: {
      parent: true,
      children: {
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      },
      _count: {
        select: {
          media: true,
          children: true,
        },
      },
    },
  })

  return folder as FolderWithRelations
}

// =============================================================================
// DELETE FOLDER
// =============================================================================

export async function deleteFolder(
  id: string,
  options: { moveMediaTo?: string | null; deleteChildren?: boolean } = {}
): Promise<void> {
  const { moveMediaTo = null, deleteChildren = false } = options

  const folder = await db.mediaFolder.findUnique({
    where: { id },
    include: {
      children: true,
      _count: {
        select: { media: true },
      },
    },
  })

  if (!folder) {
    throw new Error('Folder not found')
  }

  // Move media to target folder (or root if null)
  if (folder._count.media > 0) {
    await db.media.updateMany({
      where: { folderId: id },
      data: { folderId: moveMediaTo },
    })
  }

  if (deleteChildren) {
    // Delete all descendants recursively
    await db.mediaFolder.deleteMany({
      where: {
        path: { startsWith: `${folder.path}/` },
      },
    })
  } else {
    // Move children to this folder's parent
    await db.mediaFolder.updateMany({
      where: { parentId: id },
      data: { parentId: folder.parentId },
    })

    // Update paths for moved children
    for (const child of folder.children) {
      const newPath = folder.parentId
        ? `${folder.path.substring(0, folder.path.lastIndexOf('/'))}/${child.slug}`
        : `/${child.slug}`

      await db.mediaFolder.update({
        where: { id: child.id },
        data: {
          path: newPath,
          depth: child.depth - 1,
        },
      })
    }
  }

  // Delete the folder itself
  await db.mediaFolder.delete({
    where: { id },
  })
}

// =============================================================================
// REORDER FOLDERS
// =============================================================================

export async function reorderFolders(
  folderId: string,
  newPosition: number,
  parentId: string | null
): Promise<void> {
  const folder = await db.mediaFolder.findUnique({
    where: { id: folderId },
  })

  if (!folder) {
    throw new Error('Folder not found')
  }

  // Get all siblings
  const siblings = await db.mediaFolder.findMany({
    where: { parentId },
    orderBy: { position: 'asc' },
  })

  // Remove current folder from list
  const otherSiblings = siblings.filter((s) => s.id !== folderId)

  // Insert at new position
  otherSiblings.splice(newPosition, 0, folder)

  // Update positions
  await Promise.all(
    otherSiblings.map((sibling, index) =>
      db.mediaFolder.update({
        where: { id: sibling.id },
        data: { position: index },
      })
    )
  )
}

// Helper function (importing from types would cause circular dependency)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
