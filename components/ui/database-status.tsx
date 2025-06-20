"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Database, Cloud, Server } from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { databaseService, DatabaseConfig } from "@/services/db/databaseService";

function DatabaseStatus() {
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null);
  const [orgDbConfig, setOrgDbConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { currentOrganization } = useWorkspace();
  const pathname = usePathname();

  // Determine if we're on a project page based on URL, not context
  const isProjectPage = pathname.startsWith('/projects/');
  
  const fetchDatabaseConfig = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const config = await databaseService.getDatabaseConfig(user.uid);
      console.log("Database config fetched:", config); // Debug log
      setDbConfig(config);
    } catch (error) {
      console.error("Error fetching database config:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const fetchOrganizationDbConfig = useCallback(async () => {
    if (!currentOrganization?.id) {
      setOrgDbConfig(null);
      return;
    }

    try {
      // Fetch organization database configuration
      const response = await fetch(`/api/organizations/${currentOrganization.id}/db-config`);
      if (response.ok) {
        const orgConfig = await response.json();
        console.log("Organization database config fetched:", orgConfig);
        setOrgDbConfig(orgConfig);
      }
    } catch (error) {
      console.error("Error fetching organization database config:", error);
      setOrgDbConfig(null);
    }
  }, [currentOrganization?.id]);

  // Memoize the database status calculation for performance
  const databaseStatus = useMemo(() => {
    let isUsingCustomDB = false;
    let databaseName = "Official";
    const projectIdFromUrl = pathname.startsWith('/projects/') ? pathname.split('/')[2] : null;

    if (isProjectPage) {
      // For project pages, check organization's database configuration
      if (orgDbConfig && orgDbConfig.useCustomDB) {
        isUsingCustomDB = true;
        databaseName = orgDbConfig.databaseName || "Custom";
      } else {
        isUsingCustomDB = false;
        databaseName = "Official";
      }
    } else {
      // For personal pages, check user's custom database config
      isUsingCustomDB = !!(dbConfig && dbConfig.useCustomMongoDB && (dbConfig.connectionString === '[CONFIGURED]' || (dbConfig.connectionString && dbConfig.connectionString.length > 0)));
      databaseName = isUsingCustomDB ? (dbConfig?.databaseName || "Custom") : "Official";
    }

    return { isUsingCustomDB, databaseName };
  }, [isProjectPage, orgDbConfig, dbConfig, pathname]);

  useEffect(() => {
    fetchDatabaseConfig();
  }, [fetchDatabaseConfig]);

  useEffect(() => {
    if (isProjectPage) {
      fetchOrganizationDbConfig();
    }
  }, [isProjectPage, fetchOrganizationDbConfig]);

  // Listen for database config changes with immediate response
  useEffect(() => {
    const handleDatabaseConfigChange = () => {
      console.log("Database config change event received, refreshing...");
      fetchDatabaseConfig();
      
      // Trigger board refresh if we're on a board page
      if (window.boardContentRef?.refreshTasks) {
        setTimeout(() => {
          console.log("Triggering board refresh after database config change");
          window.boardContentRef?.refreshTasks();
        }, 500);
      }
    };

    // Listen for our custom event from settings page
    window.addEventListener('databaseConfigChanged', handleDatabaseConfigChange);

    // Also set up a periodic refresh as backup (less frequent for performance)
    const interval = setInterval(() => {
      fetchDatabaseConfig();
    }, 30000); // Refresh every 30 seconds instead of 10 for better performance

    return () => {
      window.removeEventListener('databaseConfigChanged', handleDatabaseConfigChange);
      clearInterval(interval);
    };
  }, [fetchDatabaseConfig]);

  if (loading) {
    return (
      <div className="flex justify-center py-3 bg-muted/20 border-b border-border/40">
        <div className="h-8 w-40 bg-muted/50 animate-pulse rounded-full"></div>
      </div>
    );
  }

  // Debug logging to verify the fix
  console.log("Database status - pathname:", pathname, "isProjectPage:", isProjectPage, "org:", currentOrganization?.name, "useCustomMongoDB:", dbConfig?.useCustomMongoDB, "isUsingCustomDB:", databaseStatus.isUsingCustomDB, "databaseName:", databaseStatus.databaseName);

  return (
    <div className="flex justify-center py-3 bg-muted/20 border-b border-border/40">
      <Badge 
        variant={databaseStatus.isUsingCustomDB ? "secondary" : "default"} 
        className="flex items-center gap-2 text-sm px-4 py-2 shadow-sm transition-all duration-200"
      >
        {databaseStatus.isUsingCustomDB ? (
          <>
            <Server className="h-4 w-4" />
            {databaseStatus.databaseName}
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4" />
            Official
          </>
        )}
      </Badge>
    </div>
  );
}

export default memo(DatabaseStatus);
