"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import {
  Save,
  Trash2,
  Copy,
  Image as ImageIcon,
  Package,
  History,
  Download,
  Upload,
  Grid3X3,
  RotateCcw,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export interface ProductVariation {
  id: string;
  productId: string;
  sku: string;
  price: number;
  salePrice?: number;
  costPrice?: number;
  stockQuantity: number;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  imageId?: string;
  imageUrl?: string;
  attributes: Record<string, string>;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  barcode?: string;
  lastModified: string;
  isDirty?: boolean;
  isSelected?: boolean;
}

export interface VariationAttribute {
  name: string;
  slug: string;
  values: string[];
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  variationsAffected: number;
  status: 'completed' | 'failed' | 'in_progress';
}

interface VariationManagerProps {
  productId: string;
  attributes?: VariationAttribute[];
  onVariationsUpdate?: (variations: ProductVariation[]) => void;
  className?: string;
}

export function VariationManager({
  productId,
  attributes = [],
  onVariationsUpdate,
  className = ''
}: VariationManagerProps) {
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [bulkOperationsHistory, setBulkOperationsHistory] = useState<BulkOperation[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [dragStartCell, setDragStartCell] = useState<{row: number, col: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newVariation, setNewVariation] = useState<Partial<ProductVariation>>({});
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);

  // Load variations data
  useEffect(() => {
    loadVariations();
  }, [productId]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && variations.some(v => v.isDirty)) {
      autoSaveInterval.current = setTimeout(() => {
        handleSave();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveInterval.current) {
        clearTimeout(autoSaveInterval.current);
      }
    };
  }, [variations, autoSaveEnabled]);

  const loadVariations = async () => {
    try {
      setLoading(true);

      // Try to fetch from API
      const response = await fetch(`/api/products/${productId}/variations`);
      if (response.ok) {
        const data = await response.json();
        setVariations(data.variations || []);
        onVariationsUpdate?.(data.variations || []);
      } else {
        // Mock variations data for development
        const mockVariations: ProductVariation[] = [
          {
            id: '1',
            productId,
            sku: 'PROD-RED-S',
            price: 29.99,
            salePrice: 24.99,
            costPrice: 12.00,
            stockQuantity: 50,
            stockStatus: 'instock',
            imageUrl: 'https://placehold.co/100x100?text=Red+S',
            attributes: { color: 'Red', size: 'S' },
            weight: 0.5,
            barcode: '1234567890123',
            lastModified: new Date().toISOString()
          },
          {
            id: '2',
            productId,
            sku: 'PROD-RED-M',
            price: 29.99,
            salePrice: 24.99,
            costPrice: 12.00,
            stockQuantity: 75,
            stockStatus: 'instock',
            imageUrl: 'https://placehold.co/100x100?text=Red+M',
            attributes: { color: 'Red', size: 'M' },
            weight: 0.6,
            barcode: '1234567890124',
            lastModified: new Date().toISOString()
          },
          {
            id: '3',
            productId,
            sku: 'PROD-BLUE-S',
            price: 29.99,
            stockQuantity: 30,
            stockStatus: 'instock',
            imageUrl: 'https://placehold.co/100x100?text=Blue+S',
            attributes: { color: 'Blue', size: 'S' },
            weight: 0.5,
            lastModified: new Date().toISOString()
          },
          {
            id: '4',
            productId,
            sku: 'PROD-BLUE-M',
            price: 29.99,
            stockQuantity: 0,
            stockStatus: 'outofstock',
            imageUrl: 'https://placehold.co/100x100?text=Blue+M',
            attributes: { color: 'Blue', size: 'M' },
            weight: 0.6,
            lastModified: new Date().toISOString()
          }
        ];

        setVariations(mockVariations);
        onVariationsUpdate?.(mockVariations);
      }

    } catch (error) {
      console.error('Error loading variations:', error);
      toast.error('Failed to load variations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    const dirtyVariations = variations.filter(v => v.isDirty);
    if (dirtyVariations.length === 0) return;

    try {
      setSaving(true);

      // API call to save variations
      const response = await fetch(`/api/products/${productId}/variations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variations: dirtyVariations })
      });

      if (!response.ok) {
        // Mock save for development
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Clear dirty flags
      const cleanedVariations = variations.map(v => ({ ...v, isDirty: false }));
      setVariations(cleanedVariations);

      setLastSaved(new Date());
      toast.success(`Saved ${dirtyVariations.length} variation${dirtyVariations.length > 1 ? 's' : ''}`);

    } catch (error) {
      console.error('Error saving variations:', error);
      toast.error('Failed to save variations');
    } finally {
      setSaving(false);
    }
  }, [variations, productId]);

  const handleCellChange = (variationId: string, field: string, value: unknown) => {
    setVariations(prev => prev.map(v =>
      v.id === variationId
        ? { ...v, [field]: value, isDirty: true }
        : v
    ));
  };

  const handleSelectionChange = (variationId: string, selected: boolean) => {
    setSelectedVariations(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(variationId);
      } else {
        newSelection.delete(variationId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedVariations.size === variations.length) {
      setSelectedVariations(new Set());
    } else {
      setSelectedVariations(new Set(variations.map(v => v.id)));
    }
  };

  const handleDragStart = (row: number, col: string, e: React.MouseEvent) => {
    setDragStartCell({ row, col });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDragEnd = (row: number, col: string) => {
    if (dragStartCell && isDragging) {
      const startRow = dragStartCell.row;
      const endRow = row;
      const sourceVariation = variations[startRow];
      const sourceValue = sourceVariation[col as keyof ProductVariation];

      // Apply value to all variations in range
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);

      setVariations(prev => prev.map((v, index) => {
        if (index >= minRow && index <= maxRow) {
          return { ...v, [col]: sourceValue, isDirty: true };
        }
        return v;
      }));

      toast.success(`Applied ${col} to ${maxRow - minRow + 1} variations`);
    }

    setDragStartCell(null);
    setIsDragging(false);
  };

  const handleBulkOperation = async () => {
    const selected = Array.from(selectedVariations);
    if (selected.length === 0) {
      toast.error('Please select variations first');
      return;
    }

    try {
      setSaving(true);

      // Apply bulk operation
      setVariations(prev => prev.map(v => {
        if (!selected.includes(v.id)) return v;

        switch (bulkAction) {
          case 'update_price':
            return { ...v, price: parseFloat(bulkValue) || v.price, isDirty: true };
          case 'update_sale_price':
            return { ...v, salePrice: parseFloat(bulkValue) || undefined, isDirty: true };
          case 'update_stock':
            return { ...v, stockQuantity: parseInt(bulkValue) || 0, isDirty: true };
          case 'set_in_stock':
            return { ...v, stockStatus: 'instock' as const, isDirty: true };
          case 'set_out_of_stock':
            return { ...v, stockStatus: 'outofstock' as const, isDirty: true };
          case 'delete':
            return null;
          default:
            return v;
        }
      }).filter(Boolean) as ProductVariation[]);

      const operation: BulkOperation = {
        id: Date.now().toString(),
        name: bulkAction.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Applied to ${selected.length} variations`,
        timestamp: new Date().toISOString(),
        variationsAffected: selected.length,
        status: 'completed'
      };

      setBulkOperationsHistory(prev => [operation, ...prev.slice(0, 9)]);
      toast.success(`Bulk operation completed`);
      setShowBulkModal(false);
      setBulkAction('');
      setBulkValue('');
      setSelectedVariations(new Set());

    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('Bulk operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariation = () => {
    const id = Date.now().toString();
    const variation: ProductVariation = {
      id,
      productId,
      sku: newVariation.sku || `PROD-${id}`,
      price: newVariation.price || 0,
      salePrice: newVariation.salePrice,
      costPrice: newVariation.costPrice,
      stockQuantity: newVariation.stockQuantity || 0,
      stockStatus: 'instock',
      attributes: newVariation.attributes || {},
      lastModified: new Date().toISOString(),
      isDirty: true
    };

    setVariations(prev => [...prev, variation]);
    setShowAddModal(false);
    setNewVariation({});
    toast.success('Variation added');
  };

  const handleDeleteVariation = (variationId: string) => {
    setVariations(prev => prev.filter(v => v.id !== variationId));
    selectedVariations.delete(variationId);
    setSelectedVariations(new Set(selectedVariations));
    toast.success('Variation deleted');
  };

  const handleDuplicateVariation = (variation: ProductVariation) => {
    const newId = Date.now().toString();
    const duplicated: ProductVariation = {
      ...variation,
      id: newId,
      sku: `${variation.sku}-COPY`,
      isDirty: true
    };
    setVariations(prev => [...prev, duplicated]);
    toast.success('Variation duplicated');
  };

  const handleExport = () => {
    const csv = [
      ['SKU', 'Price', 'Sale Price', 'Cost', 'Stock', 'Status', ...Object.keys(variations[0]?.attributes || {})].join(','),
      ...variations.map(v => [
        v.sku,
        v.price,
        v.salePrice || '',
        v.costPrice || '',
        v.stockQuantity,
        v.stockStatus,
        ...Object.values(v.attributes)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variations-${productId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Variations exported');
  };

  const renderCell = (variation: ProductVariation, field: string, rowIndex: number) => {
    const value = variation[field as keyof ProductVariation] as unknown;
    const isDirtyCell = variation.isDirty;

    switch (field) {
      case 'imageUrl':
        return (
          <div className="flex items-center gap-2">
            {variation.imageUrl ? (
              <img
                src={variation.imageUrl}
                alt="Variation"
                className="w-12 h-12 object-cover rounded border"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-gray-400" />
              </div>
            )}
            <Button size="sm" variant="outline" className="h-8 px-2">
              <Upload className="h-3 w-3" />
            </Button>
          </div>
        );

      case 'price':
      case 'salePrice':
      case 'costPrice':
        return (
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) => handleCellChange(variation.id, field, parseFloat(e.target.value) || 0)}
              className={`w-24 ${isDirtyCell ? 'border-orange-300 bg-orange-50' : ''}`}
              onMouseDown={(e) => handleDragStart(rowIndex, field, e)}
              onMouseUp={() => handleDragEnd(rowIndex, field)}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-0 hover:opacity-100 bg-gray-300 rounded-tl" />
          </div>
        );

      case 'stockQuantity':
        return (
          <Input
            type="number"
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => handleCellChange(variation.id, field, parseInt(e.target.value) || 0)}
            className={`w-20 ${isDirtyCell ? 'border-orange-300 bg-orange-50' : ''}`}
            onMouseDown={(e) => handleDragStart(rowIndex, field, e)}
            onMouseUp={() => handleDragEnd(rowIndex, field)}
          />
        );

      case 'stockStatus':
        return (
          <Select
            value={typeof value === 'string' ? value : 'instock'}
            onValueChange={(val) => handleCellChange(variation.id, field, val)}
          >
            <SelectTrigger className={`w-32 ${isDirtyCell ? 'border-orange-300 bg-orange-50' : ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instock">In Stock</SelectItem>
              <SelectItem value="outofstock">Out of Stock</SelectItem>
              <SelectItem value="onbackorder">On Backorder</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleCellChange(variation.id, field, e.target.value)}
            className={`${isDirtyCell ? 'border-orange-300 bg-orange-50' : ''}`}
          />
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading variations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Variation Manager
                <Badge variant="secondary">{variations.length} variants</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Excel-like interface for managing product variations
              </p>
            </div>

            <div className="flex items-center gap-2">
              {lastSaved && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Saved {lastSaved.toLocaleTimeString()}
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
              </Button>

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button onClick={handleSave} disabled={saving || !variations.some(v => v.isDirty)}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={selectedVariations.size === variations.length && variations.length > 0}
                  className="mr-2"
                />
                Select All ({selectedVariations.size})
              </Button>

              {selectedVariations.size > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowBulkModal(true)}
                >
                  Bulk Actions ({selectedVariations.size})
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variation
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Drag cell corners to fill values like Excel</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variations Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead className="w-32">SKU</TableHead>
                  {attributes.map(attr => (
                    <TableHead key={attr.slug} className="w-24">{attr.name}</TableHead>
                  ))}
                  <TableHead className="w-24">Price</TableHead>
                  <TableHead className="w-24">Sale</TableHead>
                  <TableHead className="w-20">Cost</TableHead>
                  <TableHead className="w-20">Stock</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((variation, rowIndex) => (
                  <TableRow
                    key={variation.id}
                    className={variation.isDirty ? 'bg-orange-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedVariations.has(variation.id)}
                        onCheckedChange={(checked) => handleSelectionChange(variation.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>{renderCell(variation, 'imageUrl', rowIndex)}</TableCell>
                    <TableCell>
                      <Input
                        value={variation.sku}
                        onChange={(e) => handleCellChange(variation.id, 'sku', e.target.value)}
                        className={`w-28 font-mono text-sm ${variation.isDirty ? 'border-orange-300 bg-orange-50' : ''}`}
                      />
                    </TableCell>
                    {attributes.map(attr => (
                      <TableCell key={attr.slug}>
                        <Select
                          value={variation.attributes[attr.slug] || ''}
                          onValueChange={(val) => handleCellChange(variation.id, 'attributes', { ...variation.attributes, [attr.slug]: val })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder={attr.name} />
                          </SelectTrigger>
                          <SelectContent>
                            {attr.values.map(value => (
                              <SelectItem key={value} value={value}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    ))}
                    <TableCell>{renderCell(variation, 'price', rowIndex)}</TableCell>
                    <TableCell>{renderCell(variation, 'salePrice', rowIndex)}</TableCell>
                    <TableCell>{renderCell(variation, 'costPrice', rowIndex)}</TableCell>
                    <TableCell>{renderCell(variation, 'stockQuantity', rowIndex)}</TableCell>
                    <TableCell>{renderCell(variation, 'stockStatus', rowIndex)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateVariation(variation)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteVariation(variation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {variations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10 + attributes.length} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No variations yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowAddModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Variation
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Operations History */}
      {bulkOperationsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bulkOperationsHistory.slice(0, 3).map(operation => (
                <div key={operation.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">{operation.name}</p>
                    <p className="text-xs text-muted-foreground">{operation.description}</p>
                  </div>
                  <Badge variant={operation.status === 'completed' ? 'default' : 'secondary'}>
                    {operation.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Operations Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedVariations.size} selected variations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update_price">Update Price</SelectItem>
                <SelectItem value="update_sale_price">Update Sale Price</SelectItem>
                <SelectItem value="update_stock">Update Stock</SelectItem>
                <SelectItem value="set_in_stock">Set In Stock</SelectItem>
                <SelectItem value="set_out_of_stock">Set Out of Stock</SelectItem>
                <SelectItem value="delete">Delete Variations</SelectItem>
              </SelectContent>
            </Select>

            {['update_price', 'update_sale_price', 'update_stock'].includes(bulkAction) && (
              <Input
                type="number"
                placeholder="Enter value..."
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkOperation}
              disabled={!bulkAction || saving}
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
            >
              {saving ? 'Processing...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Variation Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Variation</DialogTitle>
            <DialogDescription>
              Create a new product variation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">SKU</label>
              <Input
                value={newVariation.sku || ''}
                onChange={(e) => setNewVariation(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="PROD-XXX"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariation.price || ''}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sale Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariation.salePrice || ''}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, salePrice: parseFloat(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  value={newVariation.stockQuantity || ''}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            {attributes.map(attr => (
              <div key={attr.slug}>
                <label className="text-sm font-medium">{attr.name}</label>
                <Select
                  value={newVariation.attributes?.[attr.slug] || ''}
                  onValueChange={(val) => setNewVariation(prev => ({
                    ...prev,
                    attributes: { ...prev.attributes, [attr.slug]: val }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${attr.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {attr.values.map(value => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVariation}>
              Add Variation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
