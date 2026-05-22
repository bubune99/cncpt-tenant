// Journal editor shared types

export type JournalTab = 'write' | 'blocks' | 'structure' | 'distribute';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
export type PostVisibility = 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED' | 'MEMBERS_ONLY';

// ── API enums (mirror Prisma enums) ──────────────────────────────────────────

export type ApiDistributionChannel =
  | 'WEB'
  | 'NEWSLETTER'
  | 'RSS'
  | 'TWITTER_X'
  | 'MASTODON'
  | 'INSTAGRAM';

export type ApiChannelPublishStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

// ── API response shapes (from A9 route files) ────────────────────────────────

/** Shape returned by GET /api/cms/blog/posts/[id]/channels items */
export interface ApiPostChannel {
  readonly id: string;
  readonly postId: string;
  readonly channel: ApiDistributionChannel;
  readonly enabled: boolean;
  readonly copy: string | null;
  readonly scheduledAt: string | null;
  readonly publishedAt: string | null;
  readonly status: ApiChannelPublishStatus;
}

/** Shape returned by GET /api/cms/blog/series items (includes _count.posts) */
export interface ApiSeries {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly postCount: number;
  readonly position: number;
}

/** Shape returned by GET /api/cms/blog/posts/[id]/series items */
export interface ApiPostSeries {
  readonly postId: string;
  readonly seriesId: string;
  readonly position: number;
  readonly series: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly postCount: number;
  };
}

/** Shape returned by GET /api/cms/blog/posts/[id]/contributors items */
export interface ApiContributor {
  readonly postId: string;
  readonly userId: string;
  readonly role: string;
  readonly position: number;
  readonly user: {
    readonly id: string;
    readonly name: string | null;
    readonly email: string;
    readonly avatar: string | null;
  };
}

/** Shape returned by GET /api/cms/blog/posts/[id]/related items */
export interface ApiRelatedPost {
  readonly postId: string;
  readonly relatedPostId: string;
  readonly position: number;
  readonly relatedPost: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly status: PostStatus;
  };
}

export type BlockKind =
  | 'P'
  | 'H2'
  | 'QUOTE'
  | 'IMAGE'
  | 'GALLERY'
  | 'EMBED'
  | 'DIV'
  | 'CODE'
  | 'PROD'
  | 'NL';

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface Tag {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface Contributor {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly role: string;
  readonly byline: boolean;
  readonly credit: 'primary' | 'credit' | 'colophon' | 'no-byline';
}

export interface SeriesProgress {
  readonly title: string;
  readonly position: number;
  readonly total: number;
  readonly items: ReadonlyArray<'live' | 'this' | 'draft' | 'plan'>;
}

export interface RelatedEntry {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly readTime: string;
  readonly date: string;
  readonly relation: 'prev' | 'next' | 'auto';
}

export interface ShopLink {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly inventory: string;
  readonly price: string;
}

export interface ChannelConfig {
  readonly web: ChannelState;
  readonly newsletter: ChannelState;
  readonly rss: ChannelState;
  readonly x: ChannelState;
  readonly mastodon: ChannelState;
  readonly instagram: ChannelState;
}

export interface ChannelState {
  readonly enabled: boolean;
  readonly status: 'live' | 'queued' | 'draft' | 'auto';
  readonly scheduledAt?: string;
}

export interface JournalPostData {
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly contentHtml: string;
  readonly content: object | null;
  readonly status: PostStatus;
  readonly visibility: PostVisibility;
  readonly categoryIds: ReadonlyArray<string>;
  readonly tagIds: ReadonlyArray<string>;
  readonly featured: boolean;
  readonly allowComments: boolean;
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly coverImageUrl?: string;
  readonly series?: string;
  readonly seriesPosition?: number;
}

export interface JournalEditorProps {
  readonly postId?: string;
  readonly initialData?: Partial<JournalPostData>;
  readonly categories: ReadonlyArray<Category>;
  readonly tags: ReadonlyArray<Tag>;
  readonly onSave: (data: JournalPostData, publish: boolean) => Promise<void>;
  readonly onDelete?: () => Promise<void>;
  readonly isSaving?: boolean;
}
