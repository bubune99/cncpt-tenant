'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Play,
  ShoppingCart,
  Mail,
  User,
  Package,
  Code,
  Tag,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  trigger: string;
  steps: unknown[];
  tags: string[];
  isSystem: boolean;
  isActive: boolean;
  _count: {
    workflows: number;
  };
}

interface TemplatesByCategory {
  [key: string]: WorkflowTemplate[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  ORDER: <ShoppingCart className="h-5 w-5" />,
  CUSTOMER: <User className="h-5 w-5" />,
  EMAIL: <Mail className="h-5 w-5" />,
  INVENTORY: <Package className="h-5 w-5" />,
  INTEGRATION: <Code className="h-5 w-5" />,
  OTHER: <Tag className="h-5 w-5" />,
};

const categoryLabels: Record<string, string> = {
  ORDER: 'Order Management',
  CUSTOMER: 'Customer Engagement',
  EMAIL: 'Email Automation',
  INVENTORY: 'Inventory Management',
  INTEGRATION: 'Integrations',
  OTHER: 'Other',
};

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [byCategory, setByCategory] = useState<TemplatesByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [installDialog, setInstallDialog] = useState<{
    open: boolean;
    template: WorkflowTemplate | null;
    name: string;
    installing: boolean;
    success: boolean;
    error: string | null;
  }>({
    open: false,
    template: null,
    name: '',
    installing: false,
    success: false,
    error: null,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plugins/workflows/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates);
      setByCategory(data.byCategory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = (template: WorkflowTemplate) => {
    setInstallDialog({
      open: true,
      template,
      name: `${template.name} Copy`,
      installing: false,
      success: false,
      error: null,
    });
  };

  const confirmInstall = async () => {
    if (!installDialog.template) return;

    setInstallDialog((prev) => ({ ...prev, installing: true, error: null }));

    try {
      const response = await fetch('/api/plugins/workflows/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: installDialog.template.id,
          name: installDialog.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to install template');
      }

      setInstallDialog((prev) => ({ ...prev, success: true, installing: false }));

      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/workflows');
      }, 1500);
    } catch (err) {
      setInstallDialog((prev) => ({
        ...prev,
        installing: false,
        error: err instanceof Error ? err.message : 'Failed to install template',
      }));
    }
  };

  const closeDialog = () => {
    setInstallDialog({
      open: false,
      template: null,
      name: '',
      installing: false,
      success: false,
      error: null,
    });
  };

  // Filter templates by search and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !search ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(byCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/workflows">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Workflow Templates</h1>
            <p className="text-muted-foreground">
              Choose a template to quickly create a new workflow
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="flex items-center gap-2"
            >
              {categoryIcons[category]}
              {categoryLabels[category] || category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No templates found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {categoryIcons[template.category] || <Tag className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{template.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  {template._count.workflows} installations
                </span>
                <Button size="sm" onClick={() => handleInstall(template)}>
                  <Play className="h-4 w-4 mr-1" />
                  Install
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Install Dialog */}
      <Dialog open={installDialog.open} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Template</DialogTitle>
            <DialogDescription>
              Create a new workflow from the &quot;{installDialog.template?.name}&quot; template.
            </DialogDescription>
          </DialogHeader>

          {installDialog.success ? (
            <div className="flex items-center gap-2 text-green-600 py-4">
              <CheckCircle className="h-5 w-5" />
              Workflow created successfully! Redirecting...
            </div>
          ) : (
            <>
              {installDialog.error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                  {installDialog.error}
                </div>
              )}

              <div className="py-4">
                <label className="text-sm font-medium">Workflow Name</label>
                <Input
                  value={installDialog.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInstallDialog((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter workflow name"
                  className="mt-1"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmInstall}
                  disabled={installDialog.installing || !installDialog.name}
                >
                  {installDialog.installing && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Install Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
