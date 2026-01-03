import { MediaManager } from '@/components/admin/media'

export const metadata = {
  title: 'Media Manager | Admin',
  description: 'Manage your files, images, videos, and documents',
}

export default function MediaPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Media Manager</h1>
        <p className="text-muted-foreground">
          Manage your files, images, videos, and documents
        </p>
      </div>

      <MediaManager />
    </div>
  )
}
