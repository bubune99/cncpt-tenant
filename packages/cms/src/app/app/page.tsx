/**
 * App Home Page
 *
 * Main landing page for the application workspace.
 */

export default function AppPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Your personal application workspace.
        </p>
      </div>

      {/* Getting started */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Create a Page</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use the visual editor to create custom pages within your workspace.
          </p>
          <p className="text-xs text-muted-foreground">
            Click the + button in the Pages section of the sidebar.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Manage Files</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload and organize your files in the Files section.
          </p>
          <p className="text-xs text-muted-foreground">
            Supports images, documents, and more.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Calendar</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Track events and deadlines in your personal calendar.
          </p>
          <p className="text-xs text-muted-foreground">
            Sync with external calendars coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
