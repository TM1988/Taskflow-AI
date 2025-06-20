"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building, Plus, Database, InfoIcon, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrganizationCreated: (organization: any) => void;
}

export default function CreateOrganizationModal({
  open,
  onOpenChange,
  onOrganizationCreated,
}: CreateOrganizationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [useSelfHosting, setUseSelfHosting] = useState(false);
  const [mongoUrl, setMongoUrl] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  // Function to extract database name from MongoDB connection URL
  const extractDatabaseNameFromUrl = (url: string): string | null => {
    try {
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

  // Auto-detect database name when URL changes
  const handleMongoUrlChange = (url: string) => {
    setMongoUrl(url);
    const extractedDbName = extractDatabaseNameFromUrl(url);
    if (extractedDbName) {
      setDatabaseName(extractedDbName);
    }
    // Clear connection status when URL changes
    if (connectionError) setConnectionError(null);
    if (connectionSuccess) setConnectionSuccess(null);
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

  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    if (useSelfHosting && (!mongoUrl.trim() || !databaseName.trim())) {
      toast({
        title: "Error",
        description: "Database URL and name are required for self-hosting",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an organization",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);

      console.log("Creating organization:", { name: name.trim(), description: description.trim(), ownerId: user.uid });

      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          ownerId: user.uid,
          useSelfHosting: useSelfHosting,
          mongoUrl: useSelfHosting ? mongoUrl.trim() : undefined,
          databaseName: useSelfHosting ? databaseName.trim() : undefined,
        }),
      });

      if (response.ok) {
        const newOrganization = await response.json();
        
        console.log("Organization created successfully:", newOrganization);
        
        // Reset form
        setName("");
        setDescription("");
        setUseSelfHosting(false);
        setMongoUrl("");
        setDatabaseName("");
        
        // Notify parent component
        onOrganizationCreated(newOrganization);
        
        // Close modal
        onOpenChange(false);

        toast({
          title: "Success!",
          description: `Organization "${name}" created successfully`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create organization");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setUseSelfHosting(false);
    setMongoUrl("");
    setDatabaseName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create Organization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="org-name">Organization Name *</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
              className="mt-1"
              maxLength={50}
              required
            />
          </div>

          <div>
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this organization is about..."
              className="mt-1"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 characters
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="useSelfHosting"
                  checked={useSelfHosting}
                  onCheckedChange={(checked) => setUseSelfHosting(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="useSelfHosting" 
                    className="text-blue-900 dark:text-blue-200 font-medium cursor-pointer"
                  >
                    <Database className="h-4 w-4 inline mr-2" />
                    Self-host this organization
                  </Label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Store all organization, project, and task data in your custom MongoDB database. 
                    By default, data is stored in our secure cloud infrastructure.
                  </p>
                  <div className="flex items-center mt-2 text-xs text-blue-600 dark:text-blue-400">
                    <InfoIcon className="h-3 w-3 mr-1" />
                    <span>Requires custom database setup in Settings</span>
                  </div>
                </div>
              </div>
            </div>

            {useSelfHosting && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="mongoUrl">MongoDB Connection URL *</Label>
                  <Input
                    id="mongoUrl"
                    type="text"
                    value={mongoUrl}
                    onChange={(e) => handleMongoUrlChange(e.target.value)}
                    placeholder="mongodb://username:password@host:port/database"
                    className="mt-1 font-mono text-sm"
                    required={useSelfHosting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Don't have a database yet? Learn how to create one{" "}
                    <a 
                      href="https://docs.page/TM1988/Taskflow-AI-Docs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      here
                    </a>
                  </p>
                </div>

                <div>
                  <Label htmlFor="databaseName">
                    Database Name {databaseName && <span className="text-xs text-green-600">(auto-detected)</span>}
                  </Label>
                  <Input
                    id="databaseName"
                    type="text"
                    value={databaseName}
                    onChange={(e) => setDatabaseName(e.target.value)}
                    placeholder="Database name (auto-extracted from URL)"
                    className="mt-1 font-mono text-sm"
                    required={useSelfHosting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Don't have a database yet? Learn how to create one{" "}
                    <a 
                      href="https://docs.page/TM1988/Taskflow-AI-Docs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      here
                    </a>
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !mongoUrl.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    {isTestingConnection ? "Testing Connection..." : "Test Connection"}
                  </Button>
                  
                  {/* Connection Test Results */}
                  {connectionError && (
                    <Alert className="border-red-600 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800">Connection Error</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {connectionError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {connectionSuccess && !connectionError && (
                    <Alert className="border-green-600 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        {connectionSuccess}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
