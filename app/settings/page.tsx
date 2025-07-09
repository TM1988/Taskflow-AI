"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import { auth } from "@/config/firebase";
import { cn } from "@/lib/utils";
import ColumnManager from "@/components/board/column-manager";
import CreateOrganizationModal from "@/components/organizations/create-organization-modal";
import InvitationManager from "@/components/organizations/invitation-manager";
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload";
import DatabaseStep from "@/components/onboarding/database-step";

import SupportSection from "@/components/support/support-section";
import {
  Settings,
  User,
  Mail,
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
  Users,
  HeadphonesIcon,
  TrendingUp,
  Database,
  Cloud,
  Server,
  InfoIcon,
  XCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatDate = (dateValue: any): string => {
  if (!dateValue) return "Unknown";

  try {
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Unknown";
  }
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme, theme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [userTags, setUserTags] = useState<string[]>([]);

  // Add the missing formData state for profile settings
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
  });

  // AI configuration state
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash-latest");

  const [defaultProjectName, setDefaultProjectName] = useState("");
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);

  // Add organization state - SIMPLIFIED
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Add modal state
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [databaseModalOpen, setDatabaseModalOpen] = useState(false);
  const [databaseConfig, setDatabaseConfig] = useState<any>(null);
  const [mongoUrl, setMongoUrl] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);

  // Tab state for URL parameter handling
  const [activeTab, setActiveTab] = useState("database");
  const searchParams = useSearchParams();

  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Function to extract database name from MongoDB connection URL
  const extractDatabaseNameFromUrl = (url: string): string | null => {
    try {
      // Handle mongodb:// or mongodb+srv:// URLs
      if (!url) return null;
      
      // Extract database name from URL path
      const urlObj = new URL(url);
      let dbName = urlObj.pathname;
      
      // Remove leading slash
      if (dbName.startsWith('/')) {
        dbName = dbName.substring(1);
      }
      
      // If no database in path, try to get it from query parameter
      if (!dbName && urlObj.searchParams.has('authSource')) {
        dbName = urlObj.searchParams.get('authSource') || '';
      }
      
      return dbName || null;
    } catch (error) {
      console.error("Error extracting database name from URL:", error);
      return null;
    }
  };

  // Effect to update database name when URL changes
  useEffect(() => {
    const extractedDbName = extractDatabaseNameFromUrl(mongoUrl);
    if (extractedDbName) {
      setDatabaseName(extractedDbName);
    }
  }, [mongoUrl]);

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile') {
      // Redirect profile tab to new profile page
      router.push(`/profile/${user?.uid}`);
      return;
    }
    if (tab && ['database', 'tags', 'support', 'ai', 'kanban', 'appearance'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, router, user]);

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
          setSelectedModel(data.model || "gemini-1.5-flash-latest");
        }
      } catch (error) {
        console.error("Error fetching AI config:", error);
      }
    };

    fetchConfig();
  }, [user]);

  // Initialize formData when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Fetch user tags when component mounts
  useEffect(() => {
    const fetchUserTags = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`/api/user-tags/${user.uid}`);
        if (response.ok) {
          const tags = await response.json();
          setUserTags(tags);
        }
      } catch (error) {
        console.error("Error fetching user tags:", error);
      }
    };

    fetchUserTags();
  }, [user]);

  // Function to save tags to backend
  const saveUserTags = async (tags: string[]) => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/user-tags/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tags saved successfully",
        });
      } else {
        throw new Error("Failed to save tags");
      }
    } catch (error) {
      console.error("Error saving tags:", error);
      toast({
        title: "Error",
        description: "Failed to save tags",
        variant: "destructive",
      });
    }
  };

  // Fetch database config on component mount
  useEffect(() => {
    fetchDatabaseConfig();
  }, [user]);

  // Handle profile form submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Update profile in Firebase Auth
      await updateProfile({
        displayName: formData.displayName,
      });

      // Update profile in our database
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          displayName: formData.displayName,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !userTags.includes(newTag.trim())) {
      const newTags = [...userTags, newTag.trim()];
      setUserTags(newTags);
      setNewTag("");
      await saveUserTags(newTags);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = userTags.filter((tag) => tag !== tagToRemove);
    setUserTags(newTags);
    await saveUserTags(newTags);
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
          model: selectedModel,
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
        const errorMessage = errorData.error || "Failed to save configuration";
        const errorDetails = errorData.details;
        
        toast({
          title: "Error",
          description: errorDetails ? `${errorMessage} ${errorDetails}` : errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving AI config:", error);
      toast({
        title: "Error",
        description: "Network error while saving AI configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrganizationCreated = (newOrganization: any) => {
    setOrganizations((prev) => [...prev, newOrganization]);
    toast({
      title: "Success",
      description: `Organization "${newOrganization.name}" created successfully`,
    });
  };

  // Add function to manually fetch organizations when needed
  const fetchOrganizations = async () => {
    if (!user?.uid || loadingOrgs) return;

    try {
      setLoadingOrgs(true);
      console.log("Fetching organizations for user:", user.uid);
      
      const response = await fetch(`/api/organizations?userId=${user.uid}`);
      
      if (response.ok) {
        const orgs = await response.json();
        console.log("Fetched organizations:", orgs);
        setOrganizations(orgs);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch organizations:', errorData);
        throw new Error(errorData.error || "Failed to fetch organizations");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handlePhotoUpdate = async (newPhotoURL: string | null) => {
    if (!user) return;

    try {
      // Update in Firebase Auth
      await updateProfile({
        photoURL: newPhotoURL || undefined,
      });

      // Update in our database
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          photoURL: newPhotoURL,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile picture in database");
      }

      // Force a refresh of the user state by reloading the auth user
      await auth.currentUser?.reload();

      toast({
        title: "Success",
        description: newPhotoURL ? "Profile picture updated" : "Profile picture removed",
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    }
  };

  // Database configuration handlers
  const fetchDatabaseConfig = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/db/configure?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        const config = data.config || {};
        setDatabaseConfig(config);
      }
    } catch (error) {
      console.error("Error fetching database config:", error);
    }
  };

  const handleDatabaseComplete = async (data: any) => {
    if (!user?.uid) return;

    try {
      const response = await fetch('/api/db/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          config: data,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Database configuration saved successfully",
        });
        setDatabaseModalOpen(false);
        setConnectionError(null);
        setConnectionSuccess(null);
        fetchDatabaseConfig(); // Refresh the config
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save database configuration");
      }
    } catch (error) {
      console.error("Error saving database config:", error);
      toast({
        title: "Error",
        description: "Failed to save database configuration",
        variant: "destructive",
      });
    }
  };

  const handleDatabaseSkip = () => {
    setDatabaseModalOpen(false);
    setConnectionError(null);
    setConnectionSuccess(null);
  };

  const handleTestConnection = async () => {
    if (!mongoUrl.trim()) {
      toast({
        title: "Connection URL Required",
        description: "Please enter a MongoDB connection URL",
        variant: "destructive",
      });
      return;
    }

    // Extract database name from URL if not manually set
    const dbNameToUse = databaseName.trim() || extractDatabaseNameFromUrl(mongoUrl) || 'taskflow';

    if (!dbNameToUse) {
      toast({
        title: "Database Name Required",
        description: "Please specify a database name in the URL or the database name field",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);

    try {
      // Clear any previous connection status
      setConnectionError(null);
      setConnectionSuccess(null);
      
      const response = await fetch('/api/db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: mongoUrl.trim(),
          databaseName: dbNameToUse,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Set connection success message
        setConnectionSuccess(data.message || `Successfully connected to database "${dbNameToUse}"`);
        toast({
          title: "Connection Successful",
          description: `Successfully connected to database "${dbNameToUse}"`,
        });
      } else {
        throw new Error(data.error || "Connection failed");
      }
    } catch (error) {
      console.error("Database connection test failed:", error);
      // Set the connection error to display in the UI
      setConnectionError(error instanceof Error ? error.message : "Failed to connect to database");
      // Clear any success message
      setConnectionSuccess(null);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveCustomDatabase = async () => {
    if (!mongoUrl.trim()) {
      toast({
        title: "Connection URL Required",
        description: "Please enter a MongoDB connection URL",
        variant: "destructive",
      });
      return;
    }

    // Extract database name from URL if not manually set
    const dbNameToUse = databaseName.trim() || extractDatabaseNameFromUrl(mongoUrl) || 'taskflow';

    if (!user?.uid) return;

    try {
      const response = await fetch('/api/db/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          config: {
            useOfficialMongoDB: false,
            useCustomMongoDB: true,
            connectionString: mongoUrl.trim(),
            databaseName: dbNameToUse,
            performanceWarningAcknowledged: true,
          },
        }),
      });

      if (response.ok) {
        // After saving the config, initialize the database with required collections and indexes
        toast({
          title: "Setting up database...",
          description: "Initializing your custom database with required collections and indexes",
        });

        try {
          const initResponse = await fetch('/api/db/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              connectionString: mongoUrl.trim(),
              databaseName: dbNameToUse,
            }),
          });

          if (initResponse.ok) {
            const initResult = await initResponse.json();
            const stats = initResult.stats;
            
            let description = "";
            
            if (stats?.preservedExistingData && (stats?.collectionsCreated > 0 || stats?.indexesCreated > 0)) {
              description = "✅ Custom database connected successfully! ";
              if (stats.collectionsCreated > 0) {
                description += `Added ${stats.collectionsCreated} new collection(s). `;
              }
              if (stats.indexesCreated > 0) {
                description += `Added ${stats.indexesCreated} new index(es). `;
              }
              if (stats.defaultDataCreated) {
                description += "Created basic column templates. ";
              }
              description += "All existing task data preserved. Projects remain in Firestore.";
            } else if (stats?.preservedExistingData) {
              description = "✅ Custom database reconnected successfully! All existing task data is intact. Projects and organizations remain in Firestore.";
            } else {
              description = "Custom database connected successfully! Tasks will be stored here, projects in Firestore.";
            }
            
            // Show task count if available
            if (stats?.existingData?.tasks > 0) {
              description += ` Found ${stats.existingData.tasks} existing task(s).`;
            }
            
            toast({
              title: "Database Ready",
              description: description,
            });
          } else {
            // Config saved but initialization failed - still show success but with warning
            toast({
              title: "Database Configured",
              description: "Configuration saved, but some initialization steps may have failed. Your database should still work.",
              variant: "default",
            });
          }
        } catch (initError) {
          console.error("Database initialization error:", initError);
          toast({
            title: "Database Configured",
            description: "Configuration saved, but initialization encountered issues. Your database should still work.",
            variant: "default",
          });
        }

        setDatabaseModalOpen(false);
        setConnectionError(null);
        setConnectionSuccess(null);
        fetchDatabaseConfig(); // Refresh the config
        setMongoUrl(""); // Clear the input
        setDatabaseName(""); // Clear the database name
        
        // Invalidate database cache to ensure immediate switch to new database
        try {
          await fetch('/api/db/invalidate-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
          });
          console.log('Database cache invalidated successfully');
        } catch (cacheError) {
          console.warn('Failed to invalidate database cache:', cacheError);
        }
        
        // Trigger a custom event to notify other components about the database config change
        // Add a small delay to ensure the API call has fully completed
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('databaseConfigChanged'));
        }, 100);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save database configuration");
      }
    } catch (error) {
      console.error("Error saving database config:", error);
      toast({
        title: "Error",
        description: "Failed to save database configuration",
        variant: "destructive",
      });
    }
  };

  const handleSwitchToOfficial = async () => {
    if (!user?.uid) return;
    
    // Clear any existing connection messages when switching to official database
    if (connectionError) setConnectionError(null);
    if (connectionSuccess) setConnectionSuccess(null);

    try {
      const response = await fetch('/api/db/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          config: {
            useOfficialMongoDB: true,
            useCustomMongoDB: false,
            connectionString: '',
            databaseName: '',
            includeOrganizations: false,
            performanceWarningAcknowledged: false,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Switched back to official database",
        });
        fetchDatabaseConfig(); // Refresh the config
        
        // Invalidate database cache to ensure immediate switch to official database
        try {
          await fetch('/api/db/invalidate-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
          });
          console.log('Database cache invalidated successfully');
        } catch (cacheError) {
          console.warn('Failed to invalidate database cache:', cacheError);
        }
        
        // Trigger a custom event to notify other components about the database config change
        // Add a small delay to ensure the API call has fully completed
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('databaseConfigChanged'));
        }, 100);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to switch database configuration");
      }
    } catch (error) {
      console.error("Error switching database config:", error);
      toast({
        title: "Error",
        description: "Failed to switch database configuration",
        variant: "destructive",
      });
    }
  };

  const handleCheckDatabaseStatus = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/db/status?userId=${user.uid}`);
      
      if (response.ok) {
        const result = await response.json();
        
        const statusMessage = `
Database: ${result.databaseName}
Type: ${result.type || 'Custom Database'}
${result.note || ''}

Task Data:
- Tasks: ${result.stats.tasks}
- Columns: ${result.stats.columns}
- Comments: ${result.stats.comments}
${result.stats.organizations !== undefined ? `- Organizations: ${result.stats.organizations}` : ''}

Sample Tasks:
${result.sampleData.tasks.map((t: any) => `- ${t.title || 'Untitled'} (Project: ${t.projectId})`).join('\n') || 'No tasks found'}

Sample Columns:
${result.sampleData.columns?.map((c: any) => `- ${c.name} (Order: ${c.order}${c.isTemplate ? ', Template' : ''})`).join('\n') || 'No columns found'}

${result.sampleData.organizations ? `Sample Organizations:
${result.sampleData.organizations.map((o: any) => `- ${o.name} (Owner: ${o.ownerId})`).join('\n')}` : ''}

Note: Projects and user data are stored in Firestore, not in your custom database.
        `.trim();
        
        alert(statusMessage);
      } else {
        toast({
          title: "Error",
          description: "Failed to check database status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking database status:", error);
      toast({
        title: "Error",
        description: "Failed to check database status",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p>Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
        
        {/* Profile Settings Moved Notice */}
        <Alert className="mt-4">
          <User className="h-4 w-4" />
          <AlertTitle>Profile Settings Have Moved</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Profile settings are now available on your dedicated profile page.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/profile/${user?.uid}`)}
              className="ml-4"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Profile
            </Button>
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4" />
            Support
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Database Configuration</h2>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Choose your database configuration for TaskFlow. You can use our official database or connect your own MongoDB database for storing your task data. You can optionally also store your organization data in your custom database. Note: Projects and user profiles will always remain in our secure Firestore database.
              </p>
              
              {/* Current Status */}
              {databaseConfig?.useCustomMongoDB ? (
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-200">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Currently Connected: Your Own Database</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    You are using your own MongoDB database.
                  </p>
                </div>
              ) : (
                <div className="bg-green-800 border border-green-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Currently Connected: Official Database</span>
                  </div>
                  <p className="text-sm text-green-300 mt-1">
                    You are using TaskFlow&apos;s official shared database.
                  </p>
                </div>
              )}

              {/* Debug Button */}
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCheckDatabaseStatus}
                  className="text-xs"
                >
                  <Database className="mr-2 h-3 w-3" />
                  Check Database Status (Debug)
                </Button>
              </div>

              {/* Database Options Comparison */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Official Database */}
                <Card className={`p-4 border-2 ${!databaseConfig?.useCustomMongoDB ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-black bg-black text-white'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Cloud className="h-5 w-5 text-white" />
                    <h3 className="font-semibold text-white">Official Database</h3>
                    {!databaseConfig?.useCustomMongoDB && (
                      <Badge variant="secondary" className="bg-white text-black">Current</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1 text-white">Pros:</h4>
                      <ul className="text-sm space-y-1 text-gray-200">
                        <li>• Free to use</li>
                        <li>• No setup required</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1 text-white">Cons:</h4>
                      <ul className="text-sm space-y-1 text-gray-200">
                        <li>• Cannot guarantee reliability</li>
                        <li>• Storage may be full</li>
                        <li>• Connections may be full</li>
                        <li>• No backups</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Your Own Database */}
                <Card className={`p-4 border-2 ${databaseConfig?.useCustomMongoDB ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-black bg-black text-white'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="h-5 w-5 text-white" />
                    <h3 className="font-semibold text-white">Your Own Database</h3>
                    {databaseConfig?.useCustomMongoDB && (
                      <Badge variant="secondary" className="bg-white text-black">Current</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-200">
                        <strong>What&apos;s stored here:</strong> Your task data (tasks, columns, comments). Optionally your organization data if enabled above. Projects and user profiles remain in our secure Firestore.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1 text-white">Pros:</h4>
                      <ul className="text-sm space-y-1 text-gray-200">
                        <li>• Relatively easy to setup</li>
                        <li>• You control how much storage you have</li>
                        <li>• You can access it easier</li>
                        <li>• MongoDB Atlas has a free plan which is good!</li>
                        <li>• You can have backups</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1 text-white">Cons:</h4>
                      <ul className="text-sm space-y-1 text-gray-200">
                        <li>• You might have to pay for more resources</li>
                        <li>• You have to setup everything yourself</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Configuration Section */}
              <div className="space-y-4">
                {databaseConfig?.useCustomMongoDB ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Switch Back to Official Database</h3>
                    <p className="text-sm text-muted-foreground">
                      You can switch back to using the official TaskFlow database at any time.
                    </p>
                    
                    {/* Warning for switching back to official */}
                    <Alert className="border-red-600 bg-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-200" />
                      <AlertDescription className="text-red-200">
                        <strong>Warning:</strong> Switching back to the official database will result in the loss of all task data stored in your custom database. This action cannot be undone. Make sure to backup your data before switching.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleSwitchToOfficial}
                      className="w-full"
                    >
                      <Cloud className="mr-2 h-4 w-4" />
                      Switch to Official Database
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">Switch to Your Own Database</h3>
                    <p className="text-sm text-muted-foreground">
                      If you want to use your own MongoDB database, enter your connection URL below:
                    </p>
                    
                    {/* Warning for switching to custom database */}
                    <Alert className="border-red-600 bg-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-200" />
                      <AlertDescription className="text-red-200">
                        <strong>Warning:</strong> Switching to your own database will result in the loss of all task data stored in the official database. Your data will only be accessible through your custom database connection. This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                    
                    {/* New MongoDB Permissions Guide */}
                    <Card className="p-4 border border-amber-600 bg-amber-950">
                      <div className="flex items-start gap-3">
                        <InfoIcon className="h-5 w-5 text-amber-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-400 mb-1">MongoDB Database Permissions</h4>
                          <p className="text-sm text-amber-200 mb-2">
                            Your MongoDB user needs the following permissions to work properly with TaskFlow:
                          </p>
                          <ul className="text-xs space-y-1 text-amber-200 list-disc pl-4">
                            <li>Read and write access to the database</li>
                            <li>Ability to create and modify collections</li>
                            <li>Ability to create and manage indexes</li>
                          </ul>
                          <p className="text-sm text-amber-200 mt-2">
                            If you&apos;re using MongoDB Atlas, make sure your user has at least the 
                            <span className="font-mono bg-amber-900 px-1 rounded">readWrite</span> role 
                            for the database you&apos;re connecting to.
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Add error display for connection test */}
                    {connectionError && (
                      <Alert className="border-red-600 bg-red-900">
                        <XCircle className="h-4 w-4 text-red-200" />
                        <AlertTitle className="text-red-200">Connection Error</AlertTitle>
                        <AlertDescription className="text-red-200">
                          {connectionError.includes('Unauthorized') || connectionError.includes('not authorized') ? (
                            <>
                              <p className="font-medium">Authentication Error: Insufficient permissions</p>
                              <p className="text-sm mt-1">Your MongoDB user doesn&apos;t have the required permissions to write to the &quot;{databaseName || extractDatabaseNameFromUrl(mongoUrl) || 'specified'}&quot; database.</p>
                              <ul className="text-xs mt-2 list-disc pl-4 space-y-1">
                                <li>Verify that the database name is correct</li>
                                <li>Verify that your user has <span className="font-mono bg-red-950 px-1 rounded">readWrite</span> permissions for this specific database</li>
                                <li>If using MongoDB Atlas, check the database access settings</li>
                              </ul>
                            </>
                          ) : (
                            connectionError
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Add success message for connection test */}
                    {connectionSuccess && !connectionError && (
                      <Alert className="border-green-600 bg-green-900">
                        <CheckCircle className="h-4 w-4 text-green-200" />
                        <AlertTitle className="text-green-200">Connection Successful</AlertTitle>
                        <AlertDescription className="text-green-200">
                          <p>{connectionSuccess}</p>
                          <p className="text-xs mt-1">You can now save your database configuration.</p>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-3">
                      <Label htmlFor="mongoUrl">MongoDB Connection URL</Label>
                      <Input
                        id="mongoUrl"
                        type="text"
                        value={mongoUrl}
                        onChange={(e) => {
                          setMongoUrl(e.target.value);
                          // Clear any connection error when the user modifies the URL
                          if (connectionError) setConnectionError(null);
                        }}
                        placeholder="mongodb://username:password@host:port/database?authSource=database"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Include the database name in the URL path (e.g., /myVercelAppDB)
                        <br />
                        Don&apos;t have a database yet? Learn how to create one{" "}
                        <a 
                          href="https://docs.page/TM1988/Taskflow-AI-Docs" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          here
                        </a>
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="databaseName">Database Name {databaseName && <span className="text-xs text-green-400">(auto-detected)</span>}</Label>
                      <Input
                        id="databaseName"
                        type="text"
                        value={databaseName}
                        onChange={(e) => {
                          setDatabaseName(e.target.value);
                          // Clear any connection error when the user modifies the database name
                          if (connectionError) setConnectionError(null);
                        }}
                        placeholder="Database name (auto-extracted from URL)"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {databaseName ? 
                          "Auto-detected from URL. You can override this if needed." : 
                          "Enter database name or include it in the connection URL"
                        }
                        <br />
                        Don&apos;t have a database yet? Learn how to create one{" "}
                        <a 
                          href="https://docs.page/TM1988/Taskflow-AI-Docs" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          here
                        </a>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleTestConnection}
                        disabled={!mongoUrl.trim() || isTestingConnection}
                      >
                        <Database className="mr-2 h-4 w-4" />
                        {isTestingConnection ? "Testing..." : "Test Connection"}
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleSaveCustomDatabase}
                        disabled={!mongoUrl.trim()}
                      >
                        Save Configuration
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Tag Management</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {userTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <form onSubmit={handleAddTag} className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a new tag"
                  className="flex-1"
                />
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Email Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your tasks and projects
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
                    Get push notifications for urgent updates
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
                    Receive a weekly summary of your activity
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

        {/* Support Tab */}
        <TabsContent value="support">
          <SupportSection userId={user?.uid || ""} userEmail={user?.email || ""} />
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-semibold">AI Configuration</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-200">
                      Enhance TaskFlow with AI
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                      Add your Google AI API key to unlock intelligent task
                      management features.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Google AI API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      currentKey ? "Enter new API key to update" : "Enter your Google AI API key"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Google AI Studio
                      <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable AI Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Turn on AI-powered task assistance
                    </p>
                  </div>
                  <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                </div>

                {isEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="ai-model">AI Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>                        <SelectContent>
                          <SelectItem value="gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem>
                          <SelectItem value="gemini-1.5-pro-latest">Gemini 1.5 Pro</SelectItem>
                          <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choose which AI model to use for generating task suggestions
                    </p>
                  </div>
                )}

                <Button
                  onClick={saveAIConfig}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Configuration"}
                </Button>

                {configSaved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Configuration saved successfully!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Current Status</h3>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      isEnabled && currentKey
                        ? "bg-green-500"
                        : "bg-gray-300"
                    )}
                  />
                  <span className="text-sm">
                    {isEnabled && currentKey ? (
                      "AI features are active"
                    ) : (
                      <span className="text-muted-foreground">
                        {!currentKey
                          ? "Missing API key"
                          : "AI features are disabled"}
                      </span>
                    )}
                  </span>
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

      {/* Add the modal */}
      <CreateOrganizationModal
        open={createOrgModalOpen}
        onOpenChange={setCreateOrgModalOpen}
        onOrganizationCreated={handleOrganizationCreated}
      />

      {/* Database Configuration Modal */}
      <Dialog open={databaseModalOpen} onOpenChange={setDatabaseModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Database Connection</DialogTitle>
          </DialogHeader>
          <DatabaseStep
            onComplete={handleDatabaseComplete}
            onSkip={handleDatabaseSkip}
            initialData={databaseConfig}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
