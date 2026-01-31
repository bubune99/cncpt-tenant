"use client";

import { useState, useEffect } from "react";
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
  Shield
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
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isExpired: boolean;
}

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
  const [keyDescription, setKeyDescription] = useState("");
  const [readScope, setReadScope] = useState(true);
  const [writeScope, setWriteScope] = useState(true);
  const [expiresIn, setExpiresIn] = useState("never");

  useEffect(() => {
    loadApiKeys();
  }, []);

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

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    const scopes: string[] = [];
    if (readScope) scopes.push("read");
    if (writeScope) scopes.push("write");

    if (scopes.length === 0) {
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
          description: keyDescription.trim() || null,
          scopes,
          expiresInDays,
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
        setKeyDescription("");
        setReadScope(true);
        setWriteScope(true);
        setExpiresIn("never");

        // Refresh list
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
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6" data-help-key="admin.settings.mcp-api-keys">
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
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      {key.isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <code className="bg-muted px-2 py-0.5 rounded">
                        {key.keyPrefix}...
                      </code>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {key.scopes.join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(key.lastUsedAt)}
                      </span>
                    </div>
                    {key.description && (
                      <p className="text-sm text-muted-foreground">
                        {key.description}
                      </p>
                    )}
                    {key.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {formatDate(key.expiresAt)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MCP Connection Info</CardTitle>
          <CardDescription>
            Use these details to configure your AI agent's MCP connection
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Replace {"<subdomain>"} with your actual subdomain name. The API
              key provides access to that specific subdomain's data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for MCP access. The key will only be shown
              once after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Name *</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production AI Agent"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-description">Description</Label>
              <Input
                id="key-description"
                placeholder="Optional description"
                value={keyDescription}
                onChange={(e) => setKeyDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scope-read"
                    checked={readScope}
                    onCheckedChange={(checked) => setReadScope(checked === true)}
                  />
                  <label
                    htmlFor="scope-read"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Read - View products, orders, pages, settings
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scope-write"
                    checked={writeScope}
                    onCheckedChange={(checked) => setWriteScope(checked === true)}
                  />
                  <label
                    htmlFor="scope-write"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Write - Create, update, delete content
                  </label>
                </div>
              </div>
            </div>
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

      {/* Show Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. For security, it won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure to copy your API key now. You won't be able to see it
                again!
              </AlertDescription>
            </Alert>
            {newKeyData && (
              <div className="space-y-2">
                <Label>Key Name</Label>
                <p className="text-sm font-medium">{newKeyData.name}</p>
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
