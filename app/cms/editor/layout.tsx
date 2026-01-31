/**
 * Editor Layout
 *
 * Layout for the visual page editor. Uses a minimal layout
 * without the main navigation to maximize editing space.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Editor',
  description: 'Visual page editor',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
}
