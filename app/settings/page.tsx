"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Camera,
  Tag,
  Sparkles,
  CheckCircle,
  Play,
  ExternalLink,
  AlertTriangle,
  LayoutGrid,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import { cn } from "@/lib/utils";
import ColumnManager from "@/components/board/column-manager";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme, theme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [userTags, setUserTags] = useState([
    "Frontend Developer",
    "React",
    "TypeScript",
    "UI/UX",
  ]);

  // AI configuration state
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const [defaultProjectName, setDefaultProjectName] = useState("");
  const [currentProject, setCurrentProject] = useState<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Load saved default project name
  useEffect(() => {
    const saved = localStorage.getItem("defaultProjectName");
    if (saved) setDefaultProjectName(saved);
  }, []);

  // Fetch current project
  useEffect(() => {
    const fetchCurrentProject = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/projects?userId=${user.uid}`);
        if (response.ok) {
          const projects = await response.json();
          if (projects.length > 0) {
            setCurrentProject(projects[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching current project:", error);
      }
    };

    fetchCurrentProject();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // persist default project name
    localStorage.setItem("defaultProjectName", defaultProjectName);
    setIsLoading(false);
    toast({
      title: "Success",
      description: "Profile saved successfully",
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast({
      title: "Success",
      description: "Password updated successfully",
    });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !userTags.includes(newTag.trim())) {
      setUserTags([...userTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setUserTags(userTags.filter((tag) => tag !== tagToRemove));
  };

  const saveAIConfig = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setConfigSaved(false);

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

        // Set the saved flag to show confirmation
        setConfigSaved(true);

        // Update the enabled state from the response
        setIsEnabled(data.isEnabled);

        // Auto hide the saved indicator after 5 seconds
        setTimeout(() => setConfigSaved(false), 5000);
      } else {
        // Get error message from the response
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

  // Fetch AI config when component mounts
  useEffect(() => {
    const fetchConfig = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/user-ai-config/${user.uid}`);

        if (response.ok) {
          const data = await response.json();
          console.log("Loaded AI config:", data);
          setIsEnabled(data.isEnabled || false);
          setCurrentKey(data.hasApiKey ? "••••••••••••••••" : null);
        }
      } catch (error) {
        console.error("Error fetching AI config:", error);
      }
    };

    fetchConfig();
  }, [user]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Skills & Tags
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Integration
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Profile Settings</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>
                    {user?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user?.displayName || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ""}
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="defaultProjectName">Default Project Name</Label>
                  <Input
                    id="defaultProjectName"
                    placeholder="My First Project"
                    value={defaultProjectName}
                    onChange={(e) => setDefaultProjectName(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Skills & Tags</h2>
            <div className="space-y-6">
              <div>
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="newTag" className="sr-only">
                      Add new tag
                    </Label>
                    <Input
                      id="newTag"
                      placeholder="Add a skill or tag (e.g., UI/UX Designer, Python)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                    />
                  </div>
                  <Button type="submit">Add Tag</Button>
                </form>
              </div>

              <div>
                <Label>Your Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {userTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <span className="ml-1" title="Remove tag">
                        ×
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">
              Notification Preferences
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in the browser
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly summary of your activity
                  </p>
                </div>
                <Switch
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">
              AI Integration Settings
            </h2>

            <div className="space-y-6">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">
                  Privacy Notice
                </AlertTitle>
                <AlertDescription className="text-amber-700">
                  When enabled, task data will be sent to Google AI for
                  analysis. Google may save and use this data to improve their
                  services. Please review
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

              <div className="flex justify-between items-center">
                <Button onClick={saveAIConfig} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save AI Configuration"}
                </Button>

                {configSaved && (
                  <span className="text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-right-5">
                    <CheckCircle className="h-4 w-4" />
                    Configuration saved
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* AI Features Demo Box */}
          <Card className="p-6 mt-4">
            <h2 className="text-xl flex items-center gap-2 mb-4">
              <Play className="h-5 w-5 text-green-500" />
              AI Features Demo
            </h2>
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-2">Current AI Status:</h3>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    "rounded-full h-3 w-3",
                    isEnabled && currentKey ? "bg-green-500" : "bg-red-500",
                  )}
                ></div>
                {isEnabled && currentKey ? (
                  <span className="text-green-600 dark:text-green-400">
                    AI features are enabled and ready to use
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    {!currentKey
                      ? "Missing API key"
                      : "AI features are disabled"}
                  </span>
                )}
              </div>

              {isEnabled && currentKey ? (
                <div className="mt-4 text-sm">
                  <p className="mb-2">
                    AI features available in your TaskFlow:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Task prioritization suggestions</li>
                    <li>Automatic task tagging</li>
                    <li>Sprint planning assistance</li>
                    <li>Intelligent work estimates</li>
                  </ul>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>To enable AI features:</p>
                  <ol className="list-decimal pl-5 space-y-1 mt-2">
                    <li>Add your Google AI API key above</li>
                    <li>Toggle &quot;Enable AI Features&quot;</li>
                    <li>Save your configuration</li>
                  </ol>
                </div>
              )}

              {/* Add a direct link to see AI in action */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={!isEnabled || !currentKey}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  See AI in Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Kanban Settings Tab */}
        <TabsContent value="kanban">
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">
                Kanban Board Configuration
              </h2>
              <ColumnManager projectId={currentProject?.id} />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Appearance Settings</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="w-full"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="w-full"
                  >
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="w-full"
                  >
                    System
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
