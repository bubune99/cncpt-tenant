/**
 * Products — Atlas Grainy type-split catalog.
 *
 * The old single shadcn table is replaced by ProductCatalog: a family picker
 * (Physical / Digital / Services) that opens focused, per-family tables with
 * columns + filters tailored to each kind of product. Data still comes from
 * /api/cms/products; families derive from the Prisma ProductType enum.
 */

import ProductCatalog from "./ProductCatalog";

export default function ProductsPage() {
  return <ProductCatalog />;
}
