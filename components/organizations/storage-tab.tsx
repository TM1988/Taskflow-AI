"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Cloud, 
  Server, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StorageTabProps {
  organizationId: string;
  organization: any;
  isOwner: boolean;
  onStorageUpdated: () => void;
}

export default function StorageTab({ 
  organizationId, 
  organization,
  isOwner, 
  onStorageUpdated 
}: StorageTabProps) {
  const [mongoUrl, setMongoUrl] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  const [isUpdatingStorage, setIsUpdatingStorage] = useState(false);
  const [destructiveWarningOpen, setDestructiveWarningOpen] = useState(false);
  const [orgStorageConfig, setOrgStorageConfig] = useState<any>(null);
  const { toast } = useToast();

  // Update local state when organization prop changes
  useEffect(() => {
    const settings = organization?.settings || {};
    const useSelfHosting = settings.useSelfHosting || false;
    
    // Update localStorage state when organization changes
    if (useSelfHosting !== (organization?.settings?.useSelfHosting || false)) {
      console.log('StorageTab: Organization storage settings changed, updating local state');
    }
    
    // If the organization has stored MongoDB connection details, populate the form
    if (useSelfHosting && settings.mongoUrl && settings.databaseName) {
      setMongoUrl(settings.mongoUrl);
      setDatabaseName(settings.databaseName);
    }
  }, [organization?.settings?.useSelfHosting, organization?.settings?.mongoUrl, organization?.settings?.databaseName]);

  const useSelfHosting = organization?.settings?.useSelfHosting || false;

  // Extract database name from MongoDB URL
  const extractDatabaseNameFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Remove leading slash and extract database name
      const dbName = pathname.substring(1);
      return dbName || null;
    } catch (error) {
      console.error("Error extracting database name from URL:", error);
      return null;
    }
  };

  // Auto-detect database name when URL changes
  const handleMongoUrlChange = (url: string) => {
    setMongoUrl(url);
    const extractedDbName = extractDatabaseNameFromUrl(url);
    if (extractedDbName && !databaseName.trim()) {
      setDatabaseName(extractedDbName);
    }
  };

  // Test MongoDB connection
  const handleTestConnection = async () => {
    if (!mongoUrl.trim()) {
      toast({
        title: "Connection URL Required",
        description: "Please enter a MongoDB connection URL",
        variant: "destructive",
      });
      return;
    }

    const dbNameToUse = databaseName.trim() || extractDatabaseNameFromUrl(mongoUrl) || 'taskflow_org';

    if (!dbNameToUse) {
      toast({
        title: "Database Name Required",
        description: "Please specify a database name in the URL or the database name field",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionError(null);
    setConnectionSuccess(null);

    try {
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
      setConnectionError(error instanceof Error ? error.message : "Failed to connect to database");
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

  // Update storage settings
  const handleUpdateStorage = async (newUseSelfHosting: boolean) => {
    console.log(`[StorageTab] handleUpdateStorage called: newUseSelfHosting=${newUseSelfHosting}, currentUseSelfHosting=${useSelfHosting}`);
    
    if (!isOwner) {
      toast({
        title: "Access Denied",
        description: "Only organization owners can change storage settings",
        variant: "destructive",
      });
      return;
    }

    // If enabling self-hosting, validate MongoDB connection details
    if (newUseSelfHosting && (!mongoUrl.trim() || !databaseName.trim())) {
      toast({
        title: "Database Configuration Required",
        description: "Please provide MongoDB URL and database name for self-hosting",
        variant: "destructive",
      });
      return;
    }

    // If disabling self-hosting, show destructive warning
    if (!newUseSelfHosting && useSelfHosting) {
      console.log("[StorageTab] Showing destructive warning dialog");
      setDestructiveWarningOpen(true);
      return;
    }

    console.log("[StorageTab] Proceeding with storage update...");
    setIsUpdatingStorage(true);

    try {
      // First test connection if enabling self-hosting
      if (newUseSelfHosting) {
        const testResponse = await fetch('/api/db/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionString: mongoUrl.trim(),
            databaseName: databaseName.trim(),
          }),
        });

        if (!testResponse.ok) {
          const testData = await testResponse.json();
          throw new Error(testData.error || "Database connection test failed");
        }
      }

      // Update organization storage settings
      const response = await fetch(`/api/organizations/${organizationId}/storage-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useSelfHosting: newUseSelfHosting,
          ...(newUseSelfHosting && {
            mongoUrl: mongoUrl.trim(),
            databaseName: databaseName.trim(),
          })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update storage settings");
      }

      // If enabling self-hosting, initialize the database
      if (newUseSelfHosting) {
        toast({
          title: "Initializing Database...",
          description: "Setting up your organization database with required collections and indexes",
        });

        try {
          const initResponse = await fetch('/api/organizations/initialize-database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId,
              connectionString: mongoUrl.trim(),
              databaseName: databaseName.trim(),
            }),
          });

          if (initResponse.ok) {
            const initResult = await initResponse.json();
            toast({
              title: "Database Initialized",
              description: `Created ${initResult.collectionsCreated || 0} collections and ${initResult.indexesCreated || 0} indexes`,
            });
          }
        } catch (initError) {
          console.error("Database initialization error:", initError);
          toast({
            title: "Warning",
            description: "Storage settings updated, but database initialization may have failed",
            variant: "default",
          });
        }
      }

      toast({
        title: "Success",
        description: newUseSelfHosting 
          ? "Switched to self-hosted storage successfully"
          : "Switched to official storage successfully",
      });

      // Clear form state
      setMongoUrl("");
      setDatabaseName("");
      setConnectionError(null);
      setConnectionSuccess(null);

      // Call the storage update callback to refresh parent state
      if (onStorageUpdated) {
        onStorageUpdated();
      }

    } catch (error) {
      console.error("Error updating storage settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update storage settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStorage(false);
    }
  };

  // Handle destructive warning confirmation
  const handleDestructiveWarningConfirm = async () => {
    setDestructiveWarningOpen(false);
    await handleUpdateStorage(false);
  };

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Organization Storage Settings
          </CardTitle>
          <CardDescription>
            Storage configuration for this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              Only organization owners can view and modify storage settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Current Storage Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Storage Configuration
            </CardTitle>
            <CardDescription>
              Your organization data storage settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {useSelfHosting ? (
                  <>
                    <Server className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Self-Hosted Database</p>
                      <p className="text-sm text-muted-foreground">
                        Using your custom MongoDB database
                      </p>
                      {organization?.settings?.database && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Database: {organization.settings.database.databaseName}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Cloud className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Official Taskflow Database</p>
                      <p className="text-sm text-muted-foreground">
                        Using our secure cloud infrastructure
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Badge variant={useSelfHosting ? "secondary" : "default"}>
                {useSelfHosting ? "Self-Hosted" : "Official"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Storage Options */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Official Database Option */}
          <Card className={!useSelfHosting ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Official Database
                </CardTitle>
                {!useSelfHosting && (
                  <Badge variant="default">Current</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                <p className="text-sm text-green-200">
                  <strong>What's stored here:</strong> Organization membership is always stored in our database for discoverability. When not self-hosting, all organization, project, and task data is also stored here.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Pros:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• No setup required</li>
                  <li>• Managed backups and security</li>
                  <li>• Optimal performance</li>
                  <li>• Free to use</li>
                  <li>• Automatic updates</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Cons:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Less control over data</li>
                  <li>• Dependent on our infrastructure</li>
                </ul>
              </div>

              {useSelfHosting && (
                <Button 
                  onClick={() => handleUpdateStorage(false)}
                  disabled={isUpdatingStorage}
                  className="w-full"
                  variant="outline"
                >
                  {isUpdatingStorage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Cloud className="mr-2 h-4 w-4" />
                  )}
                  Switch to Official Database
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Self-Hosted Database Option */}
          <Card className={useSelfHosting ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Self-Hosted Database
                </CardTitle>
                {useSelfHosting && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-200">
                  <strong>What's stored here:</strong> Organization membership remains in our database for discoverability, but all organization, project, and task data is stored in your custom MongoDB database.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Pros:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Full control over your data</li>
                  <li>• Custom backup strategies</li>
                  <li>• Compliance with data regulations</li>
                  <li>• Scalable storage options</li>
                  <li>• MongoDB Atlas free tier available</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Cons:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Requires setup and maintenance</li>
                  <li>• Potential additional costs</li>
                  <li>• You manage security and backups</li>
                </ul>
              </div>

              {!useSelfHosting && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="orgMongoUrl">MongoDB Connection URL</Label>
                    <Input
                      id="orgMongoUrl"
                      type="text"
                      value={mongoUrl}
                      onChange={(e) => {
                        handleMongoUrlChange(e.target.value);
                        if (connectionError) setConnectionError(null);
                      }}
                      placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgDatabaseName">
                      Database Name 
                      {databaseName && <span className="text-xs text-green-400 ml-1">(auto-detected)</span>}
                    </Label>
                    <Input
                      id="orgDatabaseName"
                      type="text"
                      value={databaseName}
                      onChange={(e) => {
                        setDatabaseName(e.target.value);
                        if (connectionError) setConnectionError(null);
                      }}
                      placeholder="Organization database name"
                      className="font-mono text-sm"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Don't have a database yet? Learn how to create one{" "}
                    <a 
                      href="https://docs.page/TM1988/Taskflow-AI-Docs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      here
                    </a>
                  </p>

                  {/* Connection Test Results */}
                  {connectionError && (
                    <Alert className="border-red-600 bg-red-900">
                      <XCircle className="h-4 w-4 text-red-200" />
                      <AlertTitle className="text-red-200">Connection Error</AlertTitle>
                      <AlertDescription className="text-red-200">
                        {connectionError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {connectionSuccess && !connectionError && (
                    <Alert className="border-green-600 bg-green-900">
                      <CheckCircle className="h-4 w-4 text-green-200" />
                      <AlertTitle className="text-green-200">Connection Successful</AlertTitle>
                      <AlertDescription className="text-green-200">
                        {connectionSuccess}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTestConnection}
                      disabled={isTestingConnection || !mongoUrl.trim()}
                      variant="outline"
                      size="sm"
                    >
                      {isTestingConnection ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Database className="mr-2 h-4 w-4" />
                      )}
                      Test Connection
                    </Button>

                    <Button 
                      onClick={() => handleUpdateStorage(true)}
                      disabled={isUpdatingStorage || !mongoUrl.trim() || !databaseName.trim() || !!connectionError}
                      className="flex-1"
                    >
                      {isUpdatingStorage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Server className="mr-2 h-4 w-4" />
                      )}
                      Enable Self-Hosting
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Data Architecture</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>Organization Membership:</strong> Always stored in Taskflow's database for user discovery and invitation management</li>
                  <li>• <strong>Organization Data:</strong> Name, settings, and metadata (stored based on your choice)</li>
                  <li>• <strong>Project & Task Data:</strong> All project and task information (stored based on your choice)</li>
                  <li>• <strong>User Profiles:</strong> Always stored in Taskflow's database for authentication and cross-organization features</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Switching Storage Types</AlertTitle>
              <AlertDescription>
                Switching between storage types will not automatically migrate your data. 
                Make sure to export your data before switching if you want to preserve it.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Destructive Warning Dialog */}
      <Dialog open={destructiveWarningOpen} onOpenChange={setDestructiveWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Storage Switch
            </DialogTitle>
            <DialogDescription>
              You are about to switch from self-hosted storage back to the official Taskflow database.
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="border-red-600 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Warning: Data Loss Risk</AlertTitle>
            <AlertDescription className="text-red-700">
              <ul className="mt-2 space-y-1 text-sm">
                <li>• All organization, project, and task data in your self-hosted database will become inaccessible</li>
                <li>• This action cannot be undone</li>
                <li>• Make sure to export any important data before proceeding</li>
                <li>• Organization membership data will be preserved</li>
              </ul>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDestructiveWarningOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDestructiveWarningConfirm}
              disabled={isUpdatingStorage}
            >
              {isUpdatingStorage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              Switch to Official Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
