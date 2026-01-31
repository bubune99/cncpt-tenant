'use client';

import { useParams } from 'next/navigation';
import { ProductEditor } from '../../../../../components/products/ProductEditor';

export default function ConfigureProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return <ProductEditor mode="edit" productId={productId} />;
}
