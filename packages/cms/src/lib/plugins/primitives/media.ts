/**
 * Media Primitives
 *
 * AI-callable primitives for media/file management.
 * Supports S3, Cloudflare R2, and local storage.
 */

import { CreatePrimitiveRequest } from '../types';

export const MEDIA_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // LIST MEDIA
  // ============================================================================
  {
    name: 'media.list',
    description: 'List media files with filtering and pagination',
    category: 'media',
    tags: ['media', 'files', 'images', 'storage'],
    icon: 'Image',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
          minimum: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        type: {
          type: 'string',
          description: 'Filter by file type',
          enum: ['image', 'video', 'audio', 'document', 'other'],
        },
        folderId: {
          type: 'string',
          description: 'Filter by folder ID',
        },
        search: {
          type: 'string',
          description: 'Search by filename',
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['name', 'size', 'createdAt'],
          default: 'createdAt',
        },
        sortOrder: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
      required: [],
    },
    handler: `
      const { page = 1, limit = 20, type, folderId, search, sortBy = 'createdAt', sortOrder = 'desc' } = input;

      const where = { deletedAt: null };

      if (type) {
        const mimePatterns = {
          image: 'image/%',
          video: 'video/%',
          audio: 'audio/%',
          document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats%', 'text/%'],
        };
        if (type !== 'other') {
          const pattern = mimePatterns[type];
          if (Array.isArray(pattern)) {
            where.OR = pattern.map(p => ({ mimeType: { contains: p.replace('%', '') } }));
          } else {
            where.mimeType = { startsWith: pattern.replace('%', '') };
          }
        }
      }

      if (folderId) where.folderId = folderId;
      if (search) where.name = { contains: search, mode: 'insensitive' };

      const [files, total] = await Promise.all([
        prisma.media.findMany({
          where,
          include: {
            folder: { select: { id: true, name: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.media.count({ where }),
      ]);

      return {
        files: files.map(f => ({
          id: f.id,
          name: f.name,
          url: f.url,
          thumbnailUrl: f.thumbnailUrl,
          mimeType: f.mimeType,
          size: f.size,
          width: f.width,
          height: f.height,
          alt: f.alt,
          folder: f.folder,
          createdAt: f.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `,
  },

  // ============================================================================
  // GET MEDIA
  // ============================================================================
  {
    name: 'media.get',
    description: 'Get a single media file by ID',
    category: 'media',
    tags: ['media', 'files', 'storage'],
    icon: 'File',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        mediaId: {
          type: 'string',
          description: 'Media ID',
        },
      },
      required: ['mediaId'],
    },
    handler: `
      const { mediaId } = input;

      const media = await prisma.media.findFirst({
        where: { id: mediaId, deletedAt: null },
        include: {
          folder: { select: { id: true, name: true, path: true } },
        },
      });

      if (!media) {
        throw new Error('Media not found');
      }

      return {
        id: media.id,
        name: media.name,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        mimeType: media.mimeType,
        size: media.size,
        width: media.width,
        height: media.height,
        alt: media.alt,
        caption: media.caption,
        folder: media.folder,
        metadata: media.metadata,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
      };
    `,
  },

  // ============================================================================
  // GET FOLDERS
  // ============================================================================
  {
    name: 'media.getFolders',
    description: 'Get media folders for organization',
    category: 'media',
    tags: ['media', 'folders', 'storage'],
    icon: 'Folder',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'Parent folder ID (null for root)',
        },
        includeFileCount: {
          type: 'boolean',
          description: 'Include file count per folder',
          default: true,
        },
      },
      required: [],
    },
    handler: `
      const { parentId, includeFileCount = true } = input;

      const where = {};
      if (parentId === null || parentId === undefined) {
        where.parentId = null;
      } else if (parentId) {
        where.parentId = parentId;
      }

      const folders = await prisma.mediaFolder.findMany({
        where,
        include: {
          _count: includeFileCount ? {
            select: { files: { where: { deletedAt: null } } },
          } : false,
          children: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return {
        folders: folders.map(f => ({
          id: f.id,
          name: f.name,
          path: f.path,
          fileCount: f._count?.files || 0,
          hasChildren: f.children.length > 0,
          createdAt: f.createdAt,
        })),
        total: folders.length,
      };
    `,
  },

  // ============================================================================
  // UPDATE MEDIA
  // ============================================================================
  {
    name: 'media.update',
    description: 'Update media file metadata (alt text, caption, folder)',
    category: 'media',
    tags: ['media', 'update', 'storage'],
    icon: 'Edit',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        mediaId: {
          type: 'string',
          description: 'Media ID',
        },
        name: {
          type: 'string',
          description: 'New filename',
        },
        alt: {
          type: 'string',
          description: 'Alt text for accessibility',
        },
        caption: {
          type: 'string',
          description: 'Caption/description',
        },
        folderId: {
          type: 'string',
          description: 'Move to folder',
        },
      },
      required: ['mediaId'],
    },
    handler: `
      const { mediaId, name, alt, caption, folderId } = input;

      const media = await prisma.media.findFirst({
        where: { id: mediaId, deletedAt: null },
      });

      if (!media) {
        throw new Error('Media not found');
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (alt !== undefined) updateData.alt = alt;
      if (caption !== undefined) updateData.caption = caption;
      if (folderId !== undefined) updateData.folderId = folderId || null;

      const updated = await prisma.media.update({
        where: { id: mediaId },
        data: updateData,
        include: {
          folder: { select: { id: true, name: true } },
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        url: updated.url,
        alt: updated.alt,
        caption: updated.caption,
        folder: updated.folder,
        updatedAt: updated.updatedAt,
      };
    `,
  },

  // ============================================================================
  // DELETE MEDIA
  // ============================================================================
  {
    name: 'media.delete',
    description: 'Soft delete a media file',
    category: 'media',
    tags: ['media', 'delete', 'storage'],
    icon: 'Trash2',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        mediaId: {
          type: 'string',
          description: 'Media ID',
        },
        permanent: {
          type: 'boolean',
          description: 'Permanently delete (cannot be undone)',
          default: false,
        },
      },
      required: ['mediaId'],
    },
    handler: `
      const { mediaId, permanent = false } = input;

      const media = await prisma.media.findFirst({
        where: { id: mediaId },
      });

      if (!media) {
        throw new Error('Media not found');
      }

      if (permanent) {
        // Delete from storage (would need to implement storage adapter)
        await prisma.media.delete({ where: { id: mediaId } });
        return { deleted: true, permanent: true, mediaId };
      } else {
        await prisma.media.update({
          where: { id: mediaId },
          data: { deletedAt: new Date() },
        });
        return { deleted: true, permanent: false, mediaId };
      }
    `,
  },

  // ============================================================================
  // CREATE FOLDER
  // ============================================================================
  {
    name: 'media.createFolder',
    description: 'Create a new media folder',
    category: 'media',
    tags: ['media', 'folders', 'storage'],
    icon: 'FolderPlus',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Folder name',
          minLength: 1,
          maxLength: 100,
        },
        parentId: {
          type: 'string',
          description: 'Parent folder ID (null for root)',
        },
      },
      required: ['name'],
    },
    handler: `
      const { name, parentId } = input;

      // Build path
      let path = '/' + name;
      if (parentId) {
        const parent = await prisma.mediaFolder.findUnique({ where: { id: parentId } });
        if (!parent) {
          throw new Error('Parent folder not found');
        }
        path = parent.path + '/' + name;
      }

      // Check for duplicate
      const existing = await prisma.mediaFolder.findFirst({
        where: { name, parentId: parentId || null },
      });

      if (existing) {
        throw new Error('Folder with this name already exists');
      }

      const folder = await prisma.mediaFolder.create({
        data: {
          name,
          path,
          parentId: parentId || null,
        },
      });

      return {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
      };
    `,
  },

  // ============================================================================
  // GET UPLOAD URL
  // ============================================================================
  {
    name: 'media.getUploadUrl',
    description: 'Get a presigned URL for direct upload to storage',
    category: 'media',
    tags: ['media', 'upload', 'storage'],
    icon: 'Upload',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Original filename',
        },
        mimeType: {
          type: 'string',
          description: 'File MIME type',
        },
        size: {
          type: 'number',
          description: 'File size in bytes',
        },
        folderId: {
          type: 'string',
          description: 'Target folder ID',
        },
      },
      required: ['filename', 'mimeType'],
    },
    handler: `
      const { filename, mimeType, size, folderId } = input;

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.some(t => mimeType.startsWith(t.split('/')[0]) || mimeType === t)) {
        throw new Error('File type not allowed');
      }

      // Max size check (50MB default)
      const maxSize = 50 * 1024 * 1024;
      if (size && size > maxSize) {
        throw new Error('File size exceeds maximum allowed (50MB)');
      }

      // Generate unique key
      const ext = filename.split('.').pop() || '';
      const key = 'uploads/' + Date.now() + '-' + Math.random().toString(36).substring(2) + '.' + ext;

      // For now, return placeholder - actual implementation would use S3/R2/local storage
      return {
        uploadUrl: '/api/media/upload',
        method: 'POST',
        key,
        fields: {
          filename,
          mimeType,
          folderId: folderId || null,
        },
        expiresIn: 3600,
        note: 'Use multipart/form-data with file field',
      };
    `,
  },
];
