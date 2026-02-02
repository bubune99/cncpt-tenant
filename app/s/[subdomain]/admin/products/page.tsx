"use client";

import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, Settings, ExternalLink, Plus, MoreHorizontal } from "lucide-react";
import { Button } from '@/components/cms/ui/button';
import { Input } from '@/components/cms/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/cms/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/cms/ui/dropdown-menu';
import { Badge } from '@/components/cms/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs';
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';
import { useCMSConfig } from '@/contexts/CMSConfigContext';

export default function ProductsPage() {
  const { user } = useAuth();
  const { buildPath } = useCMSConfig();
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products?includeImages=true&includeCategories=true');
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match expected format
        const transformedProducts = (data.products || []).map((p: {
          id: string;
          title: string;
          slug: string;
          sku?: string | null;
          basePrice: number;
          status: string;
          stock: number;
          createdAt: string;
          categories?: Array<{ category?: { name?: string; slug?: string } }>;
          images?: Array<{ media?: { url?: string } }>;
        }) => ({
          id: p.id,
          name: p.title,
          slug: p.slug,
          sku: p.sku || '',
          price: p.basePrice / 100, // Convert from cents to dollars
          category: p.categories?.[0]?.category?.slug || 'uncategorized',
          status: (p.status || 'draft').toLowerCase(),
          stock: p.stock || 0,
          thumbnail: p.images?.[0]?.media?.url || 'https://placehold.co/100x100?text=No+Image',
          createdAt: p.createdAt,
        }));
        setProducts(transformedProducts);
      } else {
        console.error('Failed to fetch products:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search query and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || product.status === selectedStatus;
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && product.status === "active") ||
      (activeTab === "draft" && product.status === "draft");

    return matchesSearch && matchesCategory && matchesStatus && matchesTab;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-2">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex gap-2" data-help-key="admin.products.actions">
          <Button variant="outline" onClick={fetchProducts} disabled={isLoading} data-help-key="admin.products.refresh">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button asChild data-help-key="admin.products.add">
            <Link href={buildPath('/admin/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        className="mb-6"
        onValueChange={(value) => setActiveTab(value)}
        data-help-key="admin.products.tabs"
      >
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6" data-help-key="admin.products.filters">
        <div className="relative flex-1" data-help-key="admin.products.search">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="apparel">Apparel</SelectItem>
              <SelectItem value="drinkware">Drinkware</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
              <SelectItem value="wall-art">Wall Art</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card data-help-key="admin.products.table">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(product.category || 'uncategorized')
                              .split("-")
                              .map(
                                (word: string) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 50 ? "default" : product.stock > 10 ? "secondary" : "destructive"}>
                        {product.stock} in stock
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                      >
                        {product.status.charAt(0).toUpperCase() +
                          product.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(product.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}/configure`}>
                              <Settings className="mr-2 h-4 w-4" />
                              Configure
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.slug || product.id}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Product
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No products found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Product Management</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Add products manually or import from your e-commerce platform.</li>
          <li>• Configure product variants with different options and pricing.</li>
          <li>• Manage inventory levels and get low-stock alerts.</li>
          <li>• Set up product categories and organize your catalog.</li>
        </ul>
      </div>
    </div>
  );
}
