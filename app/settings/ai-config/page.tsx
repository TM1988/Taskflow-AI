"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/services/auth/AuthContext";
import {
  Sparkles,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

export default function AIConfigPage() {
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [configSaved, setConfigSaved] = useState(false); // Added missing state
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchConfig = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/user-ai-config/${user.uid}`);

        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.isEnabled || false);
          setCurrentKey(data.hasApiKey ? "••••••••••••••••" : null);
        }
      } catch (error) {
        console.error("Error fetching AI config:", error);
      }
    };

    fetchConfig();
  }, [user]);

  const saveConfig = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/user-ai-config/${user.uid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          isEnabled,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "AI configuration saved successfully",
        });

        // Clear the API key input but show that a key is saved
        if (apiKey) {
          setApiKey("");
          setCurrentKey("••••••••••••••••");
        }

        setIsEnabled(data.isEnabled);
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving AI config:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save AI configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-8">AI Integration Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Google AI Studio Configuration
          </CardTitle>
          <CardDescription>
            Connect TaskFlow AI with Google&apos;s Generative AI capabilities
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {configSaved && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">
                Configuration saved
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Your AI configuration has been saved successfully.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Privacy Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              When enabled, task data will be sent to Google AI for analysis.
              Google may save and use this data to improve their services.
              Please review
              <a
                href="https://ai.google.dev/docs/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                Google&apos;s privacy policy
              </a>{" "}
              before enabling this feature.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="apiKey">Google AI Studio API Key</Label>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() =>
                  window.open(
                    "https://aistudio.google.com/app/apikeys",
                    "_blank",
                  )
                }
              >
                Get API Key <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <Input
              id="apiKey"
              type="password"
              placeholder={currentKey || "Enter your API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {currentKey
                ? "API key is saved. Enter a new key to update it."
                : "Your API key is stored securely and never shared."}
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="ai-enabled">Enable AI Features</Label>
            <Switch
              id="ai-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={!currentKey && !apiKey}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">How to get your API key:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
              <li>
                Visit{" "}
                <a
                  href="https://aistudio.google.com/app/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </li>
              <li>Sign in with your Google account</li>
              <li>Click &quot;Create API Key&quot;</li>
              <li>Copy the key and paste it here</li>
            </ol>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
