// Journal editor shared types

export type JournalTab = 'write' | 'blocks' | 'structure' | 'distribute';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
export type PostVisibility = 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED' | 'MEMBERS_ONLY';

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
