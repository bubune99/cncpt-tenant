import { MediaManager } from '../../../components/admin/media'

export const metadata = {
  title: 'Media Manager | Admin',
  description: 'Manage your files, images, videos, and documents',
}

export default function MediaPage() {
  return (
    <div className="p-6" data-help-key="admin.media.page">
      <div className="mb-6" data-help-key="admin.media.header">
        <h1 className="text-2xl font-bold tracking-tight">Media Manager</h1>
        <p className="text-muted-foreground">
          Manage your files, images, videos, and documents
        </p>
      </div>

      <div data-help-key="admin.media.manager">
        <MediaManager />
      </div>
    </div>
  )
}
