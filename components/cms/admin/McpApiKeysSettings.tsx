"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  Shield,
  FolderOpen,
  Terminal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/cms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cms/ui/card";
import { Label } from "@/components/cms/ui/label";
import { Input } from "@/components/cms/ui/input";
import { Checkbox } from "@/components/cms/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cms/ui/select";
import { Badge } from "@/components/cms/ui/badge";
import { Separator } from "@/components/cms/ui/separator";
import { Alert, AlertDescription } from "@/components/cms/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/cms/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/cms/ui/radio-group";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Scope constants (hardcoded for client component — mirrors lib/cms/mcp/scopes.ts)
// ---------------------------------------------------------------------------

const SCOPE_PRESETS: Record<string, { description: string; scopes: string[] }> = {
  "Read Only": {
    description: "View all data without making changes",
    scopes: [
      "products:read", "orders:read", "blog:read", "pages:read",
      "media:read", "customers:read", "settings:read", "analytics:read",
    ],
  },
  "Content Editor": {
    description: "Manage blog posts, pages, and media",
    scopes: [
      "blog:read", "blog:write", "pages:read", "pages:write",
      "media:read", "media:write",
    ],
  },
  "Store Manager": {
    description: "Manage products, orders, and customers",
    scopes: [
      "products:read", "products:write", "orders:read", "orders:write",
      "customers:read", "customers:write", "analytics:read",
    ],
  },
  "Full Access": {
    description: "Complete access to all resources",
    scopes: ["*"],
  },
};

const SCOPE_GROUPS: Record<string, string[]> = {
  "Content Management": [
    "pages:read", "pages:write", "blog:read", "blog:write",
    "media:read", "media:write",
  ],
  "E-Commerce": [
    "products:read", "products:write", "orders:read", "orders:write",
    "customers:read", "customers:write",
  ],
  "Settings & Analytics": [
    "settings:read", "settings:write", "analytics:read",
  ],
  Administration: [
    "users:read", "users:write",
  ],
};

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "pages:read": "View CMS pages",
  "pages:write": "Create, update, delete pages",
  "blog:read": "View blog posts and categories",
  "blog:write": "Create, update, delete blog posts",
  "media:read": "View media library",
  "media:write": "Upload, update, delete media",
  "products:read": "View products and inventory",
  "products:write": "Create, update, delete products",
  "orders:read": "View orders and transactions",
  "orders:write": "Update order status, create refunds",
  "customers:read": "View customer profiles",
  "customers:write": "Update customer data",
  "settings:read": "View site settings",
  "settings:write": "Update site settings",
  "analytics:read": "View analytics and reports",
  "users:read": "View CMS users",
  "users:write": "Manage CMS users",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  projectName: string | null;
  keyPrefix: string;
  scopes: string[];
  rateLimitTier: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isExpired: boolean;
}

type PresetName = keyof typeof SCOPE_PRESETS | "Custom";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine which preset (if any) matches a set of scopes */
function detectPreset(scopes: string[]): PresetName {
  const sorted = [...scopes].sort().join(",");
  for (const [name, preset] of Object.entries(SCOPE_PRESETS)) {
    if ([...preset.scopes].sort().join(",") === sorted) {
      return name as PresetName;
    }
  }
  return "Custom";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function McpApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState<ApiKey | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Create form state
  const [keyName, setKeyName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [keyDescription, setKeyDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PresetName>("Full Access");
  const [customScopes, setCustomScopes] = useState<Set<string>>(new Set());
  const [expiresIn, setExpiresIn] = useState("never");
  const [rateLimitTier, setRateLimitTier] = useState("free");

  // Derived: final scopes based on preset or custom selection
  const resolvedScopes = useMemo(() => {
    if (selectedPreset === "Custom") {
      return Array.from(customScopes);
    }
    return SCOPE_PRESETS[selectedPreset]?.scopes ?? [];
  }, [selectedPreset, customScopes]);

  useEffect(() => {
    loadApiKeys();
  }, []);

  // -------------------------------------------------------------------------
  // Data
  // -------------------------------------------------------------------------

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cms/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      } else {
        throw new Error("Failed to load API keys");
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    if (!projectName.trim()) {
      toast.error("Please enter a project name for the API key");
      return;
    }
    if (resolvedScopes.length === 0) {
      toast.error("Please select at least one permission scope");
      return;
    }

    setIsCreating(true);
    try {
      const expiresInDays = expiresIn === "never" ? null : parseInt(expiresIn);

      const response = await fetch("/api/cms/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim(),
          projectName: projectName.trim(),
          description: keyDescription.trim() || null,
          scopes: resolvedScopes,
          expiresInDays,
          rateLimitTier,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKey(data.rawKey);
        setNewKeyData(data.apiKey);
        setShowCreateDialog(false);
        setShowKeyDialog(true);

        // Reset form
        setKeyName("");
        setProjectName("");
        setKeyDescription("");
        setSelectedPreset("Full Access");
        setCustomScopes(new Set());
        setExpiresIn("never");
        setRateLimitTier("free");

        await loadApiKeys();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(keyId);
    try {
      const response = await fetch(`/api/cms/api-keys?id=${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("API key revoked");
        await loadApiKeys();
      } else {
        throw new Error("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key");
    } finally {
      setIsDeleting(null);
    }
  };

  const copyToClipboard = async () => {
    if (newKey) {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("API key copied to clipboard");
    }
  };

  // -------------------------------------------------------------------------
  // Formatting helpers
  // -------------------------------------------------------------------------

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never used";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  // -------------------------------------------------------------------------
  // Custom scope toggle
  // -------------------------------------------------------------------------

  const toggleScope = (scope: string) => {
    setCustomScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) {
        next.delete(scope);
      } else {
        next.add(scope);
      }
      return next;
    });
  };

  const toggleGroupScopes = (scopes: string[], checked: boolean) => {
    setCustomScopes((prev) => {
      const next = new Set(prev);
      for (const scope of scopes) {
        if (checked) {
          next.add(scope);
        } else {
          next.delete(scope);
        }
      }
      return next;
    });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6" data-help-key="admin.settings.mcp-api-keys">
      {/* ----------------------------------------------------------------- */}
      {/* Key List Card                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                MCP API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for AI agent access to your CMS via MCP (Model
                Context Protocol)
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No API Keys</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create an API key to allow AI agents to access your CMS
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => {
                const presetLabel = detectPreset(key.scopes);
                return (
                  <div
                    key={key.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Row 1: name + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{key.name}</span>
                        {key.projectName && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            {key.projectName}
                          </Badge>
                        )}
                        <Badge variant={presetLabel === "Custom" ? "outline" : "default"}>
                          {presetLabel}
                        </Badge>
                        {key.isExpired && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>

                      {/* Row 2: prefix + last used + created */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <code className="bg-muted px-2 py-0.5 rounded text-xs">
                          {key.keyPrefix}...
                        </code>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(key.lastUsedAt)}
                        </span>
                        <span>Created {formatDate(key.createdAt)}</span>
                        {key.expiresAt && (
                          <span>Expires {formatDate(key.expiresAt)}</span>
                        )}
                      </div>

                      {/* Row 3: description */}
                      {key.description && (
                        <p className="text-sm text-muted-foreground">
                          {key.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-4 shrink-0"
                      onClick={() => handleRevokeKey(key.id)}
                      disabled={isDeleting === key.id}
                    >
                      {isDeleting === key.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Connection Info Card                                              */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            MCP Connection Info
          </CardTitle>
          <CardDescription>
            Use these details to configure your AI agent&apos;s MCP connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">MCP Server URL</Label>
            <code className="block mt-1 p-2 bg-muted rounded text-sm">
              {typeof window !== "undefined" ? window.location.origin : ""}/s/
              {"<subdomain>"}/mcp
            </code>
          </div>
          <div>
            <Label className="text-sm font-medium">Authentication Header</Label>
            <code className="block mt-1 p-2 bg-muted rounded text-sm">
              Authorization: Bearer cms_xxxxx...
            </code>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">CLI Configuration</Label>
            <pre className="mt-1 p-3 bg-muted rounded text-sm font-mono whitespace-pre overflow-x-auto">
{`CMS_BASE_URL=${typeof window !== "undefined" ? window.location.origin : "https://yoursite.cncpt.app"}
CMS_API_KEY=cms_xxxxx...
CMS_SUBDOMAIN=yoursite`}
            </pre>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Replace {"<subdomain>"} with your actual subdomain name and use
              your real API key. The key provides access to that specific
              subdomain&apos;s data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Create Key Dialog                                                 */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for MCP access. The key will only be shown
              once after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="key-name">Name *</Label>
              <Input
                id="key-name"
                placeholder='e.g., "Production CLI"'
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="key-project">Project Name *</Label>
              <Input
                id="key-project"
                placeholder='e.g., "sassy-dame-storefront"'
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The project this key is associated with.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="key-description">Description</Label>
              <Input
                id="key-description"
                placeholder="Optional description of what this key is used for"
                value={keyDescription}
                onChange={(e) => setKeyDescription(e.target.value)}
              />
            </div>

            <Separator />

            {/* Scope Preset Selector */}
            <div className="space-y-3">
              <Label>Permissions</Label>
              <RadioGroup
                value={selectedPreset}
                onValueChange={(val) => setSelectedPreset(val as PresetName)}
                className="grid gap-3"
              >
                {Object.entries(SCOPE_PRESETS).map(([name, preset]) => (
                  <label
                    key={name}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedPreset === name
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <RadioGroupItem value={name} className="mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </label>
                ))}

                {/* Custom option */}
                <label
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedPreset === "Custom"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <RadioGroupItem value="Custom" className="mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">Custom</p>
                    <p className="text-xs text-muted-foreground">
                      Select specific permissions
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Granular Scope Checkboxes (Custom only) */}
            {selectedPreset === "Custom" && (
              <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                {Object.entries(SCOPE_GROUPS).map(([groupName, scopes]) => {
                  const allChecked = scopes.every((s) => customScopes.has(s));
                  const someChecked =
                    !allChecked && scopes.some((s) => customScopes.has(s));

                  return (
                    <div key={groupName} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`group-${groupName}`}
                          checked={allChecked}
                          // @ts-expect-error indeterminate is valid DOM prop
                          indeterminate={someChecked}
                          onCheckedChange={(checked) =>
                            toggleGroupScopes(scopes, checked === true)
                          }
                        />
                        <label
                          htmlFor={`group-${groupName}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {groupName}
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6">
                        {scopes.map((scope) => (
                          <div key={scope} className="flex items-center gap-2">
                            <Checkbox
                              id={`scope-${scope}`}
                              checked={customScopes.has(scope)}
                              onCheckedChange={() => toggleScope(scope)}
                            />
                            <label
                              htmlFor={`scope-${scope}`}
                              className="text-xs cursor-pointer"
                            >
                              <code className="bg-muted px-1 py-0.5 rounded mr-1">
                                {scope}
                              </code>
                              <span className="text-muted-foreground">
                                {SCOPE_DESCRIPTIONS[scope] ?? scope}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-2" />
                    </div>
                  );
                })}
              </div>
            )}

            <Separator />

            {/* Expiration + Rate Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expires">Expiration</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit Tier</Label>
                <Select value={rateLimitTier} onValueChange={setRateLimitTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">
                      <span className="flex items-center gap-1.5">Free</span>
                    </SelectItem>
                    <SelectItem value="pro">
                      <span className="flex items-center gap-1.5">Pro</span>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <span className="flex items-center gap-1.5">Enterprise</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Show Key Dialog (post-creation)                                   */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. For security, it won&apos;t be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure to copy your API key now. You won&apos;t be able to see it
                again!
              </AlertDescription>
            </Alert>
            {newKeyData && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Key Name</Label>
                    <p className="text-sm font-medium">{newKeyData.name}</p>
                  </div>
                  {newKeyData.projectName && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Project</Label>
                      <p className="text-sm font-medium">{newKeyData.projectName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={newKey || ""}
                    readOnly
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button variant="outline" onClick={copyToClipboard}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowKeyDialog(false);
                setNewKey(null);
                setNewKeyData(null);
                setShowKey(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
