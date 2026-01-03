'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Shield,
  CreditCard,
  Truck,
  HardDrive,
  Mail,
  BarChart,
  Bot,
  Settings,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Upload,
  Download,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Textarea } from '../ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

// Types based on lib/env/types.ts
type EnvCategory =
  | 'database'
  | 'auth'
  | 'payments'
  | 'shipping'
  | 'storage'
  | 'email'
  | 'analytics'
  | 'ai'
  | 'general';

interface DisplayEnvVar {
  key: string;
  category: EnvCategory;
  label: string;
  description: string;
  required: boolean;
  sensitive: boolean;
  public: boolean;
  configured: boolean;
  source: 'database' | 'env_file' | 'system' | 'none';
  maskedValue?: string;
  placeholder?: string;
}

interface EnvHealth {
  total: number;
  configured: number;
  required: number;
  requiredConfigured: number;
  missingRequired: string[];
  categories: Record<EnvCategory, { total: number; configured: number }>;
}

// Category icons mapping
const CATEGORY_ICONS: Record<EnvCategory, React.ElementType> = {
  database: Database,
  auth: Shield,
  payments: CreditCard,
  shipping: Truck,
  storage: HardDrive,
  email: Mail,
  analytics: BarChart,
  ai: Bot,
  general: Settings,
};

const CATEGORY_LABELS: Record<EnvCategory, string> = {
  database: 'Database',
  auth: 'Authentication',
  payments: 'Payments',
  shipping: 'Shipping',
  storage: 'Storage',
  email: 'Email',
  analytics: 'Analytics',
  ai: 'AI',
  general: 'General',
};

export default function EnvManager() {
  const [variables, setVariables] = useState<DisplayEnvVar[]>([]);
  const [health, setHealth] = useState<EnvHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<EnvCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVar, setEditingVar] = useState<DisplayEnvVar | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const loadEnvVars = useCallback(async () => {
    try {
      const [varsRes, healthRes] = await Promise.all([
        fetch('/api/env'),
        fetch('/api/env?health=true'),
      ]);

      if (varsRes.ok) {
        const data = await varsRes.json();
        setVariables(data.variables || []);
      }

      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Error loading env vars:', error);
      toast.error('Failed to load environment variables');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnvVars();
  }, [loadEnvVars]);

  const handleSaveVar = async () => {
    if (!editingVar) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingVar.key,
          value: editValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      toast.success(`${editingVar.label} has been updated`);
      setEditingVar(null);
      setEditValue('');
      setShowValue(false);
      loadEnvVars();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVar = async (key: string) => {
    try {
      const response = await fetch('/api/env', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Environment variable removed');
      loadEnvVars();
    } catch (error) {
      toast.error('Failed to delete environment variable');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;

    setIsImporting(true);
    try {
      const response = await fetch('/api/env/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envString: importText, overwrite: false }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      toast.success(`Imported ${data.imported} variables (${data.skipped} skipped)`);

      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} errors occurred during import`);
      }

      setShowImportDialog(false);
      setImportText('');
      loadEnvVars();
    } catch (error) {
      toast.error('Failed to import environment variables');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredVariables = variables.filter((v) => {
    const matchesCategory = activeCategory === 'all' || v.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedVariables = filteredVariables.reduce((acc, v) => {
    if (!acc[v.category]) {
      acc[v.category] = [];
    }
    acc[v.category].push(v);
    return acc;
  }, {} as Record<EnvCategory, DisplayEnvVar[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Health Overview */}
        {health && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Configuration Health</CardTitle>
                  <CardDescription>
                    {health.requiredConfigured}/{health.required} required variables configured
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadEnvVars}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>
                    {health.configured}/{health.total} ({Math.round((health.configured / health.total) * 100)}%)
                  </span>
                </div>
                <Progress value={(health.configured / health.total) * 100} />
              </div>

              {health.missingRequired.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">Missing required variables: </span>
                    {health.missingRequired.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Category Progress Grid */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 pt-2">
                {(Object.keys(health.categories) as EnvCategory[]).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  const catHealth = health.categories[cat];
                  const percentage = catHealth.total > 0
                    ? Math.round((catHealth.configured / catHealth.total) * 100)
                    : 0;
                  return (
                    <Tooltip key={cat}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            'p-3 rounded-lg border text-center transition-colors',
                            activeCategory === cat
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          )}
                          onClick={() => setActiveCategory(cat)}
                        >
                          <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <div className="text-xs font-medium truncate">{CATEGORY_LABELS[cat]}</div>
                          <div className="text-xs text-muted-foreground">
                            {catHealth.configured}/{catHealth.total}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CATEGORY_LABELS[cat]}: {percentage}% configured</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveCategory('all')}
            >
              All
            </Button>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* Variables List */}
        <Accordion type="multiple" defaultValue={Object.keys(groupedVariables)} className="space-y-4">
          {(Object.entries(groupedVariables) as [EnvCategory, DisplayEnvVar[]][]).map(
            ([category, vars]) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <AccordionItem key={category} value={category} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{CATEGORY_LABELS[category]}</span>
                      <Badge variant="secondary" className="ml-2">
                        {vars.filter((v) => v.configured).length}/{vars.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {vars.map((v) => (
                        <div
                          key={v.key}
                          className={cn(
                            'p-4 rounded-lg border',
                            !v.configured && v.required && 'border-destructive/50 bg-destructive/5'
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-medium">{v.key}</span>
                                {v.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                                {v.sensitive && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Encrypted
                                  </Badge>
                                )}
                                {v.public && (
                                  <Badge variant="outline" className="text-xs">
                                    Public
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{v.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {v.configured ? (
                                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                                    <Check className="h-4 w-4 mr-1" />
                                    <span className="font-mono">{v.maskedValue}</span>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {v.source === 'database' ? 'Database' : 'ENV File'}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">
                                    Not configured
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingVar(v);
                                  setEditValue('');
                                  setShowValue(false);
                                }}
                              >
                                {v.configured ? 'Update' : 'Configure'}
                              </Button>
                              {v.configured && v.source === 'database' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteVar(v.key)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove from database</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }
          )}
        </Accordion>

        {filteredVariables.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No environment variables found matching your search.</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingVar} onOpenChange={() => setEditingVar(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVar?.configured ? 'Update' : 'Configure'} {editingVar?.label}
              </DialogTitle>
              <DialogDescription>
                {editingVar?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="font-mono text-sm">{editingVar?.key}</span>
                  {editingVar?.sensitive && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Will be encrypted
                    </Badge>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type={showValue || !editingVar?.sensitive ? 'text' : 'password'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={editingVar?.placeholder || 'Enter value...'}
                  />
                  {editingVar?.sensitive && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowValue(!showValue)}
                    >
                      {showValue ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {editingVar?.placeholder && (
                  <p className="text-xs text-muted-foreground">
                    Example: {editingVar.placeholder}
                  </p>
                )}
              </div>

              {editingVar?.configured && editingVar.source === 'env_file' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This variable is currently set in your .env file. Setting it here will
                    override the file value with an encrypted database value.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingVar(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVar} disabled={!editValue || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Environment Variables</DialogTitle>
              <DialogDescription>
                Paste your .env file contents below. Only recognized variables will be imported.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`# Paste your .env contents here
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...`}
                className="font-mono text-sm h-64"
              />
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Existing values will not be overwritten. Only new variables will be imported.
                  Sensitive values will be automatically encrypted.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importText.trim() || isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
