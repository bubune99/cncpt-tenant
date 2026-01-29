'use client';

/**
 * AI Settings Component
 *
 * Allows configuring AI model settings.
 * Uses Vercel AI Gateway - no API key needed when deployed on Vercel.
 */

import { useState, useEffect } from 'react';
import { Bot, Check, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { toast } from 'sonner';

interface AiSettingsData {
  enabled: boolean;
  provider: 'gateway';
  enabledModels: string[];
  maxTokens: number;
  temperature: number;
}

const MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude 4.5 Sonnet', provider: 'Anthropic', description: 'Balanced performance and cost for most tasks' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude 4.5 Haiku', provider: 'Anthropic', description: 'Fast and cost-effective for simple tasks' },
  { id: 'anthropic/claude-opus-4.5', name: 'Claude 4.5 Opus', provider: 'Anthropic', description: 'Most capable model for complex tasks' },
];

export default function AiSettings() {
  const [settings, setSettings] = useState<AiSettingsData>({
    enabled: true,
    provider: 'gateway',
    enabledModels: ['anthropic/claude-sonnet-4.5', 'anthropic/claude-haiku-4.5'],
    maxTokens: 4096,
    temperature: 0.7,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/ai');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast.error('Failed to load AI settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('AI settings saved successfully');
        setHasChanges(false);
        // Reload to get masked API key
        loadSettings();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save AI settings');
      }
    } catch (error) {
      toast.error('Failed to save AI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Use first enabled model for testing
      const testModel = settings.enabledModels[0] || 'anthropic/claude-sonnet-4.5';
      const response = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: testModel }),
      });

      if (response.ok) {
        setTestResult('success');
        toast.success('AI Gateway connection test successful!');
      } else {
        const error = await response.json();
        setTestResult('error');
        toast.error(error.message || 'AI Gateway connection test failed');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('AI Gateway connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const updateSetting = <K extends keyof AiSettingsData>(key: K, value: AiSettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setTestResult(null);
  };

  const toggleModel = (modelId: string) => {
    setSettings((prev) => {
      const isEnabled = prev.enabledModels.includes(modelId);
      // Prevent disabling the last model
      if (isEnabled && prev.enabledModels.length === 1) {
        toast.error('At least one model must be enabled');
        return prev;
      }
      const newEnabledModels = isEnabled
        ? prev.enabledModels.filter((id) => id !== modelId)
        : [...prev.enabledModels, modelId];
      return { ...prev, enabledModels: newEnabledModels };
    });
    setHasChanges(true);
    setTestResult(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Alert */}
      {settings.enabled && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>AI Enabled</AlertTitle>
          <AlertDescription>
            AI chat is enabled using Vercel AI Gateway. No API key required when deployed on Vercel.
          </AlertDescription>
        </Alert>
      )}

      {!settings.enabled && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Disabled</AlertTitle>
          <AlertDescription>
            AI features are currently disabled. Enable them below to use AI chat.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant Settings
          </CardTitle>
          <CardDescription>
            Configure the AI assistant for the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable AI Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI-powered features in the admin panel
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Test Connection */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Test Gateway Connection</Label>
                  <p className="text-sm text-muted-foreground">
                    Verify AI Gateway is working correctly
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : testResult === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : testResult === 'error' ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>

              {/* Model Availability */}
              <div className="space-y-3">
                <div>
                  <Label>Available Models</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle which models are available in the chat interface
                  </p>
                </div>
                {MODELS.map((model) => (
                  <div key={model.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="font-medium">{model.name}</Label>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                    <Switch
                      checked={settings.enabledModels.includes(model.id)}
                      onCheckedChange={() => toggleModel(model.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Output Tokens</Label>
                  <span className="text-sm text-muted-foreground">{settings.maxTokens}</span>
                </div>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([value]) => updateSetting('maxTokens', value)}
                  min={256}
                  max={8192}
                  step={256}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum length of AI responses
                </p>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-muted-foreground">{settings.temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([value]) => updateSetting('temperature', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">
                  Lower = more focused, Higher = more creative
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={loadSettings}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
