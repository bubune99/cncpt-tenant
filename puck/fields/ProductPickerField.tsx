'use client';

/**
 * Custom Puck Field: Product Picker
 *
 * Allows users to select a product from the database to embed in their page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/cms/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/cms/ui/dialog';
import { Input } from '@/components/cms/ui/input';
import { Label } from '@/components/cms/ui/label';
import { ScrollArea } from '@/components/cms/ui/scroll-area';
import { ShoppingBag, Loader2, Check, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: Array<{ url: string }>;
  status: string;
}

interface ProductPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ProductPickerField({
  value,
  onChange,
  label = 'Product',
}: ProductPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/products?status=ACTIVE&limit=50';
      if (search) {
        url += '&search=' + encodeURIComponent(search);
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (value) {
      fetch('/api/products/' + value)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setSelectedProduct(data);
          }
        })
        .catch(console.error);
    }
  }, [value]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadProducts();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(loadProducts, 300);
      return () => clearTimeout(timer);
    }
  }, [search, isOpen, loadProducts]);

  const handleSelect = (product: Product) => {
    onChange(product.id);
    setSelectedProduct(product);
    setIsOpen(false);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start" type="button">
            <ShoppingBag className="h-4 w-4 mr-2" />
            {selectedProduct ? selectedProduct.name : 'Select a product...'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Product</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-1">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      value === product.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelect(product)}
                  >
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block truncate">{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    {value === product.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            onChange('');
            setSelectedProduct(null);
          }}
        >
          Clear selection
        </Button>
      )}
    </div>
  );
}

/**
 * Puck custom field adapter
 */
export const productPickerFieldConfig = {
  type: 'custom' as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ({ value, onChange }: any) => (
    <ProductPickerField value={value || ''} onChange={(v) => onChange(v || '')} />
  ),
};

export default ProductPickerField;
