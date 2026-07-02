'use client';

/**
 * ProductsCatalog — the Grainy products list controller.
 *
 * A family picker (Physical / Digital / Services) opens focused per-family
 * tables whose columns + filters match that kind of product. Built on the
 * shared Grainy primitives + grainy.css (`.table-wrap`, `.bulkbar`,
 * `.filter-chip`, `.badge-*`), replacing the old bespoke catalog.css.
 *
 * Landing lives in products-landing.tsx; the table + bulk actions + column
 * customizer live in family-table.tsx. Data + mutations are in catalog-model.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { useAuth } from '@/hooks/use-auth';
import { CatalogSubnav } from './catalog-subnav';
import { ProductsLanding } from './products-landing';
import { FamilyTable } from './family-table';
import { fetchCatalog, type Family, type Prod } from './catalog-model';

export default function ProductsCatalog(): React.ReactElement {
  const { user } = useAuth();
  const { buildPath } = useCMSConfig();
  const [products, setProducts] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setProducts(await fetchCatalog());
    } catch (e) {
      console.error('Error fetching products:', e);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const goNew = (f?: Family | null) => {
    const t = f === 'digital' ? '?type=DIGITAL' : f === 'service' ? '?type=SERVICE' : '';
    window.location.href = buildPath(`/admin/products/new${t}`);
  };

  return (
    <div className="main-inner" style={{ padding: '4px 2px' }} data-tour-id="products-page">
      <CatalogSubnav active="products" />
      {family ? (
        <FamilyTable
          family={family}
          products={products}
          onBack={() => setFamily(null)}
          onNew={goNew}
          onMutate={load}
          buildPath={buildPath}
        />
      ) : (
        <ProductsLanding products={products} onPick={setFamily} onNew={() => goNew(null)} onRefresh={load} loading={loading} />
      )}
      {loading && products.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <RefreshCw size={18} className="animate-spin" style={{ display: 'inline' }} /> Loading catalog…
        </div>
      )}
    </div>
  );
}
