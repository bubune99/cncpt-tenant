"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Trash2,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";

interface AuthConfigData {
  stack_auth_project_id: string;
  stack_auth_publishable_key: string;
  stack_auth_secret_key: string | null;
  stack_auth_base_url: string | null;
  branding_logo_url: string | null;
  branding_primary_color: string;
  branding_name: string | null;
  enable_social_auth: boolean;
  enable_magic_link: boolean;
  enable_password_auth: boolean;
}

const defaultConfig: AuthConfigData = {
  stack_auth_project_id: "",
  stack_auth_publishable_key: "",
  stack_auth_secret_key: null,
  stack_auth_base_url: null,
  branding_logo_url: null,
  branding_primary_color: "#0891b2",
  branding_name: null,
  enable_social_auth: true,
  enable_magic_link: true,
  enable_password_auth: true,
};

export default function AuthSettings() {
  const params = useParams();
  const subdomain = params?.subdomain as string;

  const [config, setConfig] = useState<AuthConfigData>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Track the secret separately — API returns masked value, we only send new values
  const [newSecretKey, setNewSecretKey] = useState("");
  const [maskedSecret, setMaskedSecret] = useState<string | null>(null);

  useEffect(() => {
    if (subdomain) fetchConfig();
  }, [subdomain]);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/subdomains/${encodeURIComponent(subdomain)}/auth-config`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setConfig({
            stack_auth_project_id: data.stack_auth_project_id || "",
            stack_auth_publishable_key: data.stack_auth_publishable_key || "",
            stack_auth_secret_key: null, // Never populate form with masked value
            stack_auth_base_url: data.stack_auth_base_url || null,
            branding_logo_url: data.branding_logo_url || null,
            branding_primary_color: data.branding_primary_color || "#0891b2",
            branding_name: data.branding_name || null,
            enable_social_auth: data.enable_social_auth ?? true,
            enable_magic_link: data.enable_magic_link ?? true,
            enable_password_auth: data.enable_password_auth ?? true,
          });
          setMaskedSecret(data.stack_auth_secret_key || null);
          setConfigExists(true);
        } else {
          setConfigExists(false);
        }
      } else if (response.status === 404) {
        setConfigExists(false);
      } else {
        toast.error("Failed to load auth configuration");
      }
    } catch (error) {
      console.error("Failed to fetch auth config:", error);
      toast.error("Failed to load auth configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.stack_auth_project_id || !config.stack_auth_publishable_key) {
      toast.error("Project ID and Publishable Key are required");
      return;
    }

    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        stack_auth_project_id: config.stack_auth_project_id,
        stack_auth_publishable_key: config.stack_auth_publishable_key,
        stack_auth_base_url: config.stack_auth_base_url || undefined,
        branding_logo_url: config.branding_logo_url || undefined,
        branding_primary_color: config.branding_primary_color,
        branding_name: config.branding_name || undefined,
        enable_social_auth: config.enable_social_auth,
        enable_magic_link: config.enable_magic_link,
        enable_password_auth: config.enable_password_auth,
      };

      // Only include secret key if user entered a new one
      if (newSecretKey) {
        body.stack_auth_secret_key = newSecretKey;
      }

      const response = await fetch(
        `/api/subdomains/${encodeURIComponent(subdomain)}/auth-config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfigExists(true);
        setMaskedSecret(data.stack_auth_secret_key || null);
        setNewSecretKey("");
        setHasChanges(false);
        toast.success(
          data.created
            ? "Auth configuration created"
            : "Auth configuration updated"
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save auth configuration");
      }
    } catch (error) {
      console.error("Failed to save auth config:", error);
      toast.error("Failed to save auth configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/subdomains/${encodeURIComponent(subdomain)}/auth-config`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setConfig(defaultConfig);
        setConfigExists(false);
        setMaskedSecret(null);
        setNewSecretKey("");
        setHasChanges(false);
        toast.success("Auth configuration deleted");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete auth configuration");
      }
    } catch (error) {
      console.error("Failed to delete auth config:", error);
      toast.error("Failed to delete auth configuration");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const updateField = (field: keyof AuthConfigData, value: string | boolean | null) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stack Auth Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Stack Auth Connection
              </CardTitle>
              <CardDescription>
                Connect your Stack Auth project to enable authentication for
                this subdomain
              </CardDescription>
            </div>
            {configExists ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Configured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="projectId">
                Project ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectId"
                value={config.stack_auth_project_id}
                onChange={(e) =>
                  updateField("stack_auth_project_id", e.target.value)
                }
                placeholder="your-stack-auth-project-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishableKey">
                Publishable Client Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="publishableKey"
                value={config.stack_auth_publishable_key}
                onChange={(e) =>
                  updateField("stack_auth_publishable_key", e.target.value)
                }
                placeholder="pk_..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey">Secret Server Key</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecretKey ? "text" : "password"}
                value={newSecretKey}
                onChange={(e) => {
                  setNewSecretKey(e.target.value);
                  setHasChanges(true);
                }}
                placeholder={
                  maskedSecret
                    ? `Current: ${maskedSecret}`
                    : "sk_... (optional)"
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for server-side auth operations. Leave blank to keep the
              existing key.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">
              Custom API URL
              <span className="text-xs text-muted-foreground ml-2">
                (self-hosted only)
              </span>
            </Label>
            <Input
              id="baseUrl"
              value={config.stack_auth_base_url || ""}
              onChange={(e) =>
                updateField(
                  "stack_auth_base_url",
                  e.target.value || null
                )
              }
              placeholder="https://auth.yourdomain.com"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            <a
              href="https://stack-auth.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Stack Auth Documentation
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Login Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Login Methods
          </CardTitle>
          <CardDescription>
            Choose which authentication methods are available to your users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Social Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to sign in with Google, GitHub, and other providers
              </p>
            </div>
            <Switch
              checked={config.enable_social_auth}
              onCheckedChange={(checked) =>
                updateField("enable_social_auth", checked)
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Magic Link</Label>
              <p className="text-sm text-muted-foreground">
                Send a sign-in link to the user&apos;s email address
              </p>
            </div>
            <Switch
              checked={config.enable_magic_link}
              onCheckedChange={(checked) =>
                updateField("enable_magic_link", checked)
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Password Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Traditional email and password sign-in
              </p>
            </div>
            <Switch
              checked={config.enable_password_auth}
              onCheckedChange={(checked) =>
                updateField("enable_password_auth", checked)
              }
            />
          </div>

          {!config.enable_social_auth &&
            !config.enable_magic_link &&
            !config.enable_password_auth && (
              <Alert variant="destructive">
                <AlertDescription>
                  All login methods are disabled. Users will not be able to sign
                  in to this subdomain.
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>

      {/* Auth Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Auth Branding
          </CardTitle>
          <CardDescription>
            Customize the appearance of authentication pages for this subdomain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={config.branding_name || ""}
              onChange={(e) =>
                updateField("branding_name", e.target.value || null)
              }
              placeholder="Your Brand Name"
            />
            <p className="text-xs text-muted-foreground">
              Displayed on sign-in and sign-up pages
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="brandColor">Primary Color</Label>
            <div className="flex gap-3">
              <input
                type="color"
                id="brandColor"
                value={config.branding_primary_color}
                onChange={(e) =>
                  updateField("branding_primary_color", e.target.value)
                }
                className="h-10 w-14 rounded border cursor-pointer"
              />
              <Input
                value={config.branding_primary_color}
                onChange={(e) =>
                  updateField("branding_primary_color", e.target.value)
                }
                placeholder="#0891b2"
                className="flex-1 max-w-[200px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={config.branding_logo_url || ""}
              onChange={(e) =>
                updateField("branding_logo_url", e.target.value || null)
              }
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Logo displayed on authentication pages. Recommended: 200x50px or
              larger.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {configExists && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently remove the auth configuration for this subdomain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Delete Auth Configuration</div>
                <div className="text-sm text-muted-foreground">
                  Users will no longer be able to sign in to this subdomain
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            fetchConfig();
            setNewSecretKey("");
            setHasChanges(false);
          }}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {configExists ? "Save Changes" : "Create Configuration"}
            </>
          )}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Auth Configuration</DialogTitle>
            <DialogDescription>
              This will permanently remove the authentication configuration for
              this subdomain. Users will no longer be able to sign in. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Configuration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
