/**
 * Email Designer Layout
 *
 * Full-screen layout for Puck editor without admin shell interference
 */

// Import Puck CSS at layout level to ensure it's loaded
import '@puckeditor/core/puck.css';

export default function EmailDesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return children directly without AdminShell wrapper
  // This gives Puck full control of the layout
  return <>{children}</>;
}
