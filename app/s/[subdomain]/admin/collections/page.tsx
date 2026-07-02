/**
 * Collections — Grainy catalog surface. Lists product collections (Prisma
 * categories) read from /api/cms/shop/collections. Reachable via the catalog
 * sub-nav on the products screen.
 */

import CollectionsScreen from "@/components/cms/admin/catalog/collections-screen";

export default function CollectionsPage() {
  return <CollectionsScreen />;
}
