import * as _prisma_client_runtime_client from '@prisma/client/runtime/client';
import * as _prisma_client from '@prisma/client';
import { PrismaClient, Prisma, CartStatus, DiscountCode, DiscountUsage, ReviewStatus, Workflow, WorkflowNode, Primitive, WorkflowExecution, PrimitiveExecution, WorkflowTemplate as WorkflowTemplate$2, WorkflowStep, WorkflowTemplateCategory as WorkflowTemplateCategory$1, WorkflowTrigger } from '@prisma/client';
export { RouteType } from '@prisma/client';
import { g as MediaFilters, i as MediaListResponse, h as MediaWithRelations, j as MediaCreateInput, k as MediaUpdateInput } from '../types-3nuadCDa.js';
export { B as BulkOperation, s as BulkOperationInput, t as BulkOperationResult, C as CorsRule, D as DEFAULT_ALLOWED_TYPES, A as DEFAULT_MAX_FILE_SIZE, E as EntityType, m as FolderCreateInput, l as FolderTree, n as FolderUpdateInput, F as FolderWithRelations, M as MediaBase, a as MediaFolderBase, b as MediaTagBase, d as MediaType, c as MediaUsageBase, P as PresignedUrlResponse, e as SortField, f as SortOrder, S as StorageProvider, o as TagCreateInput, p as TagUpdateInput, T as TagWithCount, q as UploadOptions, r as UploadProgress, U as UsageInfo, V as ViewMode, w as formatFileSize, G as generateCorsConfig, x as generateSlug, H as getCorsConfigJson, v as getFileExtension, u as getMediaType, y as getMediaTypeIcon, z as isAllowedFileType } from '../types-3nuadCDa.js';
import { Metadata, Viewport as Viewport$1 } from 'next';
import Stripe from 'stripe';
import { ClassValue } from 'clsx';

declare const prisma: PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_client.DefaultArgs>;

/**
 * Analytics Types and Configurations
 */
type AnalyticsProvider = 'google' | 'matomo' | 'plausible' | 'umami' | 'custom';
interface AnalyticsSettings {
    enabled: boolean;
    googleEnabled: boolean;
    googleMeasurementId?: string;
    googleDebugMode: boolean;
    matomoEnabled: boolean;
    matomoUrl?: string;
    matomoSiteId?: string;
    plausibleEnabled: boolean;
    plausibleDomain?: string;
    respectDoNotTrack: boolean;
    anonymizeIp: boolean;
    cookieConsent: boolean;
}
declare const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings;
type StandardEventName = 'page_view' | 'purchase' | 'add_to_cart' | 'remove_from_cart' | 'begin_checkout' | 'view_item' | 'view_item_list' | 'search' | 'sign_up' | 'login' | 'share' | 'generate_lead' | 'add_payment_info' | 'add_shipping_info' | 'select_item' | 'select_promotion' | 'view_promotion' | 'refund';
interface AnalyticsEvent {
    name: string;
    params?: Record<string, string | number | boolean | undefined>;
}
interface EcommerceItem {
    item_id: string;
    item_name: string;
    item_brand?: string;
    item_category?: string;
    item_variant?: string;
    price?: number;
    quantity?: number;
    currency?: string;
}
interface PurchaseEventData {
    transaction_id: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items: EcommerceItem[];
}
interface PageViewData {
    page_title?: string;
    page_location?: string;
    page_path?: string;
}
interface UserProperties {
    user_id?: string;
    user_type?: string;
    [key: string]: string | number | boolean | undefined;
}
interface ConsentSettings {
    analytics_storage: 'granted' | 'denied';
    ad_storage: 'granted' | 'denied';
    ad_user_data: 'granted' | 'denied';
    ad_personalization: 'granted' | 'denied';
    functionality_storage: 'granted' | 'denied';
    personalization_storage: 'granted' | 'denied';
    security_storage: 'granted';
}
declare const DEFAULT_CONSENT: ConsentSettings;

/**
 * Analytics Library
 *
 * Provides unified analytics tracking for Google Analytics 4 and Matomo
 */

/**
 * Get analytics settings from database
 */
declare function getAnalyticsSettings(): Promise<AnalyticsSettings>;
/**
 * Clear analytics settings cache
 */
declare function clearAnalyticsSettingsCache(): void;
/**
 * Track an event server-side (stores in database)
 */
declare function trackServerEvent(eventName: string, eventData?: Record<string, any>, context?: {
    sessionId?: string;
    userId?: string;
    pageUrl?: string;
    pageTitle?: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
}): Promise<void>;
/**
 * Track a purchase event
 */
declare function trackPurchase(data: PurchaseEventData, context?: {
    sessionId?: string;
    userId?: string;
}): Promise<void>;
/**
 * Get analytics data for dashboard
 */
declare function getAnalyticsSummary(startDate: Date, endDate: Date): Promise<{
    pageViews: number;
    uniqueVisitors: number;
    purchases: number;
    revenue: number;
    topPages: Array<{
        url: string;
        views: number;
    }>;
    topReferrers: Array<{
        referrer: string;
        count: number;
    }>;
    eventBreakdown: Array<{
        event: string;
        count: number;
    }>;
}>;
/**
 * Generate Google Analytics gtag script
 */
declare function generateGtagScript(measurementId: string, debugMode?: boolean): string;
/**
 * Generate Matomo tracking script
 */
declare function generateMatomoScript(matomoUrl: string, siteId: string): string;

interface CreatePostInput {
    title: string;
    slug?: string;
    excerpt?: string;
    content?: object;
    contentHtml?: string;
    authorId?: string;
    featuredImageId?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
    visibility?: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED' | 'MEMBERS_ONLY';
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImageId?: string;
    publishedAt?: Date;
    scheduledAt?: Date;
    allowComments?: boolean;
    featured?: boolean;
    pinned?: boolean;
    categoryIds?: string[];
    tagIds?: string[];
}
interface UpdatePostInput extends Partial<CreatePostInput> {
}
interface ListPostsOptions {
    status?: string;
    visibility?: string;
    authorId?: string;
    categoryId?: string;
    tagId?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'publishedAt' | 'title' | 'viewCount';
    orderDir?: 'asc' | 'desc';
}
declare function createPost(input: CreatePostInput): Promise<{
    tags: ({
        tag: {
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
            slug: string;
            postCount: number;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
    categories: ({
        category: {
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            description: string | null;
            position: number;
            parentId: string | null;
            updatedAt: Date;
            slug: string;
            metaTitle: string | null;
            metaDescription: string | null;
            imageId: string | null;
            postCount: number;
        };
    } & {
        position: number;
        postId: string;
        categoryId: string;
    })[];
    featuredImage: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
    author: {
        name: string | null;
        id: string;
        email: string;
    } | null;
} & {
    title: string;
    id: string;
    content: Prisma.JsonValue | null;
    status: _prisma_client.$Enums.BlogPostStatus;
    visibility: _prisma_client.$Enums.PostVisibility;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string | null;
    contentHtml: string | null;
    authorId: string | null;
    featuredImageId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageId: string | null;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    readingTime: number | null;
    wordCount: number | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    allowComments: boolean;
    featured: boolean;
    pinned: boolean;
}>;
declare function getPost(id: string): Promise<({
    tags: ({
        tag: {
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
            slug: string;
            postCount: number;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
    _count: {
        comments: number;
    };
    categories: ({
        category: {
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            description: string | null;
            position: number;
            parentId: string | null;
            updatedAt: Date;
            slug: string;
            metaTitle: string | null;
            metaDescription: string | null;
            imageId: string | null;
            postCount: number;
        };
    } & {
        position: number;
        postId: string;
        categoryId: string;
    })[];
    featuredImage: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
    author: {
        name: string | null;
        id: string;
        email: string;
    } | null;
    ogImage: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
} & {
    title: string;
    id: string;
    content: Prisma.JsonValue | null;
    status: _prisma_client.$Enums.BlogPostStatus;
    visibility: _prisma_client.$Enums.PostVisibility;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string | null;
    contentHtml: string | null;
    authorId: string | null;
    featuredImageId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageId: string | null;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    readingTime: number | null;
    wordCount: number | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    allowComments: boolean;
    featured: boolean;
    pinned: boolean;
}) | null>;
declare function getPostBySlug(slug: string): Promise<({
    tags: ({
        tag: {
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
            slug: string;
            postCount: number;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
    _count: {
        comments: number;
    };
    categories: ({
        category: {
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            description: string | null;
            position: number;
            parentId: string | null;
            updatedAt: Date;
            slug: string;
            metaTitle: string | null;
            metaDescription: string | null;
            imageId: string | null;
            postCount: number;
        };
    } & {
        position: number;
        postId: string;
        categoryId: string;
    })[];
    featuredImage: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
    author: {
        name: string | null;
        id: string;
        email: string;
    } | null;
    ogImage: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
} & {
    title: string;
    id: string;
    content: Prisma.JsonValue | null;
    status: _prisma_client.$Enums.BlogPostStatus;
    visibility: _prisma_client.$Enums.PostVisibility;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string | null;
    contentHtml: string | null;
    authorId: string | null;
    featuredImageId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageId: string | null;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    readingTime: number | null;
    wordCount: number | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    allowComments: boolean;
    featured: boolean;
    pinned: boolean;
}) | null>;
declare function listPosts(options?: ListPostsOptions): Promise<{
    posts: ({
        tags: ({
            tag: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            postId: string;
            tagId: string;
        })[];
        categories: ({
            category: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            position: number;
            postId: string;
            categoryId: string;
        })[];
        featuredImage: {
            id: string;
            url: string;
            alt: string | null;
        } | null;
        author: {
            name: string | null;
            id: string;
            email: string;
        } | null;
    } & {
        title: string;
        id: string;
        content: Prisma.JsonValue | null;
        status: _prisma_client.$Enums.BlogPostStatus;
        visibility: _prisma_client.$Enums.PostVisibility;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        excerpt: string | null;
        contentHtml: string | null;
        authorId: string | null;
        featuredImageId: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
        canonicalUrl: string | null;
        noIndex: boolean;
        ogTitle: string | null;
        ogDescription: string | null;
        ogImageId: string | null;
        publishedAt: Date | null;
        scheduledAt: Date | null;
        readingTime: number | null;
        wordCount: number | null;
        viewCount: number;
        likeCount: number;
        commentCount: number;
        allowComments: boolean;
        featured: boolean;
        pinned: boolean;
    })[];
    total: number;
    limit: number;
    offset: number;
}>;
declare function updatePost(id: string, input: UpdatePostInput): Promise<{
    tags: ({
        tag: {
            name: string;
            id: string;
            createdAt: Date;
            description: string | null;
            updatedAt: Date;
            slug: string;
            postCount: number;
        };
    } & {
        postId: string;
        tagId: string;
    })[];
    categories: ({
        category: {
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            description: string | null;
            position: number;
            parentId: string | null;
            updatedAt: Date;
            slug: string;
            metaTitle: string | null;
            metaDescription: string | null;
            imageId: string | null;
            postCount: number;
        };
    } & {
        position: number;
        postId: string;
        categoryId: string;
    })[];
    featuredImage: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
    author: {
        name: string | null;
        id: string;
        email: string;
    } | null;
} & {
    title: string;
    id: string;
    content: Prisma.JsonValue | null;
    status: _prisma_client.$Enums.BlogPostStatus;
    visibility: _prisma_client.$Enums.PostVisibility;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string | null;
    contentHtml: string | null;
    authorId: string | null;
    featuredImageId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageId: string | null;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    readingTime: number | null;
    wordCount: number | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    allowComments: boolean;
    featured: boolean;
    pinned: boolean;
}>;
declare function deletePost(id: string): Promise<{
    title: string;
    id: string;
    content: Prisma.JsonValue | null;
    status: _prisma_client.$Enums.BlogPostStatus;
    visibility: _prisma_client.$Enums.PostVisibility;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string | null;
    contentHtml: string | null;
    authorId: string | null;
    featuredImageId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageId: string | null;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    readingTime: number | null;
    wordCount: number | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    allowComments: boolean;
    featured: boolean;
    pinned: boolean;
}>;
declare function incrementPostViews(id: string): Promise<{
    title: string;
    id: string;
    content: Prisma.JsonValue | null;
    status: _prisma_client.$Enums.BlogPostStatus;
    visibility: _prisma_client.$Enums.PostVisibility;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string | null;
    contentHtml: string | null;
    authorId: string | null;
    featuredImageId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageId: string | null;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    readingTime: number | null;
    wordCount: number | null;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    allowComments: boolean;
    featured: boolean;
    pinned: boolean;
}>;
interface CreateCategoryInput {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
    imageId?: string;
    metaTitle?: string;
    metaDescription?: string;
}
interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
}
declare function createCategory(input: CreateCategoryInput): Promise<{
    children: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    }[];
    parent: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    } | null;
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    color: string | null;
    createdAt: Date;
    description: string | null;
    position: number;
    parentId: string | null;
    updatedAt: Date;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
    imageId: string | null;
    postCount: number;
}>;
declare function getCategory(id: string): Promise<({
    children: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    }[];
    image: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
    parent: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    } | null;
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    color: string | null;
    createdAt: Date;
    description: string | null;
    position: number;
    parentId: string | null;
    updatedAt: Date;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
    imageId: string | null;
    postCount: number;
}) | null>;
declare function getCategoryBySlug(slug: string): Promise<({
    children: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    }[];
    image: {
        caption: string | null;
        title: string | null;
        key: string | null;
        size: number;
        id: string;
        url: string;
        height: number | null;
        width: number | null;
        createdAt: Date;
        description: string | null;
        alt: string | null;
        provider: _prisma_client.$Enums.StorageProvider;
        folderId: string | null;
        filename: string;
        updatedAt: Date;
        originalName: string;
        mimeType: string;
        bucket: string | null;
        deletedAt: Date | null;
        uploadedById: string | null;
    } | null;
    parent: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    } | null;
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    color: string | null;
    createdAt: Date;
    description: string | null;
    position: number;
    parentId: string | null;
    updatedAt: Date;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
    imageId: string | null;
    postCount: number;
}) | null>;
declare function listCategories(options?: {
    parentId?: string | null;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    categories: ({
        children: {
            name: string;
            id: string;
            slug: string;
        }[];
        parent: {
            name: string;
            id: string;
            slug: string;
        } | null;
        _count: {
            posts: number;
        };
    } & {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    })[];
    total: number;
    limit: number;
    offset: number;
}>;
declare function updateCategory(id: string, input: UpdateCategoryInput): Promise<{
    children: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    }[];
    parent: {
        name: string;
        id: string;
        color: string | null;
        createdAt: Date;
        description: string | null;
        position: number;
        parentId: string | null;
        updatedAt: Date;
        slug: string;
        metaTitle: string | null;
        metaDescription: string | null;
        imageId: string | null;
        postCount: number;
    } | null;
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    color: string | null;
    createdAt: Date;
    description: string | null;
    position: number;
    parentId: string | null;
    updatedAt: Date;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
    imageId: string | null;
    postCount: number;
}>;
declare function deleteCategory(id: string): Promise<{
    name: string;
    id: string;
    color: string | null;
    createdAt: Date;
    description: string | null;
    position: number;
    parentId: string | null;
    updatedAt: Date;
    slug: string;
    metaTitle: string | null;
    metaDescription: string | null;
    imageId: string | null;
    postCount: number;
}>;
interface CreateTagInput {
    name: string;
    slug?: string;
    description?: string;
}
interface UpdateTagInput extends Partial<CreateTagInput> {
}
declare function createTag(input: CreateTagInput): Promise<{
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    description: string | null;
    updatedAt: Date;
    slug: string;
    postCount: number;
}>;
declare function getTag(id: string): Promise<({
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    description: string | null;
    updatedAt: Date;
    slug: string;
    postCount: number;
}) | null>;
declare function getTagBySlug(slug: string): Promise<({
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    description: string | null;
    updatedAt: Date;
    slug: string;
    postCount: number;
}) | null>;
declare function listTags(options?: {
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    tags: ({
        _count: {
            posts: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        slug: string;
        postCount: number;
    })[];
    total: number;
    limit: number;
    offset: number;
}>;
declare function updateTag(id: string, input: UpdateTagInput): Promise<{
    _count: {
        posts: number;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    description: string | null;
    updatedAt: Date;
    slug: string;
    postCount: number;
}>;
declare function deleteTag(id: string): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    description: string | null;
    updatedAt: Date;
    slug: string;
    postCount: number;
}>;

/**
 * Cart Management Service
 *
 * Handles cart operations including:
 * - Guest and authenticated carts
 * - Item management (add, update, remove)
 * - Discount application
 * - Total calculation
 * - Cart merging on login
 * - Abandonment tracking
 */

interface CartItemInput {
    productId: string;
    variantId?: string | null;
    quantity: number;
}
interface CartIdentifier {
    sessionId?: string;
    userId?: string;
    cartId?: string;
}
interface CartWithItems {
    id: string;
    sessionId: string | null;
    userId: string | null;
    email: string | null;
    status: CartStatus;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    shippingTotal: number;
    total: number;
    discountCodeId: string | null;
    abandonedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
        id: string;
        productId: string;
        variantId: string | null;
        quantity: number;
        title: string;
        variantTitle: string | null;
        price: number;
        imageUrl: string | null;
    }>;
    discountCode: {
        id: string;
        code: string;
        type: string;
        value: number;
    } | null;
}
/**
 * Get or create a cart by session ID or user ID
 */
declare function getOrCreateCart(identifier: CartIdentifier): Promise<CartWithItems>;
/**
 * Add item to cart
 */
declare function addToCart(cartId: string, item: CartItemInput): Promise<CartWithItems>;
/**
 * Update item quantity
 */
declare function updateCartItem(cartId: string, itemId: string, quantity: number): Promise<CartWithItems>;
/**
 * Remove item from cart
 */
declare function removeFromCart(cartId: string, itemId: string): Promise<CartWithItems>;
/**
 * Clear all items from cart
 */
declare function clearCart(cartId: string): Promise<CartWithItems>;
/**
 * Apply discount code to cart
 */
declare function applyDiscount(cartId: string, code: string): Promise<{
    cart: CartWithItems;
    error?: string;
}>;
/**
 * Remove discount from cart
 */
declare function removeDiscount(cartId: string): Promise<CartWithItems>;
/**
 * Update cart email (for guest abandonment recovery)
 */
declare function updateCartEmail(cartId: string, email: string): Promise<CartWithItems>;
/**
 * Merge guest cart into user cart on login
 */
declare function mergeCartsOnLogin(sessionId: string, userId: string): Promise<CartWithItems | null>;
/**
 * Mark cart as converted (after successful checkout)
 */
declare function convertCart(cartId: string, orderId: string): Promise<void>;
/**
 * Mark carts as abandoned after timeout (called by scheduled job)
 */
declare function markAbandonedCarts(timeoutMinutes?: number): Promise<number>;
/**
 * Get abandoned carts for recovery emails
 */
declare function getAbandonedCartsForRecovery(minAgeMinutes?: number, maxAgeHours?: number): Promise<Array<CartWithItems & {
    email: string;
}>>;
/**
 * Mark recovery email as sent
 */
declare function markRecoveryEmailSent(cartId: string): Promise<void>;
/**
 * Mark cart as recovered (customer returned)
 */
declare function markCartRecovered(cartId: string): Promise<CartWithItems>;
/**
 * Clean up expired carts (called by scheduled job)
 */
declare function cleanupExpiredCarts(expiryDays?: number): Promise<number>;
/**
 * Get cart statistics for analytics
 */
declare function getCartStats(): Promise<{
    activeCarts: number;
    abandonedCarts: number;
    recoveredCarts: number;
    conversionRate: number;
    averageCartValue: number;
}>;

/**
 * Discount Code Validator
 *
 * Validates discount codes against all business rules
 */

interface ValidationContext {
    code: string;
    subtotal: number;
    userId?: string | null;
    email?: string | null;
    isFirstOrder?: boolean;
    items?: Array<{
        productId: string;
        categoryIds: string[];
        quantity: number;
        price: number;
        isOnSale?: boolean;
    }>;
}
interface ValidationResult$1 {
    valid: boolean;
    discount: DiscountCode | null;
    error?: string;
    errorCode?: ValidationErrorCode;
}
type ValidationErrorCode = 'NOT_FOUND' | 'DISABLED' | 'EXPIRED' | 'NOT_STARTED' | 'USAGE_LIMIT_REACHED' | 'CUSTOMER_LIMIT_REACHED' | 'MIN_ORDER_NOT_MET' | 'FIRST_ORDER_ONLY' | 'NO_APPLICABLE_ITEMS' | 'EXCLUDED_ITEMS_ONLY';
/**
 * Validate a discount code against all business rules
 */
declare function validateDiscountCode(context: ValidationContext): Promise<ValidationResult$1>;
/**
 * Get items that a discount applies to
 */
declare function getApplicableItems(discount: DiscountCode, items: Array<{
    productId: string;
    categoryIds: string[];
    quantity: number;
    price: number;
    isOnSale?: boolean;
}>): typeof items;
/**
 * Check if user is making their first order
 */
declare function isFirstOrderForUser(userId?: string | null, email?: string | null): Promise<boolean>;
/**
 * Record discount usage after order is placed
 */
declare function recordDiscountUsage(discountCodeId: string, orderId: string, userId: string | null, email: string, discountAmount: number): Promise<DiscountUsage>;

/**
 * Discount Calculator
 *
 * Calculates discount amounts for carts and orders
 */

interface CartItem {
    productId: string;
    variantId?: string;
    categoryIds: string[];
    name?: string;
    quantity: number;
    price: number;
    isOnSale?: boolean;
}
interface CartTotals {
    subtotal: number;
    shippingTotal: number;
}
interface DiscountCalculation {
    discountAmount: number;
    discountedSubtotal: number;
    discountedShipping: number;
    appliedTo: 'order' | 'products' | 'categories' | 'shipping';
    itemDiscounts: Array<{
        productId: string;
        variantId?: string;
        originalPrice: number;
        discountAmount: number;
        finalPrice: number;
    }>;
    description: string;
}
/**
 * Calculate discount amount for a cart
 */
declare function calculateDiscount(discount: DiscountCode, items: CartItem[], totals: CartTotals): DiscountCalculation;
/**
 * Format discount for display
 */
declare function formatDiscount(discount: DiscountCode): string;
/**
 * Get discount code summary for display
 */
declare function getDiscountSummary(discount: DiscountCode): {
    type: string;
    value: string;
    conditions: string[];
};
/**
 * Calculate the final cart total with discount applied
 */
declare function calculateCartTotals(items: CartItem[], shippingTotal: number, taxRate: number, discount: DiscountCode | null): {
    subtotal: number;
    discountTotal: number;
    discountedSubtotal: number;
    shippingTotal: number;
    taxTotal: number;
    total: number;
    discountDescription: string | null;
};

/**
 * Stripe Discount Sync
 *
 * Syncs discount codes with Stripe coupons and promotion codes
 */
/**
 * Create a Stripe coupon from a discount code
 */
declare function createStripeCoupon(discountId: string): Promise<string>;
/**
 * Create a Stripe promotion code from a discount code
 * Promotion codes are customer-facing codes that reference coupons
 */
declare function createStripePromotionCode(discountId: string): Promise<string>;
/**
 * Sync a discount code to Stripe (create or update)
 */
declare function syncDiscountToStripe(discountId: string): Promise<{
    couponId: string;
    promotionCodeId: string;
}>;
/**
 * Delete Stripe coupon and promotion code for a discount
 */
declare function deleteStripeDiscount(discountId: string): Promise<void>;
/**
 * Toggle promotion code active status in Stripe
 */
declare function toggleStripePromotionCode(discountId: string, active: boolean): Promise<void>;
/**
 * Import a Stripe coupon/promotion code into our system
 */
declare function importFromStripe(promotionCodeId: string): Promise<string>;
/**
 * Get Stripe coupons not yet imported
 */
declare function listUnimportedStripeCoupons(): Promise<Array<{
    id: string;
    name: string | null;
    percentOff: number | null;
    amountOff: number | null;
    currency: string | null;
    valid: boolean;
}>>;
/**
 * Validate a promotion code in Stripe
 */
declare function validateStripePromotionCode(code: string): Promise<{
    valid: boolean;
    promotionCodeId?: string;
    couponId?: string;
    percentOff?: number;
    amountOff?: number;
    error?: string;
}>;

/**
 * Email Service Types
 *
 * Multi-provider email sending abstraction supporting:
 * - SMTP (nodemailer)
 * - SendGrid
 * - Resend
 * - Mailgun
 * - AWS SES
 */
type EmailProvider = 'smtp' | 'sendgrid' | 'resend' | 'mailgun' | 'ses';
interface EmailAddress {
    email: string;
    name?: string;
}
interface EmailAttachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
    encoding?: 'base64' | 'utf8';
    cid?: string;
}
interface EmailMessage {
    to: EmailAddress | EmailAddress[];
    from?: EmailAddress;
    replyTo?: EmailAddress;
    subject: string;
    text?: string;
    html?: string;
    cc?: EmailAddress | EmailAddress[];
    bcc?: EmailAddress | EmailAddress[];
    attachments?: EmailAttachment[];
    headers?: Record<string, string>;
    tags?: string[];
    metadata?: Record<string, string>;
    trackOpens?: boolean;
    trackClicks?: boolean;
    campaignId?: string;
    recipientId?: string;
}
interface EmailSendResult {
    success: boolean;
    messageId?: string;
    provider: EmailProvider;
    error?: string;
    errorCode?: string;
    timestamp: Date;
    raw?: unknown;
}
interface BulkEmailMessage extends Omit<EmailMessage, 'to'> {
    recipients: Array<{
        to: EmailAddress;
        substitutions?: Record<string, string>;
        metadata?: Record<string, string>;
    }>;
}
interface BulkEmailResult {
    success: boolean;
    provider: EmailProvider;
    totalSent: number;
    totalFailed: number;
    results: Array<{
        email: string;
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    timestamp: Date;
}
interface SmtpConfig {
    host: string;
    port: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    pool?: boolean;
    maxConnections?: number;
}
interface SendGridConfig {
    apiKey: string;
    sandboxMode?: boolean;
}
interface ResendConfig {
    apiKey: string;
}
interface MailgunConfig {
    apiKey: string;
    domain: string;
    region?: 'us' | 'eu';
}
interface SesConfig {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}
type ProviderConfig = {
    provider: 'smtp';
    config: SmtpConfig;
} | {
    provider: 'sendgrid';
    config: SendGridConfig;
} | {
    provider: 'resend';
    config: ResendConfig;
} | {
    provider: 'mailgun';
    config: MailgunConfig;
} | {
    provider: 'ses';
    config: SesConfig;
};
interface IEmailProvider {
    readonly name: EmailProvider;
    /**
     * Send a single email
     */
    send(message: EmailMessage): Promise<EmailSendResult>;
    /**
     * Send bulk emails (if supported by provider)
     */
    sendBulk?(message: BulkEmailMessage): Promise<BulkEmailResult>;
    /**
     * Verify provider configuration
     */
    verify(): Promise<boolean>;
    /**
     * Close/cleanup connections
     */
    close?(): Promise<void>;
}
interface EmailServiceConfig {
    provider: EmailProvider;
    defaultFrom: EmailAddress;
    defaultReplyTo?: EmailAddress;
    trackOpens?: boolean;
    trackClicks?: boolean;
    trackingDomain?: string;
    openTrackingPath?: string;
    clickTrackingPath?: string;
    rateLimit?: {
        maxPerSecond?: number;
        maxPerMinute?: number;
        maxPerHour?: number;
    };
}
type EmailEventType = 'delivered' | 'bounced' | 'soft_bounced' | 'complained' | 'opened' | 'clicked' | 'unsubscribed' | 'dropped' | 'deferred';
interface EmailWebhookEvent {
    type: EmailEventType;
    email: string;
    messageId?: string;
    timestamp: Date;
    provider: EmailProvider;
    campaignId?: string;
    recipientId?: string;
    bounceType?: 'hard' | 'soft' | 'blocked';
    bounceReason?: string;
    complaintType?: string;
    linkUrl?: string;
    userAgent?: string;
    ipAddress?: string;
    raw?: unknown;
}
interface EmailTemplateData {
    [key: string]: string | number | boolean | null | undefined | EmailTemplateData | EmailTemplateData[];
}
interface RenderedEmail {
    subject: string;
    html: string;
    text?: string;
}

/**
 * Merge Tag Parser
 *
 * Handles Mailchimp-style merge tags for email personalization
 *
 * Supported formats:
 * - {{FNAME}} - Simple variable
 * - {{subscriber.firstName}} - Nested path
 * - {{product.name|default:"Product"}} - With default value
 * - {{order.total|currency}} - With formatter
 * - {{#if hasOrders}}...{{/if}} - Conditional blocks
 * - {{#each products}}...{{/each}} - Loops
 */
interface MergeTagData {
    [key: string]: string | number | boolean | null | undefined | MergeTagData | MergeTagData[];
}
/**
 * Parse and replace all merge tags in a template
 */
declare function parseMergeTags(template: string, data: MergeTagData): string;
/**
 * Extract all merge tags from a template
 */
declare function extractMergeTags(template: string): string[];
/**
 * Validate that all required merge tags have data
 */
declare function validateMergeTagData(template: string, data: MergeTagData): {
    valid: boolean;
    missing: string[];
};
/**
 * Register a custom formatter
 */
declare function registerFormatter(name: string, formatter: (value: unknown, ...args: string[]) => string): void;
/**
 * Get all available formatters
 */
declare function getFormatters(): string[];

/**
 * Email Tracking Service
 *
 * Injects tracking pixels and rewrites links for email analytics
 */
/**
 * Generate a unique tracking token
 */
declare function generateTrackingToken(): string;
/**
 * Create a tracking pixel URL
 */
declare function createOpenTrackingUrl(recipientId: string, campaignId?: string): string;
/**
 * Create a click tracking URL
 */
declare function createClickTrackingUrl(recipientId: string, originalUrl: string, linkId?: string, campaignId?: string): string;
/**
 * Create an unsubscribe URL
 */
declare function createUnsubscribeUrl(subscriberId: string, token?: string): string;
/**
 * Create a preference center URL
 */
declare function createPreferenceCenterUrl(subscriberId: string, token?: string): string;
/**
 * Inject open tracking pixel into HTML email
 */
declare function injectOpenTrackingPixel(html: string, recipientId: string, campaignId?: string): string;
/**
 * Rewrite all links in HTML for click tracking
 */
declare function rewriteLinksForTracking(html: string, recipientId: string, campaignId?: string, excludePatterns?: RegExp[]): string;
/**
 * Inject list-unsubscribe headers for email clients
 */
declare function getUnsubscribeHeaders(subscriberId: string, token?: string): Record<string, string>;
/**
 * Process HTML email for full tracking
 */
declare function processEmailForTracking(html: string, recipientId: string, options?: {
    campaignId?: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
    excludeLinkPatterns?: RegExp[];
}): string;
/**
 * Record an email open event
 */
declare function recordEmailOpen(recipientId: string, metadata?: {
    campaignId?: string;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void>;
/**
 * Record an email click event
 */
declare function recordEmailClick(recipientId: string, url: string, metadata?: {
    campaignId?: string;
    linkId?: string;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void>;
/**
 * Get or create a tracked link
 */
declare function getOrCreateTrackedLink(campaignId: string, targetUrl: string): Promise<string>;
/**
 * Rewrite links with database-tracked IDs
 */
declare function rewriteLinksWithTracking(html: string, recipientId: string, campaignId: string, excludePatterns?: RegExp[]): Promise<string>;

/**
 * Email Webhook Handlers
 *
 * Process bounce, complaint, and delivery events from email providers
 */

/**
 * Process an email webhook event
 */
declare function processEmailWebhookEvent(event: EmailWebhookEvent): Promise<void>;
/**
 * Parse SendGrid webhook event
 */
declare function parseSendGridWebhook(payload: unknown): EmailWebhookEvent[];
/**
 * Parse Mailgun webhook event
 */
declare function parseMailgunWebhook(payload: unknown): EmailWebhookEvent | null;
/**
 * Parse Resend webhook event
 */
declare function parseResendWebhook(payload: unknown): EmailWebhookEvent | null;
/**
 * Parse AWS SES webhook (via SNS)
 */
declare function parseSesWebhook(payload: unknown): EmailWebhookEvent | null;
/**
 * Verify SendGrid webhook signature
 */
declare function verifySendGridWebhook(payload: string, signature: string, timestamp: string, publicKey: string): boolean;
/**
 * Verify Mailgun webhook signature
 */
declare function verifyMailgunWebhook(timestamp: string, token: string, signature: string, apiKey: string): boolean;
/**
 * Verify Resend webhook signature
 */
declare function verifyResendWebhook(payload: string, signature: string, secret: string): boolean;

/**
 * Email Subscription Management
 *
 * Handles subscribe, unsubscribe, and preference management
 */
/**
 * Generate a secure token for subscription actions
 */
declare function generateSubscriptionToken(email: string): string;
/**
 * Verify a subscription token
 */
declare function verifySubscriptionToken(email: string, token: string, maxAgeMs?: number): boolean;
/**
 * Subscribe a new email address
 */
declare function subscribeEmail(email: string, options?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    source?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    doubleOptIn?: boolean;
    consentIp?: string;
}): Promise<{
    success: boolean;
    subscriber?: unknown;
    needsConfirmation?: boolean;
    error?: string;
}>;
/**
 * Confirm email subscription (double opt-in)
 */
declare function confirmSubscription(token: string): Promise<{
    success: boolean;
    subscriber?: unknown;
    error?: string;
}>;
/**
 * Unsubscribe an email address
 */
declare function unsubscribeEmail(email: string, options?: {
    token?: string;
    reason?: string;
    campaignId?: string;
}): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Unsubscribe by subscriber ID
 */
declare function unsubscribeById(subscriberId: string, options?: {
    token?: string;
    reason?: string;
    campaignId?: string;
}): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Get subscriber preferences
 */
declare function getSubscriberPreferences(subscriberIdOrEmail: string): Promise<{
    success: boolean;
    subscriber?: {
        id: string;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        status: string;
        tags: string[];
        preferences: Record<string, unknown>;
    };
    error?: string;
}>;
/**
 * Update subscriber preferences
 */
declare function updateSubscriberPreferences(subscriberIdOrEmail: string, preferences: {
    firstName?: string;
    lastName?: string;
    emailPreferences?: {
        marketing?: boolean;
        transactional?: boolean;
        productUpdates?: boolean;
        newsletter?: boolean;
        frequency?: 'daily' | 'weekly' | 'monthly';
    };
    tags?: string[];
}): Promise<{
    success: boolean;
    subscriber?: unknown;
    error?: string;
}>;
/**
 * Add tags to a subscriber
 */
declare function addSubscriberTags(subscriberIdOrEmail: string, tags: string[]): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Remove tags from a subscriber
 */
declare function removeSubscriberTags(subscriberIdOrEmail: string, tags: string[]): Promise<{
    success: boolean;
    error?: string;
}>;

/**
 * Email Queue Service
 *
 * Async email queue with retry logic, rate limiting, and batch processing.
 * Uses in-memory queue with optional database persistence for reliability.
 */

type EmailPriority = 'high' | 'normal' | 'low';
type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
interface QueuedEmail {
    id: string;
    message: EmailMessage;
    priority: EmailPriority;
    status: EmailStatus;
    attempts: number;
    maxAttempts: number;
    scheduledFor?: Date;
    lastAttemptAt?: Date;
    lastError?: string;
    createdAt: Date;
    sentAt?: Date;
    result?: EmailSendResult;
}
interface QueueOptions {
    /** Maximum concurrent sends */
    concurrency?: number;
    /** Rate limit: max emails per second */
    rateLimit?: number;
    /** Default max retry attempts */
    maxAttempts?: number;
    /** Base delay between retries in ms (doubles each attempt) */
    retryDelay?: number;
    /** Process interval in ms */
    processInterval?: number;
    /** Enable database persistence */
    persistToDb?: boolean;
}
interface EnqueueOptions {
    priority?: EmailPriority;
    maxAttempts?: number;
    scheduledFor?: Date;
    /** Unique key to prevent duplicates */
    deduplicationKey?: string;
}
interface QueueStats {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    total: number;
    averageProcessingTime?: number;
}
declare class EmailQueue {
    private queue;
    private processing;
    private deduplicationKeys;
    private isProcessing;
    private processTimer;
    private options;
    private lastSendTime;
    private sendCount;
    private totalProcessingTime;
    private processedCount;
    constructor(options?: QueueOptions);
    /**
     * Enqueue an email for sending
     */
    enqueue(message: EmailMessage, options?: EnqueueOptions): Promise<string>;
    /**
     * Enqueue multiple emails
     */
    enqueueBatch(messages: EmailMessage[], options?: EnqueueOptions): Promise<string[]>;
    /**
     * Get email status by ID
     */
    getStatus(id: string): QueuedEmail | undefined;
    /**
     * Cancel a pending email
     */
    cancel(id: string): boolean;
    /**
     * Get queue statistics
     */
    getStats(): QueueStats;
    /**
     * Start queue processing
     */
    start(): void;
    /**
     * Stop queue processing
     */
    stop(): void;
    /**
     * Clear completed/failed emails from queue
     */
    clear(options?: {
        keepPending?: boolean;
    }): number;
    /**
     * Retry failed emails
     */
    retryFailed(): Promise<number>;
    private generateId;
    private startProcessing;
    private scheduleProcess;
    private process;
    private getPendingEmails;
    private calculateRetryDelay;
    private processEmail;
    private persistEmail;
    private updatePersistedEmail;
    /**
     * Load pending emails from database on startup
     */
    loadFromDatabase(): Promise<number>;
}
declare function getEmailQueue(options?: QueueOptions): EmailQueue;
/**
 * Queue an email for async sending
 */
declare function queueEmail(message: EmailMessage, options?: EnqueueOptions): Promise<string>;
/**
 * Queue multiple emails for async sending
 */
declare function queueEmails(messages: EmailMessage[], options?: EnqueueOptions): Promise<string[]>;
/**
 * Queue a high-priority email
 */
declare function queueUrgentEmail(message: EmailMessage, options?: Omit<EnqueueOptions, 'priority'>): Promise<string>;
/**
 * Schedule an email for later
 */
declare function scheduleEmail(message: EmailMessage, sendAt: Date, options?: EnqueueOptions): Promise<string>;
/**
 * Get queue status
 */
declare function getQueueStats(): QueueStats;
/**
 * Check email status
 */
declare function checkEmailStatus(id: string): QueuedEmail | undefined;

/**
 * Email Service
 *
 * Multi-provider email sending abstraction with tracking support
 */

/**
 * Email Service Class
 */
declare class EmailService {
    private provider;
    private config;
    /**
     * Initialize with explicit configuration (for testing)
     */
    initWithConfig(providerType: EmailProvider, providerConfig: SmtpConfig | SendGridConfig | ResendConfig | MailgunConfig | SesConfig, serviceConfig: Partial<EmailServiceConfig>): void;
    /**
     * Get provider (lazy load from settings if not initialized)
     */
    private getProvider;
    /**
     * Send a single email
     */
    send(message: EmailMessage): Promise<EmailSendResult>;
    /**
     * Send email with merge tags
     */
    sendWithMergeTags(message: Omit<EmailMessage, 'subject' | 'html' | 'text'> & {
        subjectTemplate: string;
        htmlTemplate?: string;
        textTemplate?: string;
    }, data: MergeTagData): Promise<EmailSendResult>;
    /**
     * Send bulk emails
     */
    sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult>;
    /**
     * Send bulk emails with per-recipient merge tags
     */
    sendBulkWithMergeTags(message: Omit<BulkEmailMessage, 'subject' | 'html' | 'text'> & {
        subjectTemplate: string;
        htmlTemplate?: string;
        textTemplate?: string;
    }, recipientData: Map<string, MergeTagData>): Promise<BulkEmailResult>;
    /**
     * Verify provider configuration
     */
    verify(): Promise<boolean>;
    /**
     * Get current provider name
     */
    getProviderName(): Promise<EmailProvider>;
    /**
     * Close provider connections
     */
    close(): Promise<void>;
}
declare const emailService: EmailService;
declare function sendEmail(message: EmailMessage): Promise<EmailSendResult>;
declare function sendBulkEmail(message: BulkEmailMessage): Promise<BulkEmailResult>;
declare function sendEmailWithMergeTags(message: Omit<EmailMessage, 'subject' | 'html' | 'text'> & {
    subjectTemplate: string;
    htmlTemplate?: string;
    textTemplate?: string;
}, data: MergeTagData): Promise<EmailSendResult>;

/**
 * Encryption Utilities
 *
 * Provides AES-256-GCM encryption for storing sensitive data in the database
 */
/**
 * Encrypt a string value
 * Returns format: salt:iv:tag:encrypted (all hex encoded)
 */
declare function encrypt(plaintext: string): string;
/**
 * Decrypt an encrypted string
 * Expects format: salt:iv:tag:encrypted (all hex encoded)
 */
declare function decrypt(encryptedData: string): string;
/**
 * Check if a value is encrypted (matches our format)
 */
declare function isEncrypted(value: string): boolean;
/**
 * Safely encrypt - returns original if encryption fails
 */
declare function safeEncrypt(value: string): string;
/**
 * Safely decrypt - returns original if decryption fails
 */
declare function safeDecrypt(value: string): string;
/**
 * Hash a value (one-way, for comparison only)
 */
declare function hash(value: string): string;
/**
 * Verify a value against a hash
 */
declare function verifyHash(value: string, hashedValue: string): boolean;

/**
 * Form Builder Types
 */
type FormFieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'file' | 'url' | 'hidden' | 'rating' | 'range';
type ValidationRuleType = 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
interface ValidationRule {
    type: ValidationRuleType;
    value?: string | number;
    message: string;
}
interface FieldOption {
    value: string;
    label: string;
}
interface FieldCondition {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty';
    value?: string | number | boolean;
}
interface FormField {
    id: string;
    name: string;
    type: FormFieldType;
    label: string;
    placeholder?: string;
    description?: string;
    defaultValue?: string | number | boolean | string[];
    options?: FieldOption[];
    validation?: ValidationRule[];
    conditions?: FieldCondition[];
    width?: 'full' | 'half' | 'third';
    rows?: number;
    accept?: string;
    min?: number;
    max?: number;
    step?: number;
}
interface FormDefinition {
    id: string;
    name: string;
    slug: string;
    description?: string;
    fields: FormField[];
    settings: FormSettings;
    createdAt: string;
    updatedAt: string;
}
interface FormSettings {
    submitButtonText: string;
    successMessage: string;
    redirectUrl?: string;
    notifyEmails: string[];
    captchaEnabled: boolean;
    storeSubmissions: boolean;
    limitSubmissions?: number;
    closeAfterDate?: string;
}
interface FormSubmissionData {
    formId: string;
    data: Record<string, any>;
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        referrer?: string;
        timestamp: string;
    };
}
interface FormSubmissionResponse {
    success: boolean;
    message: string;
    submissionId?: string;
    redirectUrl?: string;
    errors?: Record<string, string>;
}
declare const FIELD_TEMPLATES: Record<string, Partial<FormField>>;
declare const DEFAULT_FORM_SETTINGS: FormSettings;

/**
 * Form Builder Library
 *
 * Provides form creation, validation, and submission handling
 */

/**
 * Create a new form
 */
declare function createForm(name: string, fields: FormField[], settings?: Partial<FormSettings>): Promise<FormDefinition>;
/**
 * Get form by ID or slug
 */
declare function getForm(idOrSlug: string): Promise<FormDefinition | null>;
/**
 * Update a form
 */
declare function updateForm(id: string, data: {
    name?: string;
    description?: string;
    fields?: FormField[];
    settings?: Partial<FormSettings>;
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}): Promise<FormDefinition>;
/**
 * Delete a form
 */
declare function deleteForm(id: string): Promise<void>;
/**
 * Validate form data against field definitions
 */
declare function validateFormData(fields: FormField[], data: Record<string, any>): {
    valid: boolean;
    errors: Record<string, string>;
};
/**
 * Submit form data
 */
declare function submitForm(submission: FormSubmissionData): Promise<FormSubmissionResponse>;
/**
 * Get form submissions
 */
declare function getFormSubmissions(formId: string, options?: {
    limit?: number;
    offset?: number;
    starred?: boolean;
    read?: boolean;
}): Promise<{
    submissions: Array<{
        id: string;
        data: Record<string, any>;
        createdAt: string;
        read: boolean;
        starred: boolean;
    }>;
    total: number;
}>;
/**
 * Mark submission as read
 */
declare function markSubmissionRead(submissionId: string, read?: boolean): Promise<void>;
/**
 * Star/unstar submission
 */
declare function starSubmission(submissionId: string, starred?: boolean): Promise<void>;
/**
 * Delete submission
 */
declare function deleteSubmission(submissionId: string): Promise<void>;

/**
 * Inventory Management Service
 *
 * Handles stock alerts, back-in-stock subscriptions, and stock reservations
 */
interface LowStockProduct {
    id: string;
    title: string;
    sku: string | null;
    stock: number;
    lowStockThreshold: number;
    variantId?: string;
    variantTitle?: string;
}
interface StockReservationResult {
    success: boolean;
    reservationId?: string;
    error?: string;
}
/**
 * Find all products and variants below their low stock threshold
 */
declare function getLowStockItems(): Promise<LowStockProduct[]>;
/**
 * Send low stock alert email to admin
 */
declare function sendLowStockAlert(items: LowStockProduct[]): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Subscribe an email to back-in-stock notifications for a product
 */
declare function subscribeToBackInStock(email: string, productId: string, variantId?: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Unsubscribe from back-in-stock notifications
 */
declare function unsubscribeFromBackInStock(email: string, productId: string, variantId?: string): Promise<{
    success: boolean;
}>;
/**
 * Send back-in-stock notifications for a product that's now in stock
 */
declare function sendBackInStockNotifications(productId: string, variantId?: string): Promise<{
    sent: number;
    errors: number;
}>;
/**
 * Check if a product is back in stock and send notifications
 * Call this when updating stock levels
 */
declare function checkAndNotifyBackInStock(productId: string, variantId: string | undefined, newStock: number): Promise<void>;
/**
 * Reserve stock for a checkout session
 */
declare function reserveStock(productId: string, quantity: number, sessionId: string, variantId?: string, reservationMinutes?: number): Promise<StockReservationResult>;
/**
 * Release a stock reservation (cart cleared, session expired, etc.)
 */
declare function releaseReservation(reservationId: string): Promise<boolean>;
/**
 * Release all reservations for a session
 */
declare function releaseSessionReservations(sessionId: string): Promise<number>;
/**
 * Convert reservations to order (when order is created)
 * Links reservations to order and makes them permanent
 */
declare function convertReservationsToOrder(sessionId: string, orderId: string): Promise<number>;
/**
 * Deduct stock when order is confirmed/paid
 * Releases reservations after deducting actual stock
 */
declare function deductStockForOrder(orderId: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Cleanup expired reservations
 * Run this periodically (e.g., every 5 minutes)
 */
declare function cleanupExpiredReservations(): Promise<number>;
/**
 * Get available stock for a product (accounting for reservations)
 */
declare function getAvailableStock(productId: string, variantId?: string): Promise<number>;

/**
 * Media Library - Core CRUD Operations
 */

declare function listMedia(filters?: MediaFilters): Promise<MediaListResponse>;
declare function getMedia(id: string, includeUsage?: boolean): Promise<MediaWithRelations | null>;
declare function createMedia(input: MediaCreateInput): Promise<MediaWithRelations>;
declare function updateMedia(id: string, input: MediaUpdateInput): Promise<MediaWithRelations>;
declare function deleteMedia(id: string, hard?: boolean): Promise<void>;
declare function restoreMedia(id: string): Promise<MediaWithRelations>;
declare function bulkDeleteMedia(ids: string[], hard?: boolean): Promise<number>;
declare function bulkMoveMedia(ids: string[], folderId: string | null): Promise<number>;
declare function bulkTagMedia(ids: string[], tagIds: string[]): Promise<number>;
declare function bulkUntagMedia(ids: string[], tagIds: string[]): Promise<number>;
declare function bulkRestoreMedia(ids: string[]): Promise<number>;
declare function getMediaStats(): Promise<{
    total: number;
    totalSize: number;
    recentCount: number;
    byType: {
        image: number;
        video: number;
        audio: number;
        document: number;
        other: number;
    };
}>;

/**
 * Notification Types
 */
type NotificationType = 'order_confirmation' | 'shipping_notification' | 'delivery_confirmation' | 'refund_notification' | 'cart_abandonment' | 'password_reset' | 'welcome';
interface NotificationPreferences {
    userId: string;
    orderConfirmation: boolean;
    shippingUpdates: boolean;
    deliveryConfirmation: boolean;
    promotionalEmails: boolean;
    newsletterEmails: boolean;
}
interface NotificationLog {
    id: string;
    type: NotificationType;
    recipientEmail: string;
    recipientName?: string;
    orderId?: string;
    shipmentId?: string;
    messageId?: string;
    status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
    error?: string;
    sentAt: Date;
    openedAt?: Date;
    clickedAt?: Date;
}

/**
 * Transactional Notifications Service
 *
 * Sends order lifecycle emails by fetching order data and using email templates.
 * Integrates with Stripe/Shippo webhooks for automatic notifications.
 *
 * Supports Puck-editable templates - falls back to hardcoded templates if not found.
 */
interface NotificationResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
/**
 * Send order confirmation email
 */
declare function sendOrderConfirmation(orderId: string): Promise<NotificationResult>;
/**
 * Send shipping notification email
 */
declare function sendShippingNotification(orderId: string, shipmentId: string): Promise<NotificationResult>;
/**
 * Send delivery confirmation email
 */
declare function sendDeliveryConfirmation(orderId: string, shipmentId: string): Promise<NotificationResult>;
/**
 * Send refund notification email
 */
declare function sendRefundNotification(orderId: string, refundAmount: number, // In cents
refundReason?: string, isFullRefund?: boolean): Promise<NotificationResult>;

/**
 * Permission Constants
 * Defines all available permissions in the system
 */
declare const PERMISSIONS: {
    readonly PRODUCTS_VIEW: "products.view";
    readonly PRODUCTS_CREATE: "products.create";
    readonly PRODUCTS_EDIT: "products.edit";
    readonly PRODUCTS_DELETE: "products.delete";
    readonly PRODUCTS_PUBLISH: "products.publish";
    readonly PRODUCTS_ALL: "products.*";
    readonly VARIANTS_VIEW: "variants.view";
    readonly VARIANTS_CREATE: "variants.create";
    readonly VARIANTS_EDIT: "variants.edit";
    readonly VARIANTS_DELETE: "variants.delete";
    readonly VARIANTS_ALL: "variants.*";
    readonly ORDERS_VIEW: "orders.view";
    readonly ORDERS_CREATE: "orders.create";
    readonly ORDERS_EDIT: "orders.edit";
    readonly ORDERS_DELETE: "orders.delete";
    readonly ORDERS_FULFILL: "orders.fulfill";
    readonly ORDERS_REFUND: "orders.refund";
    readonly ORDERS_CANCEL: "orders.cancel";
    readonly ORDERS_ALL: "orders.*";
    readonly INVENTORY_VIEW: "inventory.view";
    readonly INVENTORY_EDIT: "inventory.edit";
    readonly INVENTORY_ALL: "inventory.*";
    readonly CUSTOMERS_VIEW: "customers.view";
    readonly CUSTOMERS_CREATE: "customers.create";
    readonly CUSTOMERS_EDIT: "customers.edit";
    readonly CUSTOMERS_DELETE: "customers.delete";
    readonly CUSTOMERS_EXPORT: "customers.export";
    readonly CUSTOMERS_ALL: "customers.*";
    readonly PAGES_VIEW: "pages.view";
    readonly PAGES_CREATE: "pages.create";
    readonly PAGES_EDIT: "pages.edit";
    readonly PAGES_DELETE: "pages.delete";
    readonly PAGES_PUBLISH: "pages.publish";
    readonly PAGES_ALL: "pages.*";
    readonly PUCK_TEMPLATES_VIEW: "puck_templates.view";
    readonly PUCK_TEMPLATES_CREATE: "puck_templates.create";
    readonly PUCK_TEMPLATES_EDIT: "puck_templates.edit";
    readonly PUCK_TEMPLATES_DELETE: "puck_templates.delete";
    readonly PUCK_TEMPLATES_ALL: "puck_templates.*";
    readonly ROUTES_VIEW: "routes.view";
    readonly ROUTES_CREATE: "routes.create";
    readonly ROUTES_EDIT: "routes.edit";
    readonly ROUTES_DELETE: "routes.delete";
    readonly ROUTES_ALL: "routes.*";
    readonly BLOG_VIEW: "blog.view";
    readonly BLOG_CREATE: "blog.create";
    readonly BLOG_EDIT: "blog.edit";
    readonly BLOG_DELETE: "blog.delete";
    readonly BLOG_PUBLISH: "blog.publish";
    readonly BLOG_ALL: "blog.*";
    readonly MEDIA_VIEW: "media.view";
    readonly MEDIA_UPLOAD: "media.upload";
    readonly MEDIA_EDIT: "media.edit";
    readonly MEDIA_DELETE: "media.delete";
    readonly MEDIA_ALL: "media.*";
    readonly CATEGORIES_VIEW: "categories.view";
    readonly CATEGORIES_CREATE: "categories.create";
    readonly CATEGORIES_EDIT: "categories.edit";
    readonly CATEGORIES_DELETE: "categories.delete";
    readonly CATEGORIES_ALL: "categories.*";
    readonly CUSTOM_FIELDS_VIEW: "custom_fields.view";
    readonly CUSTOM_FIELDS_CREATE: "custom_fields.create";
    readonly CUSTOM_FIELDS_EDIT: "custom_fields.edit";
    readonly CUSTOM_FIELDS_DELETE: "custom_fields.delete";
    readonly CUSTOM_FIELDS_ALL: "custom_fields.*";
    readonly SETTINGS_VIEW: "settings.view";
    readonly SETTINGS_GENERAL: "settings.general";
    readonly SETTINGS_PAYMENTS: "settings.payments";
    readonly SETTINGS_SHIPPING: "settings.shipping";
    readonly SETTINGS_TAXES: "settings.taxes";
    readonly SETTINGS_EMAIL: "settings.email";
    readonly SETTINGS_STORAGE: "settings.storage";
    readonly SETTINGS_AI: "settings.ai";
    readonly SETTINGS_ALL: "settings.*";
    readonly USERS_VIEW: "users.view";
    readonly USERS_CREATE: "users.create";
    readonly USERS_EDIT: "users.edit";
    readonly USERS_DELETE: "users.delete";
    readonly USERS_ROLES: "users.roles";
    readonly USERS_PERMISSIONS: "users.permissions";
    readonly USERS_ALL: "users.*";
    readonly ROLES_VIEW: "roles.view";
    readonly ROLES_CREATE: "roles.create";
    readonly ROLES_EDIT: "roles.edit";
    readonly ROLES_DELETE: "roles.delete";
    readonly ROLES_ALL: "roles.*";
    readonly ANALYTICS_VIEW: "analytics.view";
    readonly ANALYTICS_EXPORT: "analytics.export";
    readonly ANALYTICS_ALL: "analytics.*";
    readonly PLUGINS_VIEW: "plugins.view";
    readonly PLUGINS_INSTALL: "plugins.install";
    readonly PLUGINS_CONFIGURE: "plugins.configure";
    readonly PLUGINS_DELETE: "plugins.delete";
    readonly PLUGINS_ALL: "plugins.*";
    readonly WORKFLOWS_VIEW: "workflows.view";
    readonly WORKFLOWS_CREATE: "workflows.create";
    readonly WORKFLOWS_EDIT: "workflows.edit";
    readonly WORKFLOWS_DELETE: "workflows.delete";
    readonly WORKFLOWS_EXECUTE: "workflows.execute";
    readonly WORKFLOWS_ALL: "workflows.*";
    readonly FORMS_VIEW: "forms.view";
    readonly FORMS_CREATE: "forms.create";
    readonly FORMS_EDIT: "forms.edit";
    readonly FORMS_DELETE: "forms.delete";
    readonly FORMS_SUBMISSIONS: "forms.submissions";
    readonly FORMS_ALL: "forms.*";
    readonly EMAIL_VIEW: "email.view";
    readonly EMAIL_CREATE: "email.create";
    readonly EMAIL_EDIT: "email.edit";
    readonly EMAIL_DELETE: "email.delete";
    readonly EMAIL_SEND: "email.send";
    readonly EMAIL_ALL: "email.*";
    readonly AUDIT_VIEW: "audit.view";
    readonly SUPER_ADMIN: "*";
};
type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
declare const PERMISSION_GROUPS: {
    readonly products: {
        readonly label: "Products";
        readonly permissions: readonly [{
            readonly key: "products.view";
            readonly label: "View products";
        }, {
            readonly key: "products.create";
            readonly label: "Create products";
        }, {
            readonly key: "products.edit";
            readonly label: "Edit products";
        }, {
            readonly key: "products.delete";
            readonly label: "Delete products";
        }, {
            readonly key: "products.publish";
            readonly label: "Publish/unpublish products";
        }];
    };
    readonly variants: {
        readonly label: "Product Variants";
        readonly permissions: readonly [{
            readonly key: "variants.view";
            readonly label: "View variants";
        }, {
            readonly key: "variants.create";
            readonly label: "Create variants";
        }, {
            readonly key: "variants.edit";
            readonly label: "Edit variants";
        }, {
            readonly key: "variants.delete";
            readonly label: "Delete variants";
        }];
    };
    readonly orders: {
        readonly label: "Orders";
        readonly permissions: readonly [{
            readonly key: "orders.view";
            readonly label: "View orders";
        }, {
            readonly key: "orders.create";
            readonly label: "Create orders";
        }, {
            readonly key: "orders.edit";
            readonly label: "Edit orders";
        }, {
            readonly key: "orders.delete";
            readonly label: "Delete orders";
        }, {
            readonly key: "orders.fulfill";
            readonly label: "Fulfill orders";
        }, {
            readonly key: "orders.refund";
            readonly label: "Process refunds";
        }, {
            readonly key: "orders.cancel";
            readonly label: "Cancel orders";
        }];
    };
    readonly inventory: {
        readonly label: "Inventory";
        readonly permissions: readonly [{
            readonly key: "inventory.view";
            readonly label: "View inventory";
        }, {
            readonly key: "inventory.edit";
            readonly label: "Edit inventory";
        }];
    };
    readonly customers: {
        readonly label: "Customers";
        readonly permissions: readonly [{
            readonly key: "customers.view";
            readonly label: "View customers";
        }, {
            readonly key: "customers.create";
            readonly label: "Create customers";
        }, {
            readonly key: "customers.edit";
            readonly label: "Edit customers";
        }, {
            readonly key: "customers.delete";
            readonly label: "Delete customers";
        }, {
            readonly key: "customers.export";
            readonly label: "Export customer data";
        }];
    };
    readonly pages: {
        readonly label: "Pages";
        readonly permissions: readonly [{
            readonly key: "pages.view";
            readonly label: "View pages";
        }, {
            readonly key: "pages.create";
            readonly label: "Create pages";
        }, {
            readonly key: "pages.edit";
            readonly label: "Edit pages";
        }, {
            readonly key: "pages.delete";
            readonly label: "Delete pages";
        }, {
            readonly key: "pages.publish";
            readonly label: "Publish pages";
        }];
    };
    readonly puck_templates: {
        readonly label: "Page Templates";
        readonly permissions: readonly [{
            readonly key: "puck_templates.view";
            readonly label: "View templates";
        }, {
            readonly key: "puck_templates.create";
            readonly label: "Create templates";
        }, {
            readonly key: "puck_templates.edit";
            readonly label: "Edit templates";
        }, {
            readonly key: "puck_templates.delete";
            readonly label: "Delete templates";
        }];
    };
    readonly routes: {
        readonly label: "Route Configuration";
        readonly permissions: readonly [{
            readonly key: "routes.view";
            readonly label: "View routes";
        }, {
            readonly key: "routes.create";
            readonly label: "Create routes";
        }, {
            readonly key: "routes.edit";
            readonly label: "Edit routes";
        }, {
            readonly key: "routes.delete";
            readonly label: "Delete routes";
        }];
    };
    readonly blog: {
        readonly label: "Blog";
        readonly permissions: readonly [{
            readonly key: "blog.view";
            readonly label: "View blog posts";
        }, {
            readonly key: "blog.create";
            readonly label: "Create blog posts";
        }, {
            readonly key: "blog.edit";
            readonly label: "Edit blog posts";
        }, {
            readonly key: "blog.delete";
            readonly label: "Delete blog posts";
        }, {
            readonly key: "blog.publish";
            readonly label: "Publish blog posts";
        }];
    };
    readonly media: {
        readonly label: "Media";
        readonly permissions: readonly [{
            readonly key: "media.view";
            readonly label: "View media";
        }, {
            readonly key: "media.upload";
            readonly label: "Upload media";
        }, {
            readonly key: "media.edit";
            readonly label: "Edit media";
        }, {
            readonly key: "media.delete";
            readonly label: "Delete media";
        }];
    };
    readonly categories: {
        readonly label: "Categories";
        readonly permissions: readonly [{
            readonly key: "categories.view";
            readonly label: "View categories";
        }, {
            readonly key: "categories.create";
            readonly label: "Create categories";
        }, {
            readonly key: "categories.edit";
            readonly label: "Edit categories";
        }, {
            readonly key: "categories.delete";
            readonly label: "Delete categories";
        }];
    };
    readonly settings: {
        readonly label: "Settings";
        readonly permissions: readonly [{
            readonly key: "settings.view";
            readonly label: "View settings";
        }, {
            readonly key: "settings.general";
            readonly label: "General settings";
        }, {
            readonly key: "settings.payments";
            readonly label: "Payment settings";
        }, {
            readonly key: "settings.shipping";
            readonly label: "Shipping settings";
        }, {
            readonly key: "settings.taxes";
            readonly label: "Tax settings";
        }, {
            readonly key: "settings.email";
            readonly label: "Email settings";
        }, {
            readonly key: "settings.storage";
            readonly label: "Storage settings";
        }, {
            readonly key: "settings.ai";
            readonly label: "AI settings";
        }];
    };
    readonly users: {
        readonly label: "User Management";
        readonly permissions: readonly [{
            readonly key: "users.view";
            readonly label: "View users";
        }, {
            readonly key: "users.create";
            readonly label: "Create users";
        }, {
            readonly key: "users.edit";
            readonly label: "Edit users";
        }, {
            readonly key: "users.delete";
            readonly label: "Delete users";
        }, {
            readonly key: "users.roles";
            readonly label: "Manage user roles";
        }, {
            readonly key: "users.permissions";
            readonly label: "Manage user permissions";
        }];
    };
    readonly roles: {
        readonly label: "Role Management";
        readonly permissions: readonly [{
            readonly key: "roles.view";
            readonly label: "View roles";
        }, {
            readonly key: "roles.create";
            readonly label: "Create roles";
        }, {
            readonly key: "roles.edit";
            readonly label: "Edit roles";
        }, {
            readonly key: "roles.delete";
            readonly label: "Delete roles";
        }];
    };
    readonly analytics: {
        readonly label: "Analytics";
        readonly permissions: readonly [{
            readonly key: "analytics.view";
            readonly label: "View analytics";
        }, {
            readonly key: "analytics.export";
            readonly label: "Export analytics";
        }];
    };
    readonly plugins: {
        readonly label: "Plugins";
        readonly permissions: readonly [{
            readonly key: "plugins.view";
            readonly label: "View plugins";
        }, {
            readonly key: "plugins.install";
            readonly label: "Install plugins";
        }, {
            readonly key: "plugins.configure";
            readonly label: "Configure plugins";
        }, {
            readonly key: "plugins.delete";
            readonly label: "Delete plugins";
        }];
    };
    readonly workflows: {
        readonly label: "Workflows";
        readonly permissions: readonly [{
            readonly key: "workflows.view";
            readonly label: "View workflows";
        }, {
            readonly key: "workflows.create";
            readonly label: "Create workflows";
        }, {
            readonly key: "workflows.edit";
            readonly label: "Edit workflows";
        }, {
            readonly key: "workflows.delete";
            readonly label: "Delete workflows";
        }, {
            readonly key: "workflows.execute";
            readonly label: "Execute workflows";
        }];
    };
    readonly forms: {
        readonly label: "Forms";
        readonly permissions: readonly [{
            readonly key: "forms.view";
            readonly label: "View forms";
        }, {
            readonly key: "forms.create";
            readonly label: "Create forms";
        }, {
            readonly key: "forms.edit";
            readonly label: "Edit forms";
        }, {
            readonly key: "forms.delete";
            readonly label: "Delete forms";
        }, {
            readonly key: "forms.submissions";
            readonly label: "View submissions";
        }];
    };
    readonly email: {
        readonly label: "Email Campaigns";
        readonly permissions: readonly [{
            readonly key: "email.view";
            readonly label: "View campaigns";
        }, {
            readonly key: "email.create";
            readonly label: "Create campaigns";
        }, {
            readonly key: "email.edit";
            readonly label: "Edit campaigns";
        }, {
            readonly key: "email.delete";
            readonly label: "Delete campaigns";
        }, {
            readonly key: "email.send";
            readonly label: "Send campaigns";
        }];
    };
    readonly audit: {
        readonly label: "Audit Log";
        readonly permissions: readonly [{
            readonly key: "audit.view";
            readonly label: "View audit log";
        }];
    };
};
declare const BUILT_IN_ROLES: {
    readonly super_admin: {
        readonly name: "super_admin";
        readonly displayName: "Super Admin";
        readonly description: "Full access to all features and settings";
        readonly permissions: readonly ["*"];
        readonly isSystem: true;
        readonly position: 0;
    };
    readonly store_manager: {
        readonly name: "store_manager";
        readonly displayName: "Store Manager";
        readonly description: "Manage products, orders, inventory, and customers";
        readonly permissions: readonly ["products.*", "variants.*", "orders.*", "inventory.*", "customers.view", "customers.edit", "categories.*", "media.view", "media.upload", "analytics.view"];
        readonly isSystem: true;
        readonly position: 1;
    };
    readonly content_editor: {
        readonly name: "content_editor";
        readonly displayName: "Content Editor";
        readonly description: "Manage pages, blog posts, and media";
        readonly permissions: readonly ["pages.*", "blog.*", "media.*", "categories.view", "categories.edit"];
        readonly isSystem: true;
        readonly position: 2;
    };
    readonly order_fulfiller: {
        readonly name: "order_fulfiller";
        readonly displayName: "Order Fulfiller";
        readonly description: "View and fulfill orders";
        readonly permissions: readonly ["orders.view", "orders.fulfill", "inventory.view", "customers.view"];
        readonly isSystem: true;
        readonly position: 3;
    };
    readonly support_staff: {
        readonly name: "support_staff";
        readonly displayName: "Support Staff";
        readonly description: "View orders and manage customer inquiries";
        readonly permissions: readonly ["orders.view", "customers.view", "customers.edit"];
        readonly isSystem: true;
        readonly position: 4;
    };
};
type BuiltInRoleName = keyof typeof BUILT_IN_ROLES;

/**
 * Permission System Types
 */

interface UserWithPermissions {
    id: string;
    email: string;
    name: string | null;
    permissions: Set<string>;
    roles: RoleData[];
    overrides: PermissionOverride[];
}
interface RoleData {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    permissions: string[];
    isSystem: boolean;
}
interface PermissionOverride {
    id: string;
    permission: string;
    type: 'GRANT' | 'DENY';
    expiresAt: Date | null;
    reason: string | null;
}
interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
    source?: {
        type: 'role' | 'override' | 'super_admin';
        id?: string;
        name?: string;
    };
}
type AuditAction = 'role.create' | 'role.update' | 'role.delete' | 'role.assign' | 'role.remove' | 'permission.grant' | 'permission.deny' | 'permission.remove' | 'user.create' | 'user.update' | 'user.delete' | 'page.create' | 'page.update' | 'page.delete' | 'route.create' | 'route.update' | 'route.delete' | 'puck_template.create' | 'puck_template.update' | 'puck_template.delete';
interface AuditLogEntry {
    id: string;
    userId: string | null;
    userEmail: string | null;
    action: AuditAction;
    targetType: string | null;
    targetId: string | null;
    details: Record<string, unknown>;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
}
interface AssignRoleRequest {
    userId: string;
    roleId: string;
}
interface RemoveRoleRequest {
    userId: string;
    roleId: string;
}
interface GrantPermissionRequest {
    userId: string;
    permission: Permission | string;
    expiresAt?: Date | string;
    reason?: string;
}
interface DenyPermissionRequest {
    userId: string;
    permission: Permission | string;
    expiresAt?: Date | string;
    reason?: string;
}
interface RemovePermissionOverrideRequest {
    userId: string;
    permission: Permission | string;
}
interface CreateRoleRequest {
    name: string;
    displayName: string;
    description?: string;
    permissions: string[];
    position?: number;
}
interface UpdateRoleRequest {
    displayName?: string;
    description?: string;
    permissions?: string[];
    position?: number;
}
interface RoleWithAssignments extends RoleData {
    _count: {
        assignments: number;
    };
}
interface UserPermissionSummary {
    userId: string;
    email: string;
    name: string | null;
    roles: Array<{
        id: string;
        name: string;
        displayName: string;
    }>;
    overrides: PermissionOverride[];
    effectivePermissions: string[];
}

/**
 * Permission Checking Utilities
 * Core RBAC logic for checking user permissions
 */

/**
 * Get a user's complete permission set (roles + overrides)
 */
declare function getUserPermissions(userId: string): Promise<UserWithPermissions | null>;
/**
 * Check if user has a specific permission
 */
declare function hasPermission(userId: string, permission: string): Promise<PermissionCheckResult>;
/**
 * Check permission against a pre-loaded user permission set
 * (Use this in loops to avoid repeated DB queries)
 */
declare function checkPermission(userPerms: UserWithPermissions, requiredPermission: string): PermissionCheckResult;
/**
 * Check multiple permissions at once
 * Returns true only if ALL permissions are granted
 */
declare function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean>;
/**
 * Check multiple permissions at once
 * Returns true if ANY permission is granted
 */
declare function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean>;
/**
 * Check if user is a super admin
 */
declare function isSuperAdmin(userId: string): Promise<boolean>;
/**
 * Log an audit event
 */
declare function logAuditEvent(params: {
    userId?: string;
    userEmail?: string;
    action: AuditAction;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void>;
/**
 * Seed built-in roles (run on app startup or migration)
 */
declare function seedBuiltInRoles(): Promise<void>;
/**
 * Assign a role to a user
 */
declare function assignRole(params: {
    userId: string;
    roleId: string;
    assignedBy?: string;
}): Promise<void>;
/**
 * Remove a role from a user
 */
declare function removeRole(params: {
    userId: string;
    roleId: string;
    removedBy?: string;
}): Promise<void>;
/**
 * Grant a permission override to a user
 */
declare function grantPermission(params: {
    userId: string;
    permission: string;
    expiresAt?: Date;
    reason?: string;
    grantedBy?: string;
}): Promise<void>;
/**
 * Deny a permission override to a user
 */
declare function denyPermission(params: {
    userId: string;
    permission: string;
    expiresAt?: Date;
    reason?: string;
    deniedBy?: string;
}): Promise<void>;
/**
 * Remove a permission override from a user
 */
declare function removePermissionOverride(params: {
    userId: string;
    permission: string;
    removedBy?: string;
}): Promise<void>;

/**
 * Order Workflow Types
 *
 * Type definitions for the order progress management system
 */
type ShippoTrackingEvent = 'PRE_TRANSIT' | 'TRANSIT' | 'DELIVERED' | 'RETURNED' | 'FAILURE' | 'UNKNOWN';
interface WorkflowStageInput {
    name: string;
    slug: string;
    displayName: string;
    customerMessage?: string;
    icon?: string;
    color?: string;
    position: number;
    isTerminal?: boolean;
    notifyCustomer?: boolean;
    estimatedDuration?: number;
    shippoEventTrigger?: ShippoTrackingEvent | null;
}
interface WorkflowCreateInput {
    name: string;
    slug: string;
    description?: string;
    isDefault?: boolean;
    isActive?: boolean;
    enableShippoSync?: boolean;
    stages?: WorkflowStageInput[];
}
interface WorkflowUpdateInput {
    name?: string;
    slug?: string;
    description?: string;
    isDefault?: boolean;
    isActive?: boolean;
    enableShippoSync?: boolean;
}
interface WorkflowWithStages {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isDefault: boolean;
    isActive: boolean;
    enableShippoSync: boolean;
    createdAt: Date;
    updatedAt: Date;
    stages: WorkflowStage[];
}
interface WorkflowStage {
    id: string;
    workflowId: string;
    name: string;
    slug: string;
    displayName: string;
    customerMessage: string | null;
    icon: string | null;
    color: string | null;
    position: number;
    isTerminal: boolean;
    notifyCustomer: boolean;
    estimatedDuration: number | null;
    shippoEventTrigger: string | null;
    createdAt: Date;
    updatedAt: Date;
}
interface WorkflowTemplate$1 {
    name: string;
    slug: string;
    description: string;
    enableShippoSync: boolean;
    stages: WorkflowStageInput[];
}
declare const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate$1[];

/**
 * Order Workflows - Core CRUD Operations
 *
 * Manage order workflow templates and stages
 */

/**
 * List all workflows
 */
declare function listWorkflows(includeInactive?: boolean): Promise<WorkflowWithStages[]>;
/**
 * Get a single workflow by ID or slug
 */
declare function getWorkflow(idOrSlug: string): Promise<WorkflowWithStages | null>;
/**
 * Get the default workflow
 */
declare function getDefaultWorkflow(): Promise<WorkflowWithStages | null>;
/**
 * Create a new workflow with stages
 */
declare function createWorkflow(input: WorkflowCreateInput): Promise<WorkflowWithStages>;
/**
 * Update a workflow
 */
declare function updateWorkflow(id: string, input: WorkflowUpdateInput): Promise<WorkflowWithStages>;
/**
 * Delete a workflow
 */
declare function deleteWorkflow(id: string): Promise<void>;
/**
 * Duplicate a workflow
 */
declare function duplicateWorkflow(id: string, newName: string, newSlug: string): Promise<WorkflowWithStages>;
/**
 * Assign a workflow to an order
 */
declare function assignWorkflowToOrder(orderId: string, workflowId: string | null): Promise<void>;
/**
 * Initialize workflow for a new order
 */
declare function initializeOrderWorkflow(orderId: string): Promise<void>;

/**
 * Plugin System Types
 *
 * Core type definitions for the self-extending agent architecture.
 * Inspired by vmcp (Virtual Model Context Protocol) patterns.
 */
/**
 * JSON Schema types for input validation
 */
interface JSONSchemaProperty {
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
    description?: string;
    enum?: string[];
    items?: JSONSchemaProperty;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
    default?: unknown;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
}
interface JSONSchema {
    type: 'object';
    properties: Record<string, JSONSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean;
}
/**
 * Primitive - Atomic unit of tool definition
 *
 * This is the core data structure representing a dynamic tool.
 * Compatible with MCP tool definitions for AI agent integration.
 */
interface PrimitiveDefinition {
    id: string;
    name: string;
    version: string;
    description: string;
    inputSchema: JSONSchema;
    handler: string;
    dependencies?: string[];
    author?: string;
    tags?: string[];
    tier?: 'FREE' | 'PROPRIETARY';
    category?: string;
    icon?: string;
    timeout?: number;
    memory?: number;
    sandbox?: boolean;
    enabled?: boolean;
    builtIn?: boolean;
    pluginId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Mounted Primitive - A primitive that is currently active and available
 */
interface MountedPrimitive {
    definition: PrimitiveDefinition;
    mountedAt: number;
    config?: Record<string, unknown>;
    invocationCount: number;
    lastInvoked?: number;
    compiledHandler?: Function;
}
/**
 * Plugin - Collection of primitives forming a feature unit
 */
interface PluginDefinition {
    id: string;
    name: string;
    slug: string;
    description?: string;
    version: string;
    icon?: string;
    color?: string;
    config?: Record<string, unknown>;
    configSchema?: JSONSchema;
    enabled?: boolean;
    installed?: boolean;
    builtIn?: boolean;
    author?: string;
    authorUrl?: string;
    repository?: string;
    createdAt?: Date;
    updatedAt?: Date;
    installedAt?: Date;
}
/**
 * Workflow - Visual composition of primitives
 */
interface WorkflowDefinition {
    id: string;
    name: string;
    slug: string;
    description?: string;
    nodes: WorkflowNodeData$1[];
    edges: WorkflowEdgeData$1[];
    viewport?: {
        x: number;
        y: number;
        zoom: number;
    };
    config?: Record<string, unknown>;
    variables?: Record<string, unknown>;
    triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';
    triggerConfig?: Record<string, unknown>;
    enabled?: boolean;
    pluginId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    lastRunAt?: Date;
}
/**
 * Workflow Node Data - React Flow node structure
 */
interface WorkflowNodeData$1 {
    id: string;
    type: 'primitive' | 'trigger' | 'condition' | 'loop' | 'output';
    position: {
        x: number;
        y: number;
    };
    data: {
        label?: string;
        primitiveId?: string;
        config?: Record<string, unknown>;
        inputMappings?: Record<string, string>;
    };
}
/**
 * Workflow Edge Data - React Flow edge structure
 */
interface WorkflowEdgeData$1 {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    data?: {
        condition?: string;
        label?: string;
    };
}
/**
 * Execution Context - Passed to primitive handlers
 */
interface ExecutionContext$1 {
    primitiveId: string;
    primitiveName: string;
    invocationId: string;
    startTime: number;
    timeout?: number;
    config?: Record<string, unknown>;
    debug?: boolean;
    workflowExecutionId?: string;
    workflowVariables?: Record<string, unknown>;
    userId?: string;
    agentId?: string;
    platform?: {
        os: 'windows' | 'mac' | 'linux';
        isWSL: boolean;
        arch: string;
    };
}
/**
 * Execution Result
 */
interface ExecutionResult {
    success: boolean;
    result?: unknown;
    error?: string;
    executionTime: number;
    invocationId?: string;
}
/**
 * Primitive Info - Simplified for listings
 */
interface PrimitiveInfo {
    id: string;
    name: string;
    description: string;
    version: string;
    tags: string[];
    category?: string;
    icon?: string;
    mounted: boolean;
    enabled: boolean;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Plugin Info - Simplified for listings
 */
interface PluginInfo {
    id: string;
    name: string;
    slug: string;
    description?: string;
    version: string;
    icon?: string;
    color?: string;
    enabled: boolean;
    installed: boolean;
    builtIn: boolean;
    primitiveCount: number;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Registry Statistics
 */
interface RegistryStats {
    primitiveCount: number;
    mountedCount: number;
    pluginCount: number;
    enabledPluginCount: number;
    workflowCount: number;
    totalExecutions: number;
}
/**
 * Create Primitive Request
 */
interface CreatePrimitiveRequest {
    name: string;
    description: string;
    inputSchema: JSONSchema;
    handler: string;
    category?: string;
    tags?: string[];
    icon?: string;
    timeout?: number;
    pluginId?: string;
    autoMount?: boolean;
}
/**
 * Update Primitive Request
 */
interface UpdatePrimitiveRequest {
    description?: string;
    inputSchema?: JSONSchema;
    handler?: string;
    category?: string;
    tags?: string[];
    icon?: string;
    timeout?: number;
    enabled?: boolean;
}
/**
 * Create Plugin Request
 */
interface CreatePluginRequest {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    config?: Record<string, unknown>;
    configSchema?: JSONSchema;
    author?: string;
}
/**
 * Generate a unique ID with optional prefix
 */
declare function generateId(prefix?: string): string;
/**
 * Increment semver patch version
 */
declare function incrementVersion(version: string): string;
/**
 * Slugify a string
 */
declare function slugify(str: string): string;

/**
 * Sandbox - Isolated Execution Environment for Primitive Handlers
 *
 * Provides a restricted execution environment for user-provided code.
 * Security measures:
 * - No access to Node.js built-ins (fs, path, child_process, etc.)
 * - No access to global objects (process, global, globalThis)
 * - Limited JavaScript APIs (JSON, Math, Date, String, Number, etc.)
 * - Timeout enforcement
 * - Output size limits
 */

/**
 * Validate handler code for security issues
 */
declare function validateHandlerSecurity(code: string): {
    safe: boolean;
    warnings: string[];
    blocked: string[];
};

/**
 * Plugin Registry - Manages primitives, plugins, and workflows
 *
 * Two-tier architecture:
 * - Tier 1: In-memory cache (fast access for mounted primitives)
 * - Tier 2: PostgreSQL via Prisma (persistent storage)
 *
 * Read path: Memory -> DB (on cache miss)
 * Write path: Memory + DB (write-through)
 */

/**
 * Plugin Registry - Singleton class managing the plugin system
 */
declare class PluginRegistry {
    private mountedPrimitives;
    private primitiveCache;
    private handlerCache;
    private initialized;
    /**
     * Initialize the registry - load primitives from DB into memory
     */
    initialize(): Promise<{
        loaded: number;
        mounted: number;
        errors: string[];
    }>;
    /**
     * Create a new primitive
     */
    createPrimitive(request: CreatePrimitiveRequest): Promise<{
        success: boolean;
        primitiveId?: string;
        error?: string;
    }>;
    /**
     * Update an existing primitive
     */
    updatePrimitive(id: string, request: UpdatePrimitiveRequest): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Delete a primitive
     */
    deletePrimitive(id: string, force?: boolean): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Mount a primitive to make it active
     */
    mountPrimitive(id: string, config?: Record<string, unknown>): {
        success: boolean;
        error?: string;
    };
    /**
     * Dismount a primitive
     */
    dismountPrimitive(id: string): {
        success: boolean;
        error?: string;
    };
    /**
     * Get a mounted primitive by ID or name
     */
    getMountedPrimitive(idOrName: string): MountedPrimitive | undefined;
    /**
     * Get all mounted primitives
     */
    getMountedPrimitives(): MountedPrimitive[];
    /**
     * Get compiled handler for a primitive
     */
    getCompiledHandler(id: string): Function | undefined;
    /**
     * Record a primitive invocation
     */
    recordInvocation(id: string): void;
    /**
     * List primitives with filtering
     */
    listPrimitives(options?: {
        filter?: 'mounted' | 'available' | 'all';
        category?: string;
        tags?: string[];
        pluginId?: string;
        search?: string;
    }): Promise<PrimitiveInfo[]>;
    /**
     * Create a new plugin
     */
    createPlugin(request: CreatePluginRequest): Promise<{
        success: boolean;
        pluginId?: string;
        error?: string;
    }>;
    /**
     * Enable/disable a plugin
     */
    setPluginEnabled(id: string, enabled: boolean): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Delete a plugin and its primitives
     */
    deletePlugin(id: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * List plugins
     */
    listPlugins(options?: {
        enabled?: boolean;
        search?: string;
    }): Promise<PluginInfo[]>;
    /**
     * Get workflow by ID
     */
    getWorkflow(id: string): Promise<WorkflowDefinition | null>;
    /**
     * List workflows
     */
    listWorkflows(options?: {
        enabled?: boolean;
        pluginId?: string;
        triggerType?: string;
    }): Promise<WorkflowDefinition[]>;
    /**
     * Get registry statistics
     */
    getStats(): Promise<RegistryStats>;
    private dbToPrimitiveDefinition;
    private getPrimitiveFromDb;
    private toPrimitiveInfo;
    /**
     * Check if registry is initialized
     */
    isInitialized(): boolean;
}
/**
 * Get the global plugin registry instance
 */
declare function getPluginRegistry(): PluginRegistry;
/**
 * Reset the registry (for testing)
 */
declare function resetPluginRegistry(): void;

/**
 * Primitive Executor - Orchestrates execution with validation and sandboxing
 *
 * Ties together:
 * - Input validation
 * - Sandboxed execution
 * - Output validation
 * - Error handling and metrics
 * - Execution logging
 */

/**
 * Execution Options
 */
interface ExecutionOptions {
    timeout?: number;
    skipValidation?: boolean;
    skipSandbox?: boolean;
    recordMetrics?: boolean;
    debug?: boolean;
}
/**
 * Execute a primitive with full validation and sandboxing
 */
declare function executePrimitive(primitive: PrimitiveDefinition, args: Record<string, unknown>, context?: Partial<ExecutionContext$1>, options?: ExecutionOptions): Promise<ExecutionResult>;
/**
 * Test a primitive with sample input
 */
declare function testPrimitive(primitive: PrimitiveDefinition, testInput: Record<string, unknown>, context?: Partial<ExecutionContext$1>): Promise<{
    success: boolean;
    result?: unknown;
    error?: string;
    validationErrors?: string[];
    securityWarnings?: string[];
    executionTime: number;
}>;
/**
 * Execute a primitive by ID or name
 */
declare function executeByIdOrName(idOrName: string, args: Record<string, unknown>, context?: Partial<ExecutionContext$1>, options?: ExecutionOptions): Promise<ExecutionResult>;
/**
 * Get execution statistics for a primitive
 */
declare function getExecutionStats(primitiveId: string): Promise<{
    totalExecutions: number;
    successCount: number;
    errorCount: number;
    averageExecutionTime: number;
    lastExecution?: Date;
}>;
/**
 * Get recent executions for a primitive
 */
declare function getRecentExecutions(primitiveId: string, limit?: number): Promise<Array<{
    id: string;
    success: boolean;
    error?: string;
    executionTime: number;
    startedAt: Date;
    userId?: string;
    agentId?: string;
}>>;

/**
 * Built-in Primitives
 *
 * System primitives that come pre-installed with the CMS.
 * These provide essential functionality and serve as examples.
 */

/**
 * Load built-in primitives into the database
 */
declare function loadBuiltInPrimitives(): Promise<{
    loaded: number;
    skipped: number;
    errors: string[];
}>;

interface ReviewSubmission {
    productId: string;
    customerId?: string;
    orderId?: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    title?: string;
    content: string;
    pros?: string;
    cons?: string;
    images?: string[];
    ipAddress?: string;
    userAgent?: string;
}
interface ReviewFilters {
    productId?: string;
    status?: ReviewStatus;
    rating?: number;
    minRating?: number;
    maxRating?: number;
    isVerifiedPurchase?: boolean;
    search?: string;
}
interface ReviewSort {
    field: 'createdAt' | 'rating' | 'helpfulCount';
    direction: 'asc' | 'desc';
}
interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    verifiedPurchaseCount: number;
    withImagesCount: number;
}
interface PaginatedReviews {
    reviews: Array<Awaited<ReturnType<typeof getReviewWithVotes>>>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
declare function getReviewWithVotes(reviewId: string): Promise<({
    product: {
        title: string;
        id: string;
        slug: string;
        images: ({
            media: {
                url: string;
            };
        } & {
            id: string;
            createdAt: Date;
            position: number;
            alt: string | null;
            productId: string;
            mediaId: string;
        })[];
    };
    customer: {
        id: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}) | null>;
/**
 * Get reviews with pagination and filtering
 */
declare function getReviews(filters?: ReviewFilters, sort?: ReviewSort, page?: number, pageSize?: number): Promise<PaginatedReviews>;
/**
 * Get reviews for a specific product (public-facing)
 */
declare function getProductReviews(productId: string, page?: number, pageSize?: number, sort?: ReviewSort): Promise<PaginatedReviews>;
/**
 * Get a single review by ID
 */
declare function getReviewById(reviewId: string): Promise<({
    product: {
        title: string;
        id: string;
        slug: string;
        images: ({
            media: {
                url: string;
            };
        } & {
            id: string;
            createdAt: Date;
            position: number;
            alt: string | null;
            productId: string;
            mediaId: string;
        })[];
    };
    customer: {
        id: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}) | null>;
/**
 * Submit a new review
 */
declare function submitReview(data: ReviewSubmission): Promise<{
    product: {
        title: string;
        id: string;
        slug: string;
    };
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}>;
/**
 * Update a review (admin moderation)
 */
declare function updateReview(reviewId: string, data: {
    status?: ReviewStatus;
    responseContent?: string;
    respondedById?: string;
}): Promise<{
    product: {
        title: string;
        id: string;
        slug: string;
    };
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}>;
/**
 * Delete a review
 */
declare function deleteReview(reviewId: string): Promise<{
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}>;
/**
 * Approve a pending review
 */
declare function approveReview(reviewId: string): Promise<{
    product: {
        title: string;
        id: string;
        slug: string;
    };
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}>;
/**
 * Reject a review
 */
declare function rejectReview(reviewId: string): Promise<{
    product: {
        title: string;
        id: string;
        slug: string;
    };
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}>;
/**
 * Flag a review for further review
 */
declare function flagReview(reviewId: string): Promise<{
    product: {
        title: string;
        id: string;
        slug: string;
    };
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}>;
/**
 * Add store response to a review
 */
declare function respondToReview(reviewId: string, responseContent: string, respondedById: string): Promise<{
    product: {
        title: string;
        id: string;
        slug: string;
    };
} & {
    title: string | null;
    id: string;
    content: string;
    status: _prisma_client.$Enums.ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    ipAddress: string | null;
    userAgent: string | null;
    orderId: string | null;
    customerId: string | null;
    productId: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    pros: string | null;
    cons: string | null;
    images: Prisma.JsonValue | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    responseContent: string | null;
    responseAt: Date | null;
    respondedById: string | null;
}>;
/**
 * Vote on a review (helpful/unhelpful)
 */
declare function voteReview(reviewId: string, helpful: boolean, userId?: string, email?: string): Promise<{
    updated: boolean;
    created?: undefined;
} | {
    created: boolean;
    updated?: undefined;
}>;
/**
 * Get review statistics for a product
 */
declare function getProductReviewStats(productId: string): Promise<ReviewStats>;
/**
 * Get overall review statistics (admin dashboard)
 */
declare function getReviewDashboardStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    averageRating: number;
}>;
/**
 * Check if a customer can review a product
 */
declare function canCustomerReviewProduct(productId: string, customerId?: string, email?: string): Promise<{
    canReview: boolean;
    reason?: string;
    isVerifiedPurchaser: boolean;
}>;
/**
 * Get orders eligible for review requests
 * (delivered orders without review requests sent)
 */
declare function getOrdersForReviewRequest(daysAfterDelivery?: number, limit?: number): Promise<({
    customer: {
        firstName: string | null;
        lastName: string | null;
    } | null;
    shippingAddress: {
        type: _prisma_client.$Enums.AddressType;
        id: string;
        createdAt: Date;
        state: string;
        country: string;
        phone: string | null;
        updatedAt: Date;
        userId: string;
        firstName: string;
        lastName: string;
        company: string | null;
        street1: string;
        street2: string | null;
        city: string;
        zip: string;
        isDefault: boolean;
    } | null;
    items: ({
        product: {
            title: string;
            id: string;
            slug: string;
            images: ({
                media: {
                    url: string;
                };
            } & {
                id: string;
                createdAt: Date;
                position: number;
                alt: string | null;
                productId: string;
                mediaId: string;
            })[];
        };
    } & {
        title: string;
        id: string;
        createdAt: Date;
        total: number;
        orderId: string;
        productId: string;
        sku: string | null;
        price: number;
        variantId: string | null;
        variantTitle: string | null;
        quantity: number;
    })[];
} & {
    id: string;
    status: _prisma_client.$Enums.OrderStatus;
    email: string;
    createdAt: Date;
    total: number;
    updatedAt: Date;
    orderNumber: string;
    customerId: string | null;
    subtotal: number;
    shippingTotal: number;
    taxTotal: number;
    discountTotal: number;
    discountCodeId: string | null;
    shippingAddressId: string | null;
    billingAddressId: string | null;
    stripePaymentIntentId: string | null;
    stripeSessionId: string | null;
    paymentStatus: _prisma_client.$Enums.PaymentStatus;
    paidAt: Date | null;
    customerNotes: string | null;
    internalNotes: string | null;
    workflowId: string | null;
    currentStageId: string | null;
    trackingAutoSync: boolean;
})[]>;
/**
 * Send review request email for an order
 */
declare function sendReviewRequestEmail(orderId: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * Bulk approve reviews
 */
declare function bulkApproveReviews(reviewIds: string[]): Promise<Prisma.BatchPayload>;
/**
 * Bulk reject reviews
 */
declare function bulkRejectReviews(reviewIds: string[]): Promise<Prisma.BatchPayload>;
/**
 * Bulk delete reviews
 */
declare function bulkDeleteReviews(reviewIds: string[]): Promise<Prisma.BatchPayload>;

/**
 * SEO Types and Configurations
 */
interface SeoConfig {
    siteName: string;
    siteUrl: string;
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    defaultImage?: string;
    twitterHandle?: string;
    locale: string;
    themeColor?: string;
    keywords?: string[];
}
interface PageSeo {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    canonical?: string;
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
}
interface ProductSeo extends PageSeo {
    price?: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    sku?: string;
    brand?: string;
    category?: string;
    reviewCount?: number;
    ratingValue?: number;
}
interface ArticleSeo extends PageSeo {
    type?: 'article' | 'blog' | 'news';
}
type OgType = 'website' | 'article' | 'product' | 'profile' | 'book' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other' | 'music.song' | 'music.album';
type StructuredDataType = 'Organization' | 'WebSite' | 'WebPage' | 'Product' | 'Article' | 'BlogPosting' | 'BreadcrumbList' | 'FAQPage' | 'LocalBusiness' | 'Person' | 'Event' | 'Review' | 'HowTo' | 'Recipe' | 'VideoObject';
interface BreadcrumbItem {
    name: string;
    url: string;
}
interface OrganizationData {
    name: string;
    url: string;
    logo?: string;
    description?: string;
    sameAs?: string[];
    contactPoint?: {
        type: string;
        telephone?: string;
        email?: string;
        areaServed?: string;
        availableLanguage?: string[];
    };
}
interface LocalBusinessData extends OrganizationData {
    address?: {
        streetAddress: string;
        addressLocality: string;
        addressRegion: string;
        postalCode: string;
        addressCountry: string;
    };
    geo?: {
        latitude: number;
        longitude: number;
    };
    openingHours?: string[];
    priceRange?: string;
}
interface FaqItem {
    question: string;
    answer: string;
}
declare const DEFAULT_SEO_CONFIG: SeoConfig;
declare const ROBOTS_CONFIGS: {
    default: {
        index: boolean;
        follow: boolean;
        googleBot: {
            index: boolean;
            follow: boolean;
            'max-video-preview': number;
            'max-image-preview': "large";
            'max-snippet': number;
        };
    };
    noIndex: {
        index: boolean;
        follow: boolean;
    };
    noFollow: {
        index: boolean;
        follow: boolean;
    };
    none: {
        index: boolean;
        follow: boolean;
    };
};

/**
 * SEO Utilities Library
 *
 * Provides metadata generation, structured data, and SEO helpers
 */

/**
 * Get SEO configuration from database
 */
declare function getSeoConfig(): Promise<SeoConfig>;
/**
 * Clear SEO config cache
 */
declare function clearSeoConfigCache(): void;
/**
 * Generate Next.js Metadata for a page
 */
declare function generateMetadata(pageSeo?: PageSeo, type?: OgType): Promise<Metadata>;
/**
 * Generate metadata for a product page
 */
declare function generateProductMetadata(product: ProductSeo): Promise<Metadata>;
/**
 * Generate metadata for an article/blog post
 */
declare function generateArticleMetadata(article: ArticleSeo): Promise<Metadata>;
/**
 * Generate viewport configuration
 */
declare function generateViewport(): Viewport$1;
/**
 * Generate Organization structured data
 */
declare function generateOrganizationSchema(org: OrganizationData): object;
/**
 * Generate LocalBusiness structured data
 */
declare function generateLocalBusinessSchema(business: LocalBusinessData): object;
/**
 * Generate WebSite structured data with search action
 */
declare function generateWebsiteSchema(searchPath?: string): Promise<object>;
/**
 * Generate BreadcrumbList structured data
 */
declare function generateBreadcrumbSchema(items: BreadcrumbItem[]): Promise<object>;
/**
 * Generate Product structured data
 */
declare function generateProductSchema(product: {
    name: string;
    description?: string;
    image?: string | string[];
    sku?: string;
    brand?: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    url?: string;
    reviewCount?: number;
    ratingValue?: number;
}): Promise<object>;
/**
 * Generate Article/BlogPosting structured data
 */
declare function generateArticleSchema(article: {
    headline: string;
    description?: string;
    image?: string;
    datePublished: string;
    dateModified?: string;
    author?: string;
    url?: string;
}): Promise<object>;
/**
 * Generate FAQ structured data
 */
declare function generateFaqSchema(faqs: FaqItem[]): object;
/**
 * Render JSON-LD script tag
 */
declare function renderJsonLd(data: object | object[]): string;

/**
 * Shippo Integration Types
 *
 * TypeScript interfaces for working with Shippo shipping API.
 */
interface ShippingAddress {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
    isResidential?: boolean;
}
interface ValidatedAddress extends ShippingAddress {
    isValid: boolean;
    messages?: AddressValidationMessage[];
    suggestedAddress?: ShippingAddress;
}
interface AddressValidationMessage {
    source: string;
    code: string;
    text: string;
    type: 'error' | 'warning' | 'info';
}
interface Parcel {
    length: number;
    width: number;
    height: number;
    weight: number;
    massUnit?: 'oz' | 'lb' | 'g' | 'kg';
    distanceUnit?: 'in' | 'cm';
}
interface ParcelTemplate {
    name: string;
    carrier: CarrierType;
    token: string;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
}
interface ShippingRate {
    rateId: string;
    carrier: CarrierType;
    carrierAccount: string;
    servicelevel: {
        name: string;
        token: string;
        terms?: string;
    };
    amount: string;
    currency: string;
    amountLocal?: string;
    currencyLocal?: string;
    estimatedDays?: number;
    durationTerms?: string;
    zone?: string;
    attributes?: string[];
    provider?: string;
    arrivesBy?: string;
}
type CarrierType = 'usps' | 'ups' | 'fedex';
interface CarrierAccount {
    id: string;
    carrier: CarrierType;
    accountId: string;
    isActive: boolean;
    test: boolean;
}
interface CreateShipmentRequest {
    addressFrom: ShippingAddress;
    addressTo: ShippingAddress;
    parcels: Parcel[];
    customsDeclaration?: CustomsDeclaration;
    extra?: ShipmentExtras;
}
interface ShipmentExtras {
    signature?: 'STANDARD' | 'ADULT' | 'CERTIFIED' | 'INDIRECT' | 'CARRIER_CONFIRMATION';
    insurance?: {
        amount: string;
        currency: string;
        content?: string;
    };
    reference1?: string;
    reference2?: string;
    containsAlcohol?: boolean;
    saturdayDelivery?: boolean;
}
interface CustomsDeclaration {
    contentsType: 'DOCUMENTS' | 'GIFT' | 'SAMPLE' | 'MERCHANDISE' | 'HUMANITARIAN_DONATION' | 'RETURN_MERCHANDISE' | 'OTHER';
    contentsExplanation?: string;
    items: CustomsItem[];
    nonDeliveryOption?: 'ABANDON' | 'RETURN';
    certify?: boolean;
    certifySigner?: string;
    incoterm?: 'DDP' | 'DDU';
}
interface CustomsItem {
    description: string;
    quantity: number;
    netWeight: string;
    massUnit: 'oz' | 'lb' | 'g' | 'kg';
    valueAmount: string;
    valueCurrency: string;
    originCountry: string;
    tariffNumber?: string;
}
interface ShipmentResponse {
    shipmentId: string;
    status: 'QUEUED' | 'WAITING' | 'SUCCESS' | 'ERROR';
    rates: ShippingRate[];
    messages?: ShipmentMessage[];
}
interface ShipmentMessage {
    source: string;
    code: string;
    text: string;
}
type LabelFormat = 'PDF' | 'PNG' | 'PDF_4x6' | 'PDF_A4' | 'PDF_A6' | 'PNG_2.3x7.5' | 'ZPLII';
interface PurchaseLabelRequest {
    rateId: string;
    labelFormat?: LabelFormat;
    labelFileType?: 'PDF' | 'PNG' | 'ZPLII';
    async?: boolean;
}
interface LabelResponse {
    transactionId: string;
    status: 'QUEUED' | 'WAITING' | 'SUCCESS' | 'ERROR' | 'REFUNDED' | 'REFUNDPENDING' | 'REFUNDREJECTED';
    rate: ShippingRate;
    trackingNumber: string;
    trackingUrl: string;
    labelUrl: string;
    commercialInvoiceUrl?: string;
    eta?: string;
    messages?: ShipmentMessage[];
}
interface TrackingStatus {
    carrier: CarrierType;
    trackingNumber: string;
    eta?: string;
    servicelevel?: {
        name: string;
        token: string;
    };
    addressFrom?: Partial<ShippingAddress>;
    addressTo?: Partial<ShippingAddress>;
    trackingStatus: TrackingEvent;
    trackingHistory: TrackingEvent[];
}
interface TrackingEvent {
    status: TrackingStatusType;
    statusDetails: string;
    statusDate: string;
    location?: {
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    substatus?: {
        code: string;
        text: string;
        actionRequired: boolean;
    };
}
type TrackingStatusType = 'UNKNOWN' | 'PRE_TRANSIT' | 'TRANSIT' | 'DELIVERED' | 'RETURNED' | 'FAILURE';
interface RefundRequest {
    transactionId: string;
}
interface RefundResponse$1 {
    transactionId: string;
    status: 'PENDING' | 'SUCCESS' | 'ERROR';
}
interface ShippoWebhookPayload {
    event: string;
    test: boolean;
    data: {
        carrier: string;
        tracking_number: string;
        tracking_status: TrackingEvent;
        tracking_history: TrackingEvent[];
    };
}
interface ShippoConfig {
    apiKey: string;
    webhookSecret?: string;
    defaultFromAddress: ShippingAddress;
    carriers: CarrierType[];
    testMode: boolean;
}
interface ShippingSettings {
    enabled?: boolean;
    shippoApiKey?: string;
    shippoWebhookSecret?: string;
    testMode?: boolean;
    /** Use Shippo Shipping Elements (embedded widget) instead of custom API integration */
    useElements?: boolean;
    fromName?: string;
    fromCompany?: string;
    fromStreet1?: string;
    fromStreet2?: string;
    fromCity?: string;
    fromState?: string;
    fromZip?: string;
    fromCountry?: string;
    fromPhone?: string;
    fromEmail?: string;
    enabledCarriers?: CarrierType[];
    defaultLabelFormat?: LabelFormat;
    defaultPackageWeight?: number;
    requireSignature?: boolean;
}
interface ShippoElementsAuthResponse {
    token: string;
    expiresAt: string;
    organizationId: string;
}
interface ShippoElementsLabel {
    transactionId: string;
    trackingNumber: string;
    trackingUrl: string;
    labelUrl: string;
    rate: {
        carrier: string;
        service: string;
        amount: string;
        currency: string;
    };
}
interface ShipmentStatusOption {
    value: 'pending' | 'label_purchased' | 'in_transit' | 'delivered' | 'exception' | 'refunded';
    label: string;
}
declare const SHIPMENT_STATUSES: ShipmentStatusOption[];
declare const CARRIER_OPTIONS: readonly [{
    readonly value: "usps";
    readonly label: "USPS";
}, {
    readonly value: "ups";
    readonly label: "UPS";
}, {
    readonly value: "fedex";
    readonly label: "FedEx";
}];
declare const LABEL_FORMAT_OPTIONS: readonly [{
    readonly value: "PDF";
    readonly label: "PDF (Standard)";
}, {
    readonly value: "PDF_4x6";
    readonly label: "PDF 4x6 (Thermal)";
}, {
    readonly value: "PNG";
    readonly label: "PNG";
}];

/**
 * Stripe Integration Types
 */

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
interface CreateCheckoutSessionRequest {
    orderId?: string;
    items: CheckoutItem[];
    customerEmail?: string;
    customerId?: string;
    successUrl: string;
    cancelUrl: string;
    mode?: 'payment' | 'subscription';
    allowPromotionCodes?: boolean;
    shippingAddressCollection?: boolean;
    shippingOptions?: ShippingOption[];
    metadata?: Record<string, string>;
}
interface CheckoutItem {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    images?: string[];
    productId?: string;
    variantId?: string;
    stripePriceId?: string;
}
interface ShippingOption {
    id: string;
    displayName: string;
    amount: number;
    deliveryEstimate?: {
        minimum: {
            unit: 'day' | 'week' | 'month';
            value: number;
        };
        maximum: {
            unit: 'day' | 'week' | 'month';
            value: number;
        };
    };
}
interface CreatePaymentIntentRequest {
    amount: number;
    currency?: string;
    customerId?: string;
    customerEmail?: string;
    orderId?: string;
    metadata?: Record<string, string>;
    paymentMethodTypes?: string[];
    captureMethod?: 'automatic' | 'manual';
}
interface CreateCustomerRequest {
    email: string;
    name?: string;
    phone?: string;
    address?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    metadata?: Record<string, string>;
}
interface CreateSubscriptionRequest {
    customerId: string;
    priceId: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
    cancelAtPeriodEnd?: boolean;
}
interface CreateRefundRequest {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
}
interface StripeSettings {
    enabled: boolean;
    testMode: boolean;
    secretKey?: string;
    publishableKey?: string;
    webhookSecret?: string;
    currency: string;
    statementDescriptor?: string;
    supportedPaymentMethods: string[];
    automaticTax: boolean;
    billingAddressCollection: 'auto' | 'required';
}
interface CheckoutSessionResponse {
    sessionId: string;
    url: string;
}
interface PaymentIntentResponse {
    paymentIntentId: string;
    clientSecret: string;
    status: string;
}
interface RefundResponse {
    refundId: string;
    status: string;
    amount: number;
}

/**
 * Settings Types
 */
type SettingGroup = 'general' | 'branding' | 'store' | 'payments' | 'shipping' | 'analytics' | 'seo' | 'email' | 'storage' | 'ai' | 'security';
interface BrandingSettings {
    siteName: string;
    siteTagline?: string;
    logoUrl?: string;
    logoAlt?: string;
    logoDarkUrl?: string;
    faviconUrl?: string;
    appleTouchIconUrl?: string;
    ogImageUrl?: string;
    primaryColor?: string;
    accentColor?: string;
}
interface GeneralSettings {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    supportPhone?: string;
    timezone: string;
    currency: string;
    locale: string;
    logoUrl?: string;
    faviconUrl?: string;
}
interface EmailSettings {
    provider: 'smtp' | 'sendgrid' | 'resend' | 'mailgun' | 'ses';
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure?: boolean;
    sendgridApiKey?: string;
    resendApiKey?: string;
    mailgunApiKey?: string;
    mailgunDomain?: string;
    sesRegion?: string;
    sesAccessKeyId?: string;
    sesSecretAccessKey?: string;
}
interface StorageSettings {
    provider: 's3' | 'r2' | 'local';
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
    publicUrl?: string;
    maxFileSize: number;
    allowedFileTypes: string[];
}
interface AiSettings {
    enabled: boolean;
    provider: 'openai' | 'anthropic' | 'google';
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
}
interface SecuritySettings {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorEnabled: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
}
interface EnvVarStatus {
    name: string;
    configured: boolean;
    required: boolean;
    group: SettingGroup;
    description: string;
}
interface AllSettings {
    general: GeneralSettings;
    payments: StripeSettings;
    shipping: ShippingSettings;
    analytics: AnalyticsSettings;
    seo: SeoConfig;
    email: EmailSettings;
    storage: StorageSettings;
    ai: AiSettings;
    security: SecuritySettings;
}
declare const DEFAULT_BRANDING_SETTINGS: BrandingSettings;
declare const DEFAULT_GENERAL_SETTINGS: GeneralSettings;
declare const DEFAULT_EMAIL_SETTINGS: EmailSettings;
declare const DEFAULT_STORAGE_SETTINGS: StorageSettings;
declare const DEFAULT_AI_SETTINGS: AiSettings;
declare const DEFAULT_SECURITY_SETTINGS: SecuritySettings;
declare const REQUIRED_ENV_VARS: EnvVarStatus[];

/**
 * Settings Library
 *
 * Centralized settings management with database storage and encryption
 */

/**
 * Get settings for a specific group
 */
declare function getSettings<T>(group: SettingGroup, defaults: T): Promise<T>;
/**
 * Update settings for a group
 */
declare function updateSettings(group: SettingGroup, settings: Record<string, any>): Promise<void>;
/**
 * Clear settings cache
 */
declare function clearSettingsCache(group?: SettingGroup): void;
declare function getBrandingSettings(): Promise<BrandingSettings>;
declare function getGeneralSettings(): Promise<GeneralSettings>;
declare function getEmailSettings(): Promise<EmailSettings>;
declare function getStorageSettings(): Promise<StorageSettings>;
declare function getAiSettings(): Promise<AiSettings>;
declare function getSecuritySettings(): Promise<SecuritySettings>;
/**
 * Check environment variable status
 */
declare function getEnvVarStatus(): EnvVarStatus[];
/**
 * Get all settings for admin dashboard
 */
declare function getAllSettings(): Promise<{
    branding: BrandingSettings;
    general: GeneralSettings;
    email: EmailSettings;
    storage: StorageSettings;
    ai: AiSettings;
    security: SecuritySettings;
    envVars: EnvVarStatus[];
}>;

/**
 * Site Settings Service
 *
 * Provides functions to fetch and manage global site settings
 * including header, footer, and announcement bar configurations.
 */
interface SiteSettingsData {
    id: string;
    header: Record<string, unknown> | null;
    footer: Record<string, unknown> | null;
    announcementBar: Record<string, unknown> | null;
    showAnnouncementBar: boolean;
    siteName: string | null;
    siteTagline: string | null;
    logoUrl: string | null;
    logoAlt: string | null;
    faviconUrl: string | null;
    socialLinks: Record<string, unknown>[] | null;
    defaultMetaTitle: string | null;
    defaultMetaDescription: string | null;
    defaultOgImage: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    businessAddress: Record<string, unknown> | null;
    googleAnalyticsId: string | null;
    facebookPixelId: string | null;
}
/**
 * Get site settings (cached per request)
 */
declare const getSiteSettings: () => Promise<SiteSettingsData | null>;
/**
 * Get or create default site settings
 */
declare function getOrCreateSiteSettings(): Promise<SiteSettingsData>;
/**
 * Update site settings
 */
declare function updateSiteSettings(data: Partial<Omit<SiteSettingsData, 'id'>>): Promise<SiteSettingsData>;
/**
 * Update header configuration
 */
declare function updateHeaderConfig(headerData: Record<string, unknown>): Promise<SiteSettingsData>;
/**
 * Update footer configuration
 */
declare function updateFooterConfig(footerData: Record<string, unknown>): Promise<SiteSettingsData>;
/**
 * Update announcement bar configuration
 */
declare function updateAnnouncementBarConfig(announcementData: Record<string, unknown>, showAnnouncementBar: boolean): Promise<SiteSettingsData>;

/**
 * Workflow System Types
 *
 * TypeScript definitions for the event-driven workflow engine.
 */

type WorkflowEventType = 'order.created' | 'order.paid' | 'order.shipped' | 'order.delivered' | 'order.cancelled' | 'order.refunded' | 'user.created' | 'user.updated' | 'user.deleted' | 'user.subscribed' | 'user.unsubscribed' | 'product.created' | 'product.updated' | 'product.deleted' | 'product.low_stock' | 'product.out_of_stock' | 'page.created' | 'page.published' | 'page.updated' | 'blog.created' | 'blog.published' | 'blog.updated' | 'payment.succeeded' | 'payment.failed' | 'subscription.created' | 'subscription.cancelled' | 'form.submitted' | 'contact.created' | 'webhook.received' | 'custom' | string;
interface WorkflowEvent<T = unknown> {
    id: string;
    type: WorkflowEventType;
    timestamp: Date;
    data: T;
    metadata?: {
        source?: string;
        userId?: string;
        correlationId?: string;
        [key: string]: unknown;
    };
}
interface EventSubscription {
    id: string;
    eventType: WorkflowEventType | WorkflowEventType[];
    handler: (event: WorkflowEvent) => Promise<void>;
    filter?: (event: WorkflowEvent) => boolean;
    priority?: number;
}
type WorkflowNodeType = 'trigger' | 'primitive' | 'condition' | 'loop' | 'delay' | 'parallel' | 'output';
interface WorkflowNodeConfig {
    inputMapping?: Record<string, string | InputMapping>;
    condition?: WorkflowCondition;
    loop?: {
        collection: string;
        itemVariable: string;
        indexVariable?: string;
    };
    delay?: {
        duration: number;
        unit: 'seconds' | 'minutes' | 'hours' | 'days';
    };
    primitiveConfig?: Record<string, unknown>;
}
interface InputMapping {
    type: 'static' | 'reference' | 'expression' | 'template';
    value: string;
    path?: string;
}
interface WorkflowCondition {
    type: 'simple' | 'expression' | 'all' | 'any' | 'none';
    field?: string;
    operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'exists';
    value?: unknown;
    expression?: string;
    conditions?: WorkflowCondition[];
}
type WorkflowExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
interface WorkflowContext {
    executionId: string;
    workflowId: string;
    startedAt: Date;
    trigger: {
        type: string;
        data: unknown;
        event?: WorkflowEvent;
    };
    variables: Record<string, unknown>;
    nodeOutputs: Record<string, unknown>;
    currentNodeId?: string;
    executedNodes: string[];
    errors: Array<{
        nodeId: string;
        error: string;
        timestamp: Date;
    }>;
}
interface NodeExecutionResult {
    nodeId: string;
    success: boolean;
    output?: unknown;
    error?: string;
    duration: number;
    skipped?: boolean;
    skipReason?: string;
}
interface WorkflowExecutionResult {
    executionId: string;
    workflowId: string;
    status: WorkflowExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    result?: unknown;
    error?: string;
    nodeResults: NodeExecutionResult[];
}
interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: WorkflowTemplateCategory;
    triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';
    nodes: WorkflowTemplateNode[];
    edges: WorkflowTemplateEdge[];
    requiredPrimitives: string[];
    configSchema?: Record<string, unknown>;
    icon?: string;
    tags?: string[];
}
type WorkflowTemplateCategory = 'ecommerce' | 'marketing' | 'notifications' | 'content' | 'integrations' | 'custom';
interface WorkflowTemplateNode {
    id: string;
    type: WorkflowNodeType;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        nodeType: WorkflowNodeType;
        primitiveId?: string;
        config?: WorkflowNodeConfig;
    };
}
interface WorkflowTemplateEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    data?: {
        condition?: WorkflowCondition;
        label?: string;
    };
}
type ActionHandler<TInput = Record<string, unknown>, TOutput = unknown> = (input: TInput, context: WorkflowContext) => Promise<TOutput>;
interface ActionDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
    name: string;
    description: string;
    category: string;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    handler: ActionHandler<TInput, TOutput>;
}
type WorkflowWithNodes = Workflow & {
    workflowNodes: (WorkflowNode & {
        primitive: Primitive | null;
    })[];
};
type WorkflowExecutionWithDetails = WorkflowExecution & {
    workflow: Workflow;
};
interface CreateWorkflowInput {
    name: string;
    slug?: string;
    description?: string;
    nodes: WorkflowTemplateNode[];
    edges: WorkflowTemplateEdge[];
    triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'AI_AGENT';
    triggerConfig?: Record<string, unknown>;
    variables?: Record<string, unknown>;
    enabled?: boolean;
    pluginId?: string;
}
interface UpdateWorkflowInput {
    name?: string;
    description?: string;
    nodes?: WorkflowTemplateNode[];
    edges?: WorkflowTemplateEdge[];
    triggerConfig?: Record<string, unknown>;
    variables?: Record<string, unknown>;
    enabled?: boolean;
}
interface TriggerWorkflowInput {
    workflowId: string;
    data?: unknown;
    userId?: string;
    agentId?: string;
}
interface WorkflowListOptions {
    enabled?: boolean;
    triggerType?: string;
    pluginId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

/**
 * Event Bus System
 *
 * Pub/sub event system for triggering workflows based on system events.
 * Supports event filtering, priority-based handlers, and async execution.
 */

declare class EventBus {
    private subscriptions;
    private eventHistory;
    private maxHistorySize;
    /**
     * Subscribe to events
     */
    subscribe(subscription: Omit<EventSubscription, 'id'>): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Emit an event
     */
    emit<T = unknown>(type: WorkflowEventType, data: T, metadata?: WorkflowEvent['metadata']): Promise<void>;
    /**
     * Emit event without waiting for handlers (fire-and-forget)
     */
    emitAsync<T = unknown>(type: WorkflowEventType, data: T, metadata?: WorkflowEvent['metadata']): void;
    /**
     * Get recent events
     */
    getHistory(limit?: number): WorkflowEvent[];
    /**
     * Get subscriptions for debugging
     */
    getSubscriptions(): Map<string, EventSubscription[]>;
    /**
     * Clear all subscriptions (for testing)
     */
    clearSubscriptions(): void;
    /**
     * Trigger workflows configured for EVENT trigger type
     */
    private triggerEventWorkflows;
    /**
     * Check if data matches a filter object
     */
    private matchesFilter;
    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue;
}
declare const eventBus: EventBus;
/**
 * Emit an event (convenience function)
 */
declare function emit<T = unknown>(type: WorkflowEventType, data: T, metadata?: WorkflowEvent['metadata']): Promise<void>;
/**
 * Emit an event without waiting (convenience function)
 */
declare function emitAsync<T = unknown>(type: WorkflowEventType, data: T, metadata?: WorkflowEvent['metadata']): void;
/**
 * Subscribe to events (convenience function)
 */
declare function subscribe(subscription: Omit<EventSubscription, 'id'>): string;
/**
 * Unsubscribe from events (convenience function)
 */
declare function unsubscribe(subscriptionId: string): boolean;
declare const events: {
    order: {
        created: (order: unknown) => Promise<void>;
        paid: (order: unknown) => Promise<void>;
        shipped: (order: unknown, shipment?: unknown) => Promise<void>;
        delivered: (order: unknown) => Promise<void>;
        cancelled: (order: unknown, reason?: string) => Promise<void>;
        refunded: (order: unknown, refund?: unknown) => Promise<void>;
    };
    user: {
        created: (user: unknown) => Promise<void>;
        updated: (user: unknown, changes?: unknown) => Promise<void>;
        deleted: (userId: string) => Promise<void>;
        subscribed: (user: unknown, list?: string) => Promise<void>;
        unsubscribed: (user: unknown, list?: string) => Promise<void>;
    };
    product: {
        created: (product: unknown) => Promise<void>;
        updated: (product: unknown, changes?: unknown) => Promise<void>;
        deleted: (productId: string) => Promise<void>;
        lowStock: (product: unknown, threshold: number) => Promise<void>;
        outOfStock: (product: unknown) => Promise<void>;
    };
    content: {
        pageCreated: (page: unknown) => Promise<void>;
        pagePublished: (page: unknown) => Promise<void>;
        pageUpdated: (page: unknown) => Promise<void>;
        blogCreated: (post: unknown) => Promise<void>;
        blogPublished: (post: unknown) => Promise<void>;
        blogUpdated: (post: unknown) => Promise<void>;
    };
    payment: {
        succeeded: (payment: unknown) => Promise<void>;
        failed: (payment: unknown, error?: string) => Promise<void>;
        subscriptionCreated: (subscription: unknown) => Promise<void>;
        subscriptionCancelled: (subscription: unknown) => Promise<void>;
    };
    form: {
        submitted: (form: unknown, data: unknown) => Promise<void>;
        contactCreated: (contact: unknown) => Promise<void>;
    };
    webhook: {
        received: (source: string, payload: unknown) => Promise<void>;
    };
    custom: (eventType: string, data: unknown) => Promise<void>;
};

/**
 * Workflow Execution Engine
 *
 * Executes workflows by traversing nodes, evaluating conditions,
 * and running primitives/actions.
 */

interface ExecuteWorkflowOptions {
    triggeredBy: 'manual' | 'schedule' | 'webhook' | 'event' | 'agent';
    userId?: string;
    agentId?: string;
    eventData?: unknown;
    variables?: Record<string, unknown>;
}
/**
 * Execute a workflow by ID
 */
declare function executeWorkflow(workflowId: string, options: ExecuteWorkflowOptions): Promise<WorkflowExecutionResult>;
/**
 * Execute a workflow instance
 */
declare function executeWorkflowInstance(workflow: Workflow, options: ExecuteWorkflowOptions): Promise<WorkflowExecutionResult>;
/**
 * Cancel a running workflow execution
 */
declare function cancelWorkflowExecution(executionId: string): Promise<void>;
/**
 * Get workflow execution status
 */
declare function getWorkflowExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
/**
 * Get recent workflow executions
 */
declare function getWorkflowExecutions(workflowId: string, options?: {
    limit?: number;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}): Promise<WorkflowExecution[]>;
/**
 * Trigger a workflow manually
 */
declare function triggerWorkflowManually(workflowId: string, data?: unknown, userId?: string): Promise<WorkflowExecutionResult>;
/**
 * Trigger a workflow via webhook
 */
declare function triggerWorkflowByWebhook(workflowSlug: string, payload: unknown): Promise<WorkflowExecutionResult>;
/**
 * Find workflows that should run on schedule
 */
declare function getScheduledWorkflows(): Promise<Workflow[]>;
/**
 * Check if a workflow should run based on cron schedule
 */
declare function shouldRunScheduledWorkflow(workflow: Workflow, now?: Date): boolean;

/**
 * Workflow Context & State Management
 *
 * Manages execution context, variable resolution, and state
 * throughout workflow execution.
 */

/**
 * Create a new workflow execution context
 */
declare function createWorkflowContext(workflowId: string, trigger: {
    type: string;
    data: unknown;
    event?: WorkflowEvent;
}, initialVariables?: Record<string, unknown>): WorkflowContext;
/**
 * Resolve a value from context using path notation
 * Supports: trigger.data.field, variables.name, nodes.nodeId.field
 */
declare function resolveValue(context: WorkflowContext, path: string): unknown;
/**
 * Resolve input mapping to actual value
 */
declare function resolveInputMapping(mapping: string | InputMapping, context: WorkflowContext): unknown;
/**
 * Resolve all input mappings for a node
 */
declare function resolveNodeInputs(inputMapping: Record<string, string | InputMapping> | undefined, context: WorkflowContext): Record<string, unknown>;
/**
 * Resolve template string with {{path}} placeholders
 */
declare function resolveTemplate(template: string, context: WorkflowContext): string;
/**
 * Safely evaluate an expression against context
 * Supports basic operations and context references
 */
declare function evaluateExpression(expression: string, context: WorkflowContext): unknown;
/**
 * Evaluate a workflow condition
 */
declare function evaluateCondition(condition: WorkflowCondition, context: WorkflowContext): boolean;
/**
 * Update context with node output
 */
declare function setNodeOutput(context: WorkflowContext, nodeId: string, output: unknown): WorkflowContext;
/**
 * Set a variable in context
 */
declare function setVariable(context: WorkflowContext, name: string, value: unknown): WorkflowContext;
/**
 * Add an error to context
 */
declare function addError(context: WorkflowContext, nodeId: string, error: string): WorkflowContext;
/**
 * Create iteration context for loop execution
 */
declare function createIterationContext(context: WorkflowContext, itemVariable: string, item: unknown, indexVariable: string | undefined, index: number): WorkflowContext;
/**
 * Serialize context for storage (e.g., for pause/resume)
 */
declare function serializeContext(context: WorkflowContext): string;
/**
 * Deserialize context from storage
 */
declare function deserializeContext(serialized: string): WorkflowContext;
/**
 * Get a summary of context for logging
 */
declare function getContextSummary(context: WorkflowContext): Record<string, unknown>;
/**
 * Clone context for branch execution
 */
declare function cloneContext(context: WorkflowContext): WorkflowContext;

/**
 * Primitive Adapter
 *
 * Bridges the workflow engine with the primitive execution system.
 * Handles primitive loading, validation, and execution logging.
 */

/**
 * Clear primitive cache (useful for testing)
 */
declare function clearPrimitiveCache(): void;
/**
 * Get a primitive by ID with caching
 */
declare function getPrimitive(primitiveId: string): Promise<Primitive | null>;
/**
 * Get a primitive by name
 */
declare function getPrimitiveByName(name: string): Promise<Primitive | null>;
/**
 * Get all primitives for a category
 */
declare function getPrimitivesByCategory(category: string): Promise<Primitive[]>;
/**
 * Get all available primitives
 */
declare function getAllPrimitives(): Promise<Primitive[]>;
/**
 * Validate input against primitive's JSON Schema
 */
declare function validatePrimitiveInput(primitive: Primitive, input: unknown): {
    valid: boolean;
    errors?: string[];
};
interface ExecutionContext {
    workflowExecutionId?: string;
    workflowId?: string;
    userId?: string;
    agentId?: string;
}
/**
 * Execute a primitive by name
 */
declare function executePrimitiveByName(name: string, input: Record<string, unknown>, context?: ExecutionContext): Promise<unknown>;
/**
 * Get execution history for a primitive
 */
declare function getPrimitiveExecutionHistory(primitiveId: string, options?: {
    limit?: number;
    success?: boolean;
    workflowExecutionId?: string;
}): Promise<PrimitiveExecution[]>;
/**
 * Get primitive categories
 */
declare function getPrimitiveCategories(): Promise<string[]>;
/**
 * Check if a primitive exists and is enabled
 */
declare function isPrimitiveAvailable(primitiveId: string): Promise<boolean>;
/**
 * Get primitive input schema for UI rendering
 */
declare function getPrimitiveInputSchema(primitiveId: string): Promise<Record<string, unknown> | null>;

/**
 * React Flow Integration
 *
 * Utilities for integrating workflows with React Flow visual editor.
 * Handles node/edge conversion, validation, and workflow serialization.
 */
interface XYPosition {
    x: number;
    y: number;
}
interface Viewport {
    x: number;
    y: number;
    zoom: number;
}
interface Node<T = unknown> {
    id: string;
    type?: string;
    position: XYPosition;
    data: T;
    width?: number;
    height?: number;
    selected?: boolean;
    dragging?: boolean;
    hidden?: boolean;
}
interface Edge<T = unknown> {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string;
    animated?: boolean;
    hidden?: boolean;
    data?: T;
    label?: string;
    selected?: boolean;
}

interface WorkflowNodeData {
    label: string;
    nodeType: WorkflowNodeType;
    primitiveId?: string;
    primitiveName?: string;
    primitiveIcon?: string;
    config?: WorkflowNodeConfig;
    isExecuting?: boolean;
    isCompleted?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    executionTime?: number;
}
interface WorkflowEdgeData {
    condition?: WorkflowCondition;
    label?: string;
}
type WorkflowReactFlowNode = Node<WorkflowNodeData>;
type WorkflowReactFlowEdge = Edge<WorkflowEdgeData>;
interface NodeTypeDefinition {
    type: WorkflowNodeType;
    label: string;
    description: string;
    icon: string;
    color: string;
    category: 'trigger' | 'action' | 'control' | 'output';
    handles: {
        inputs: number;
        outputs: number;
        conditionalOutputs?: string[];
    };
    defaultConfig?: WorkflowNodeConfig;
}
declare const nodeTypeDefinitions: Record<WorkflowNodeType, NodeTypeDefinition>;
/**
 * Convert workflow template nodes to React Flow nodes
 */
declare function toReactFlowNodes(templateNodes: WorkflowTemplateNode[]): WorkflowReactFlowNode[];
/**
 * Convert workflow template edges to React Flow edges
 */
declare function toReactFlowEdges(templateEdges: WorkflowTemplateEdge[]): WorkflowReactFlowEdge[];
/**
 * Convert React Flow nodes back to workflow template format
 */
declare function fromReactFlowNodes(nodes: WorkflowReactFlowNode[]): WorkflowTemplateNode[];
/**
 * Convert React Flow edges back to workflow template format
 */
declare function fromReactFlowEdges(edges: WorkflowReactFlowEdge[]): WorkflowTemplateEdge[];
interface WorkflowValidationResult {
    valid: boolean;
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationWarning[];
}
interface WorkflowValidationError {
    type: 'error';
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
}
interface WorkflowValidationWarning {
    type: 'warning';
    code: string;
    message: string;
    nodeId?: string;
}
/**
 * Validate a workflow graph
 */
declare function validateWorkflow(nodes: WorkflowReactFlowNode[], edges: WorkflowReactFlowEdge[]): WorkflowValidationResult;
/**
 * Auto-layout nodes in a hierarchical fashion
 */
declare function autoLayoutNodes(nodes: WorkflowReactFlowNode[], edges: WorkflowReactFlowEdge[], options?: {
    direction?: 'TB' | 'LR';
    nodeSpacingX?: number;
    nodeSpacingY?: number;
}): WorkflowReactFlowNode[];
/**
 * Generate a unique node ID
 */
declare function generateNodeId(): string;
/**
 * Generate a unique edge ID
 */
declare function generateEdgeId(source: string, target: string): string;
/**
 * Create a new trigger node
 */
declare function createTriggerNode(position: XYPosition, triggerType: 'manual' | 'schedule' | 'webhook' | 'event'): WorkflowReactFlowNode;
/**
 * Create a new primitive/action node
 */
declare function createPrimitiveNode(position: XYPosition, primitiveId: string, primitiveName: string, primitiveIcon?: string): WorkflowReactFlowNode;
/**
 * Create a new condition node
 */
declare function createConditionNode(position: XYPosition, label?: string): WorkflowReactFlowNode;
/**
 * Create a new output node
 */
declare function createOutputNode(position: XYPosition, label?: string): WorkflowReactFlowNode;
interface WorkflowGraphData {
    nodes: WorkflowTemplateNode[];
    edges: WorkflowTemplateEdge[];
    viewport?: Viewport;
}
/**
 * Serialize workflow for storage
 */
declare function serializeWorkflow(nodes: WorkflowReactFlowNode[], edges: WorkflowReactFlowEdge[], viewport?: Viewport): WorkflowGraphData;
/**
 * Deserialize workflow for React Flow
 */
declare function deserializeWorkflow(data: WorkflowGraphData): {
    nodes: WorkflowReactFlowNode[];
    edges: WorkflowReactFlowEdge[];
    viewport?: Viewport;
};

/**
 * Built-in Workflow Actions
 *
 * Pre-built actions that can be used in workflows without creating primitives.
 * These handle common operations like HTTP requests, data transformation,
 * notifications, and integrations.
 */

/**
 * Register an action
 */
declare function registerAction(action: ActionDefinition): void;
/**
 * Get an action by name
 */
declare function getAction(name: string): ActionDefinition | undefined;
/**
 * Get all registered actions
 */
declare function getAllActions(): ActionDefinition[];
/**
 * Get actions by category
 */
declare function getActionsByCategory(category: string): ActionDefinition[];
/**
 * Execute a built-in action
 */
declare function executeAction(name: string, input: Record<string, unknown>, context: WorkflowContext): Promise<unknown>;
declare const actionCategories: {
    id: string;
    label: string;
    icon: string;
}[];

/**
 * Workflow Template Service
 *
 * Manages pre-built workflow templates that can be installed and customized.
 * Provides one-click installation of common e-commerce automation patterns.
 */

interface WorkflowTemplateWithDetails extends WorkflowTemplate$2 {
    workflowCount?: number;
}
interface TemplateStepDefinition {
    name: string;
    type: string;
    order: number;
    config?: Record<string, unknown>;
    conditions?: Record<string, unknown>;
}
interface InstallTemplateOptions {
    /** Custom name for the workflow (defaults to template name) */
    name?: string;
    /** Enable the workflow immediately after install */
    enabled?: boolean;
    /** Custom configuration overrides */
    configOverrides?: Record<string, unknown>;
    /** Link to a plugin */
    pluginId?: string;
}
interface InstallResult {
    success: boolean;
    workflow?: Workflow;
    steps?: WorkflowStep[];
    error?: string;
}
/**
 * Get all available workflow templates
 */
declare function getWorkflowTemplates(options?: {
    category?: WorkflowTemplateCategory$1;
    search?: string;
    onlyActive?: boolean;
    includeWorkflowCount?: boolean;
}): Promise<WorkflowTemplateWithDetails[]>;
/**
 * Get a single workflow template by ID or slug
 */
declare function getWorkflowTemplate(idOrSlug: string): Promise<WorkflowTemplateWithDetails | null>;
/**
 * Get templates by category with counts
 */
declare function getTemplatesByCategory(): Promise<Record<WorkflowTemplateCategory$1, WorkflowTemplateWithDetails[]>>;
/**
 * Get popular templates (most installed)
 */
declare function getPopularTemplates(limit?: number): Promise<WorkflowTemplateWithDetails[]>;
/**
 * Get recommended templates based on what's not yet installed
 */
declare function getRecommendedTemplates(limit?: number): Promise<WorkflowTemplateWithDetails[]>;
/**
 * Install a workflow template as a new workflow
 */
declare function installWorkflowTemplate(templateIdOrSlug: string, options?: InstallTemplateOptions): Promise<InstallResult>;
/**
 * Create a new custom template from an existing workflow
 */
declare function createTemplateFromWorkflow(workflowId: string, templateData: {
    name: string;
    slug: string;
    description?: string;
    category: WorkflowTemplateCategory$1;
    icon?: string;
    color?: string;
    tags?: string[];
    documentation?: string;
    exampleUseCase?: string;
}): Promise<WorkflowTemplate$2>;
/**
 * Update a custom template (system templates cannot be modified)
 */
declare function updateTemplate(templateId: string, data: Partial<{
    name: string;
    description: string;
    category: WorkflowTemplateCategory$1;
    icon: string;
    color: string;
    tags: string[];
    documentation: string;
    exampleUseCase: string;
    isActive: boolean;
}>): Promise<WorkflowTemplate$2>;
/**
 * Delete a custom template
 */
declare function deleteTemplate(templateId: string): Promise<void>;
/**
 * Get template usage statistics
 */
declare function getTemplateStats(templateId: string): Promise<{
    totalInstalls: number;
    activeInstalls: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
}>;
/**
 * Get category statistics
 */
declare function getCategoryStats(): Promise<Record<WorkflowTemplateCategory$1, {
    templateCount: number;
    workflowCount: number;
}>>;

/**
 * Workflow Toggle Service
 *
 * Manages workflow enabled/disabled states with validation,
 * event subscription management, and execution tracking.
 */

interface ToggleResult {
    success: boolean;
    workflow?: Workflow;
    error?: string;
    message?: string;
}
interface BulkToggleResult {
    success: boolean;
    results: Array<{
        workflowId: string;
        success: boolean;
        enabled?: boolean;
        error?: string;
    }>;
    enabledCount: number;
    disabledCount: number;
    errorCount: number;
}
interface WorkflowStatus {
    id: string;
    name: string;
    slug: string;
    enabled: boolean;
    triggerType: WorkflowTrigger;
    lastRunAt: Date | null;
    executionCount: number;
    successCount: number;
    failureCount: number;
    successRate: number;
}
/**
 * Enable a workflow
 */
declare function enableWorkflow(workflowId: string): Promise<ToggleResult>;
/**
 * Disable a workflow
 */
declare function disableWorkflow(workflowId: string): Promise<ToggleResult>;
/**
 * Toggle a workflow's enabled state
 */
declare function toggleWorkflow(workflowId: string): Promise<ToggleResult>;
/**
 * Enable multiple workflows
 */
declare function enableWorkflows(workflowIds: string[]): Promise<BulkToggleResult>;
/**
 * Disable multiple workflows
 */
declare function disableWorkflows(workflowIds: string[]): Promise<BulkToggleResult>;
/**
 * Disable all workflows (emergency stop)
 */
declare function disableAllWorkflows(): Promise<BulkToggleResult>;
/**
 * Enable all workflows by category
 */
declare function enableWorkflowsByCategory(templateCategory: string): Promise<BulkToggleResult>;
/**
 * Disable all workflows by trigger type
 */
declare function disableWorkflowsByTrigger(triggerType: WorkflowTrigger): Promise<BulkToggleResult>;
interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Check if a workflow can be enabled
 */
declare function canEnableWorkflow(workflowId: string): Promise<{
    canEnable: boolean;
    validation: ValidationResult;
}>;
/**
 * Get workflow status summary
 */
declare function getWorkflowStatus(workflowId: string): Promise<WorkflowStatus | null>;
/**
 * Get all workflow statuses
 */
declare function getAllWorkflowStatuses(): Promise<WorkflowStatus[]>;
/**
 * Get enabled workflows count by trigger type
 */
declare function getEnabledWorkflowCounts(): Promise<Record<WorkflowTrigger, number>>;
/**
 * Initialize all enabled event-based workflows on app startup
 */
declare function initializeEventWorkflows(): Promise<void>;
/**
 * Cleanup all active subscriptions (for shutdown)
 */
declare function cleanupAllSubscriptions(): void;

/**
 * Stripe Integration Library
 *
 * Provides payment processing, subscriptions, and billing management
 */

/**
 * Get Stripe settings from database
 */
declare function getStripeSettings(): Promise<StripeSettings>;
/**
 * Clear settings cache
 */
declare function clearStripeSettingsCache(): void;
/**
 * Create a Stripe Checkout Session
 */
declare function createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse>;
/**
 * Create a Payment Intent for custom payment flows
 */
declare function createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse>;
/**
 * Capture a payment intent (for manual capture mode)
 */
declare function capturePaymentIntent(paymentIntentId: string, amount?: number): Promise<PaymentIntentResponse>;
/**
 * Cancel a payment intent
 */
declare function cancelPaymentIntent(paymentIntentId: string): Promise<void>;
/**
 * Create or update a Stripe customer
 */
declare function createCustomer(request: CreateCustomerRequest): Promise<string>;
/**
 * Get or create a Stripe customer by email
 */
declare function getOrCreateCustomer(email: string, name?: string): Promise<string>;
/**
 * Create a subscription
 */
declare function createSubscription(request: CreateSubscriptionRequest): Promise<{
    subscriptionId: string;
    status: string;
    clientSecret?: string;
}>;
/**
 * Cancel a subscription
 */
declare function cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void>;
/**
 * Create a refund
 */
declare function createRefund(request: CreateRefundRequest): Promise<RefundResponse>;
/**
 * Get a checkout session by ID
 */
declare function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;
/**
 * Get a payment intent by ID
 */
declare function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
/**
 * Construct and verify a Stripe webhook event
 */
declare function constructWebhookEvent(payload: string | Buffer, signature: string): Promise<Stripe.Event>;
/**
 * Create a billing portal session for customer self-service
 */
declare function createBillingPortalSession(customerId: string, returnUrl: string): Promise<string>;
/**
 * List customer payment methods
 */
declare function listPaymentMethods(customerId: string, type?: 'card' | 'us_bank_account'): Promise<Stripe.PaymentMethod[]>;
/**
 * Get customer invoices
 */
declare function listInvoices(customerId: string, limit?: number): Promise<Stripe.Invoice[]>;
/**
 * Retrieve product by ID
 */
declare function getProduct(productId: string): Promise<Stripe.Product>;
/**
 * Create a product in Stripe
 */
declare function createProduct(name: string, description?: string, images?: string[], metadata?: Record<string, string>): Promise<Stripe.Product>;
/**
 * Create a price for a product
 */
declare function createPrice(productId: string, unitAmount: number, currency?: string, recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count?: number;
}): Promise<Stripe.Price>;

/**
 * Shippo Shipping Service Layer
 *
 * Core integration with Shippo API for:
 * - Address validation
 * - Rate shopping (USPS, UPS, FedEx)
 * - Label generation (PDF/PNG)
 * - Tracking updates
 * - Refunds
 *
 * Configuration is read from:
 * 1. Database (settings table -> shipping group) - preferred
 * 2. Environment variables - fallback
 */

/**
 * Fetch shipping settings from the database
 * Falls back to environment variables if database settings are not available
 * API key always falls back to env var if not in database (for easier setup)
 */
declare function getShippingSettings(): Promise<ShippingSettings>;
/**
 * Clear the settings cache (useful after settings are updated)
 */
declare function clearShippingSettingsCache(): void;
/**
 * Get default ship-from address from database or environment variables
 */
declare function getDefaultFromAddress(): Promise<ShippingAddress>;
/**
 * Validate a shipping address
 * Returns validated/standardized address with any messages
 */
declare function validateAddress(address: ShippingAddress): Promise<ValidatedAddress>;
/**
 * Create a shipment and get rates from all carriers
 */
declare function createShipment(request: CreateShipmentRequest): Promise<ShipmentResponse>;
/**
 * Get rates for an existing shipment
 */
declare function getRates(shipmentId: string): Promise<ShippingRate[]>;
/**
 * Purchase a shipping label
 */
declare function purchaseLabel(request: PurchaseLabelRequest): Promise<LabelResponse>;
/**
 * Get tracking status for a shipment
 */
declare function getTracking(carrier: CarrierType, trackingNumber: string): Promise<TrackingStatus>;
/**
 * Request a refund for a label
 */
declare function refundLabel(transactionId: string): Promise<RefundResponse$1>;
/**
 * Register a webhook for tracking updates
 */
declare function registerTrackingWebhook(webhookUrl: string): Promise<void>;

/**
 * Customer Dashboard Configuration Types
 *
 * Defines the structure for configurable, modular dashboards
 * that can be customized for different business types:
 * - E-commerce: Orders, shipping, payment methods
 * - Consulting: Projects, invoices, scheduling
 * - Services: Bookings, subscriptions, usage
 * - General: Profile, addresses, notifications
 */
/**
 * Available dashboard widget types
 */
type DashboardWidgetType = 'profile-overview' | 'quick-actions' | 'notifications' | 'support' | 'recent-orders' | 'order-tracking' | 'payment-methods' | 'addresses' | 'wishlist' | 'loyalty-points' | 'subscriptions' | 'active-projects' | 'project-milestones' | 'invoices' | 'upcoming-meetings' | 'time-tracking' | 'documents' | 'upcoming-bookings' | 'booking-history' | 'available-services' | 'usage-stats' | 'billing-summary' | 'api-keys';
/**
 * Dashboard preset types
 */
type DashboardPreset = 'ecommerce' | 'consulting' | 'services' | 'booking' | 'saas' | 'custom';
/**
 * Widget configuration
 */
interface DashboardWidget {
    id: string;
    type: DashboardWidgetType;
    title: string;
    description?: string;
    enabled: boolean;
    /** Grid column span (1-4) */
    colSpan?: 1 | 2 | 3 | 4;
    /** Sort order (lower = first) */
    order: number;
    /** Widget-specific settings */
    settings?: Record<string, unknown>;
}
/**
 * Dashboard tab configuration
 */
interface DashboardTab {
    id: string;
    label: string;
    icon?: string;
    slug: string;
    enabled: boolean;
    order: number;
    widgets: DashboardWidget[];
}
/**
 * Full dashboard configuration
 */
interface DashboardConfig {
    /** Preset type for quick configuration */
    preset: DashboardPreset;
    /** Dashboard title shown to customers */
    title: string;
    /** Whether to show the main overview tab */
    showOverview: boolean;
    /** Tabs configuration */
    tabs: DashboardTab[];
    /** Theme customization */
    theme?: {
        primaryColor?: string;
        accentColor?: string;
        borderRadius?: 'none' | 'sm' | 'md' | 'lg';
        cardStyle?: 'flat' | 'bordered' | 'elevated';
    };
}
/**
 * Default widget configurations by type
 */
declare const DEFAULT_WIDGETS: Record<DashboardWidgetType, Partial<DashboardWidget>>;
/**
 * Preset configurations
 */
declare const DASHBOARD_PRESETS: Record<DashboardPreset, Partial<DashboardConfig>>;
/**
 * Get default dashboard configuration for a preset
 */
declare function getDefaultDashboardConfig(preset?: DashboardPreset): DashboardConfig;

/**
 * Customer Dashboard Configuration
 *
 * Functions for managing configurable customer dashboards.
 * Configuration is stored in the settings table under the 'dashboard' group.
 */

/**
 * Get the current dashboard configuration
 */
declare function getDashboardConfig(): Promise<DashboardConfig>;
/**
 * Save dashboard configuration
 */
declare function saveDashboardConfig(config: Partial<DashboardConfig>): Promise<DashboardConfig>;
/**
 * Apply a preset configuration
 */
declare function applyDashboardPreset(preset: DashboardPreset): Promise<DashboardConfig>;
/**
 * Enable or disable a tab
 */
declare function toggleTab(tabId: string, enabled: boolean): Promise<DashboardConfig>;
/**
 * Add a new tab
 */
declare function addTab(tab: Omit<DashboardTab, 'order'>): Promise<DashboardConfig>;
/**
 * Remove a tab
 */
declare function removeTab(tabId: string): Promise<DashboardConfig>;
/**
 * Reorder tabs
 */
declare function reorderTabs(tabIds: string[]): Promise<DashboardConfig>;
/**
 * Add a widget to a tab
 */
declare function addWidget(tabId: string, widget: Omit<DashboardWidget, 'order'>): Promise<DashboardConfig>;
/**
 * Remove a widget from a tab
 */
declare function removeWidget(tabId: string, widgetId: string): Promise<DashboardConfig>;
/**
 * Toggle a widget's enabled state
 */
declare function toggleWidget(tabId: string, widgetId: string, enabled: boolean): Promise<DashboardConfig>;
/**
 * Get available presets with their descriptions
 */
declare function getAvailablePresets(): Array<{
    id: DashboardPreset;
    name: string;
    description: string;
}>;

interface ResolvedRoute {
    type: 'PUCK' | 'CUSTOM' | 'REDIRECT' | 'NOT_FOUND';
    pageId?: string;
    pageContent?: unknown;
    pageTitle?: string;
    pageSlug?: string;
    pageMetaTitle?: string | null;
    pageMetaDescription?: string | null;
    componentKey?: string;
    redirectUrl?: string;
    redirectCode?: number;
}
/**
 * Get route configuration for a given slug
 * Cached per request using React cache
 */
declare const getRouteConfig: (slug: string) => Promise<ResolvedRoute>;
/**
 * Check if a slug is reserved by a route config
 */
declare function isSlugReserved(slug: string): Promise<boolean>;
/**
 * Get all route configurations (for admin)
 */
declare function getAllRouteConfigs(): Promise<({
    page: {
        title: string;
        id: string;
        status: _prisma_client.$Enums.PageStatus;
        slug: string;
    } | null;
} & {
    type: _prisma_client.$Enums.RouteType;
    id: string;
    createdAt: Date;
    description: string | null;
    updatedAt: Date;
    slug: string;
    isActive: boolean;
    pageId: string | null;
    componentKey: string | null;
    redirectUrl: string | null;
    redirectCode: number | null;
})[]>;

/**
 * Combines class names with Tailwind CSS merge support
 */
declare function cn(...inputs: ClassValue[]): string;

export { type ActionDefinition, type ActionHandler, type AddressValidationMessage, type AiSettings, type AllSettings, type AnalyticsEvent, type AnalyticsProvider, type AnalyticsSettings, type ArticleSeo, type AssignRoleRequest, type AuditAction, type AuditLogEntry, BUILT_IN_ROLES, type BrandingSettings, type BreadcrumbItem, type BuiltInRoleName, type BulkEmailMessage, type BulkEmailResult, type BulkToggleResult, CARRIER_OPTIONS, type CarrierAccount, type CarrierType, type CartIdentifier, type CartItem, type CartItemInput, type CartTotals, type CartWithItems, type ConsentSettings, type CreateCategoryInput, type CreateCheckoutSessionRequest, type CreateCustomerRequest, type CreatePaymentIntentRequest, type CreatePluginRequest, type CreatePostInput, type CreatePrimitiveRequest, type CreateRefundRequest, type CreateRoleRequest, type CreateShipmentRequest, type CreateTagInput, type CreateWorkflowInput, type CustomsDeclaration, type CustomsItem, DASHBOARD_PRESETS, DEFAULT_AI_SETTINGS, DEFAULT_ANALYTICS_SETTINGS, DEFAULT_BRANDING_SETTINGS, DEFAULT_CONSENT, DEFAULT_EMAIL_SETTINGS, DEFAULT_FORM_SETTINGS, DEFAULT_GENERAL_SETTINGS, DEFAULT_SECURITY_SETTINGS, DEFAULT_SEO_CONFIG, DEFAULT_STORAGE_SETTINGS, DEFAULT_WIDGETS, DEFAULT_WORKFLOW_TEMPLATES, type DashboardConfig, type DashboardPreset, type DashboardTab, type DashboardWidget, type DashboardWidgetType, type DenyPermissionRequest, type DiscountCalculation, type EcommerceItem, type Edge, type EmailAddress, type EmailAttachment, type EmailEventType, type EmailMessage, type EmailPriority, type EmailProvider, EmailQueue, type EmailSendResult, EmailService, type EmailServiceConfig, type EmailSettings, type EmailStatus, type EmailTemplateData, type EmailWebhookEvent, type EnqueueOptions, type EnvVarStatus, type EventSubscription, type ExecutionContext$1 as ExecutionContext, type ExecutionResult, FIELD_TEMPLATES, type FaqItem, type FieldCondition, type FieldOption, type FormDefinition, type FormField, type FormFieldType, type FormSettings, type FormSubmissionData, type FormSubmissionResponse, type GeneralSettings, type GrantPermissionRequest, type IEmailProvider, type InputMapping, type InstallResult, type InstallTemplateOptions, LABEL_FORMAT_OPTIONS, type LabelFormat, type LabelResponse, type ListPostsOptions, type LocalBusinessData, type LowStockProduct, type MailgunConfig, MediaCreateInput, MediaFilters, MediaListResponse, MediaUpdateInput, MediaWithRelations, type MergeTagData, type Node, type NodeExecutionResult, type NodeTypeDefinition, type NotificationLog, type NotificationPreferences, type NotificationResult, type NotificationType, type OgType, type OrganizationData, PERMISSIONS, PERMISSION_GROUPS, type PageSeo, type PageViewData, type PaginatedReviews, type Parcel, type ParcelTemplate, type PaymentStatus, type Permission, type PermissionCheckResult, type PermissionOverride, type PluginDefinition, PluginRegistry, type PrimitiveDefinition, type ProductSeo, type ProviderConfig, type PurchaseEventData, type PurchaseLabelRequest, type QueueOptions, type QueueStats, type QueuedEmail, REQUIRED_ENV_VARS, ROBOTS_CONFIGS, type RefundRequest, type RefundResponse$1 as RefundResponse, type RemovePermissionOverrideRequest, type RemoveRoleRequest, type RenderedEmail, type ResendConfig, type ResolvedRoute, type ReviewFilters, type ReviewSort, type ReviewStats, type ReviewSubmission, type RoleData, type RoleWithAssignments, SHIPMENT_STATUSES, type SecuritySettings, type SendGridConfig, type SeoConfig, type SesConfig, type SettingGroup, type ShipmentExtras, type ShipmentMessage, type ShipmentResponse, type ShipmentStatusOption, type ShippingAddress, type ShippingRate, type ShippingSettings, type ShippoConfig, type ShippoElementsAuthResponse, type ShippoElementsLabel, type ShippoWebhookPayload, type SiteSettingsData, type SmtpConfig, type StandardEventName, type StockReservationResult, type StorageSettings, type StripeSettings, type StructuredDataType, type TemplateStepDefinition, type ToggleResult, type TrackingEvent, type TrackingStatus, type TrackingStatusType, type TriggerWorkflowInput, type UpdateCategoryInput, type UpdatePostInput, type UpdateRoleRequest, type UpdateTagInput, type UpdateWorkflowInput, type UserPermissionSummary, type UserProperties, type UserWithPermissions, type ValidatedAddress, type ValidationContext, type ValidationErrorCode, type ValidationResult$1 as ValidationResult, type ValidationRule, type ValidationRuleType, type Viewport, type WorkflowCondition, type WorkflowContext, type WorkflowCreateInput, type WorkflowEdgeData, type WorkflowEvent, type WorkflowEventType, type WorkflowExecutionResult, type WorkflowExecutionStatus, type WorkflowExecutionWithDetails, type WorkflowGraphData, type WorkflowListOptions, type WorkflowNodeConfig, type WorkflowNodeData, type WorkflowNodeType, type WorkflowReactFlowEdge, type WorkflowReactFlowNode, type WorkflowStage, type WorkflowStatus, type WorkflowTemplate, type WorkflowTemplateCategory, type WorkflowTemplateEdge, type WorkflowTemplateNode, type WorkflowTemplateWithDetails, type WorkflowUpdateInput, type WorkflowValidationError, type WorkflowValidationResult, type WorkflowValidationWarning, type WorkflowWithNodes, type WorkflowWithStages, type XYPosition, actionCategories, addError, addSubscriberTags, addTab, addToCart, addWidget, applyDashboardPreset, applyDiscount, approveReview, assignRole, assignWorkflowToOrder, autoLayoutNodes, bulkApproveReviews, bulkDeleteMedia, bulkDeleteReviews, bulkMoveMedia, bulkRejectReviews, bulkRestoreMedia, bulkTagMedia, bulkUntagMedia, calculateCartTotals, calculateDiscount, canCustomerReviewProduct, canEnableWorkflow, cancelPaymentIntent, cancelSubscription, cancelWorkflowExecution, capturePaymentIntent, checkAndNotifyBackInStock, checkEmailStatus, checkPermission, cleanupAllSubscriptions, cleanupExpiredCarts, cleanupExpiredReservations, clearAnalyticsSettingsCache, clearCart, clearPrimitiveCache, clearSeoConfigCache, clearSettingsCache, clearShippingSettingsCache, clearStripeSettingsCache, cloneContext, cn, confirmSubscription, constructWebhookEvent, convertCart, convertReservationsToOrder, createBillingPortalSession, createCategory, createCheckoutSession, createClickTrackingUrl, createConditionNode, createCustomer, createForm, createIterationContext, createMedia, createOpenTrackingUrl, createOutputNode, createPaymentIntent, createPost, createPreferenceCenterUrl, createPrice, createPrimitiveNode, createProduct, createRefund, createShipment, createStripeCoupon, createStripePromotionCode, createSubscription, createTag, createTemplateFromWorkflow, createTriggerNode, createUnsubscribeUrl, createWorkflow, createWorkflowContext, prisma as db, decrypt, deductStockForOrder, deleteCategory, deleteForm, deleteMedia, deletePost, deleteReview, deleteStripeDiscount, deleteSubmission, deleteTag, deleteTemplate, deleteWorkflow, denyPermission, deserializeContext, deserializeWorkflow, disableAllWorkflows, disableWorkflow, disableWorkflows, disableWorkflowsByTrigger, duplicateWorkflow, emailService, emit, emitAsync, enableWorkflow, enableWorkflows, enableWorkflowsByCategory, encrypt, evaluateCondition, evaluateExpression, eventBus, events, executeAction, executeByIdOrName, executePrimitive, executePrimitiveByName, executeWorkflow, executeWorkflowInstance, extractMergeTags, flagReview, formatDiscount, fromReactFlowEdges, fromReactFlowNodes, generateArticleMetadata, generateArticleSchema, generateBreadcrumbSchema, generateEdgeId, generateFaqSchema, generateGtagScript, generateId, generateLocalBusinessSchema, generateMatomoScript, generateMetadata, generateNodeId, generateOrganizationSchema, generateProductMetadata, generateProductSchema, generateSubscriptionToken, generateTrackingToken, generateViewport, generateWebsiteSchema, getAbandonedCartsForRecovery, getAction, getActionsByCategory, getAiSettings, getAllActions, getAllPrimitives, getAllRouteConfigs, getAllSettings, getAllWorkflowStatuses, getAnalyticsSettings, getAnalyticsSummary, getApplicableItems, getAvailablePresets, getAvailableStock, getBrandingSettings, getCartStats, getCategory, getCategoryBySlug, getCategoryStats, getCheckoutSession, getContextSummary, getDashboardConfig, getDefaultDashboardConfig, getDefaultFromAddress, getDefaultWorkflow, getDiscountSummary, getEmailQueue, getEmailSettings, getEnabledWorkflowCounts, getEnvVarStatus, getExecutionStats, getForm, getFormSubmissions, getFormatters, getGeneralSettings, getLowStockItems, getMedia, getMediaStats, getOrCreateCart, getOrCreateCustomer, getOrCreateSiteSettings, getOrCreateTrackedLink, getOrdersForReviewRequest, getPaymentIntent, getPluginRegistry, getPopularTemplates, getPost, getPostBySlug, getPrimitive, getPrimitiveByName, getPrimitiveCategories, getPrimitiveExecutionHistory, getPrimitiveInputSchema, getPrimitivesByCategory, getProduct, getProductReviewStats, getProductReviews, getQueueStats, getRates, getRecentExecutions, getRecommendedTemplates, getReviewById, getReviewDashboardStats, getReviews, getRouteConfig, getScheduledWorkflows, getSecuritySettings, getSeoConfig, getSettings, getShippingSettings, getSiteSettings, getStorageSettings, getStripeSettings, getSubscriberPreferences, getTag, getTagBySlug, getTemplateStats, getTemplatesByCategory, getTracking, getUnsubscribeHeaders, getUserPermissions, getWorkflow, getWorkflowExecutionStatus, getWorkflowExecutions, getWorkflowStatus, getWorkflowTemplate, getWorkflowTemplates, grantPermission, hasAllPermissions, hasAnyPermission, hasPermission, hash, importFromStripe, incrementPostViews, incrementVersion, initializeEventWorkflows, initializeOrderWorkflow, injectOpenTrackingPixel, installWorkflowTemplate, isEncrypted, isFirstOrderForUser, isPrimitiveAvailable, isSlugReserved, isSuperAdmin, listCategories, listInvoices, listMedia, listPaymentMethods, listPosts, listTags, listUnimportedStripeCoupons, listWorkflows, loadBuiltInPrimitives, logAuditEvent, markAbandonedCarts, markCartRecovered, markRecoveryEmailSent, markSubmissionRead, mergeCartsOnLogin, nodeTypeDefinitions, parseMailgunWebhook, parseMergeTags, parseResendWebhook, parseSendGridWebhook, parseSesWebhook, prisma, processEmailForTracking, processEmailWebhookEvent, purchaseLabel, queueEmail, queueEmails, queueUrgentEmail, recordDiscountUsage, recordEmailClick, recordEmailOpen, refundLabel, registerAction, registerFormatter, registerTrackingWebhook, rejectReview, releaseReservation, releaseSessionReservations, removeDiscount, removeFromCart, removePermissionOverride, removeRole, removeSubscriberTags, removeTab, removeWidget, renderJsonLd, reorderTabs, reserveStock, resetPluginRegistry, resolveInputMapping, resolveNodeInputs, resolveTemplate, resolveValue, respondToReview, restoreMedia, rewriteLinksForTracking, rewriteLinksWithTracking, safeDecrypt, safeEncrypt, saveDashboardConfig, scheduleEmail, seedBuiltInRoles, sendBackInStockNotifications, sendBulkEmail, sendDeliveryConfirmation, sendEmail, sendEmailWithMergeTags, sendLowStockAlert, sendOrderConfirmation, sendRefundNotification, sendReviewRequestEmail, sendShippingNotification, serializeContext, serializeWorkflow, setNodeOutput, setVariable, shouldRunScheduledWorkflow, slugify, starSubmission, submitForm, submitReview, subscribe, subscribeEmail, subscribeToBackInStock, syncDiscountToStripe, testPrimitive, toReactFlowEdges, toReactFlowNodes, toggleStripePromotionCode, toggleTab, toggleWidget, toggleWorkflow, trackPurchase, trackServerEvent, triggerWorkflowByWebhook, triggerWorkflowManually, unsubscribe, unsubscribeById, unsubscribeEmail, unsubscribeFromBackInStock, updateAnnouncementBarConfig, updateCartEmail, updateCartItem, updateCategory, updateFooterConfig, updateForm, updateHeaderConfig, updateMedia, updatePost, updateReview, updateSettings, updateSiteSettings, updateSubscriberPreferences, updateTag, updateTemplate, updateWorkflow, validateAddress, validateDiscountCode, validateFormData, validateHandlerSecurity, validateMergeTagData, validatePrimitiveInput, validateStripePromotionCode, validateWorkflow, verifyHash, verifyMailgunWebhook, verifyResendWebhook, verifySendGridWebhook, verifySubscriptionToken, voteReview };
