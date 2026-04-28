import { MediaManager } from '@/components/cms/admin/media'

// Note: metadata export removed as this page is dynamically imported by admin-pages
// which is a client component. Metadata should be set at the route level instead.

export default function MediaPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8" data-help-key="admin.media.page" data-tour-id="media-page">
      <div className="mb-6" data-help-key="admin.media.header">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-tour-id="media-heading">Media Manager</h1>
        <p className="text-muted-foreground">
          Manage your files, images, videos, and documents
        </p>
      </div>

      <div data-help-key="admin.media.manager" data-tour-id="media-manager">
        <MediaManager />
      </div>
    </div>
  )
}
