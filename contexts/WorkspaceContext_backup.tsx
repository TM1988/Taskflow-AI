"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/services/auth/AuthContext';

export type WorkspaceType = 'personal' | 'organization';

export interface Organization {
  id: string;
  name: string;
  role: 'Admin' | 'Member' | 'Owner';
  projects: OrganizationProject[];
}

export interface OrganizationProject {
  id: string;
  name: string;
  description?: string;
}

export interface WorkspaceContextType {
  currentWorkspace: WorkspaceType;
  currentOrganization: Organization | null;
  currentProject: OrganizationProject | null;
  organizations: Organization[];
  setWorkspace: (type: WorkspaceType, orgId?: string, projectId?: string) => Promise<void>;
  isPersonalWorkspace: boolean;
  getWorkspaceDisplayName: () => string;
  refreshOrganizations: () => Promise<Organization[]>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Browser storage helpers for caching project names
const STORAGE_KEY = 'taskflow-project-names';

const getStoredProjectName = (projectId: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const cache = JSON.parse(stored);
      return cache[projectId] || null;
    }
  } catch (error) {
    console.error('Error reading project name cache:', error);
  }
  return null;
};

const storeProjectName = (projectId: string, projectName: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const cache = stored ? JSON.parse(stored) : {};
    cache[projectId] = projectName;
    // Keep only last 50 projects to avoid unlimited growth
    const entries = Object.entries(cache);
    if (entries.length > 50) {
      const recent = entries.slice(-50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(recent)));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Error storing project name cache:', error);
  }
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Refs to prevent unnecessary re-renders
  const loadedProjectsRef = useRef<Set<string>>(new Set());
  const lastPathnameRef = useRef<string>('');
  
  // Automatically detect workspace type from URL
  const isProjectPage = pathname.startsWith('/projects/');
  const projectIdFromUrl = isProjectPage ? pathname.split('/')[2] : null;
  
  // INITIALIZE workspace state based on current URL immediately!
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>(
    isProjectPage ? 'organization' : 'personal'
  );
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  // Initialize currentProject with URL-based info if on a project page
  const [currentProject, setCurrentProject] = useState<OrganizationProject | null>(() => {
    // Try to get cached project name immediately for instant display
    if (isProjectPage && projectIdFromUrl) {
      const cachedName = getStoredProjectName(projectIdFromUrl);
      if (cachedName) {
        return { id: projectIdFromUrl, name: cachedName };
      }
    }
    return null;
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!user?.uid) {
      setOrganizations([]); // Clear if no user
      return [];
    }
    try {
      const response = await fetch(`/api/organizations?userId=${user.uid}`);
      if (response.ok) {
        const orgs = await response.json();
        setOrganizations(orgs); // Ensure state is set here
        return orgs;
      } else {
        console.error("fetchOrganizations: Response not OK", response.status);
        setOrganizations([]); // Clear on error
        return [];
      }
    } catch (error) {
      console.error("Error fetching organizations in fetchOrganizations:", error);
      setOrganizations([]); // Clear on error
      return [];
    }
  }, [user]); // Depends on user

  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]); // Clear if no user
      return [];
    }
    try {
      // Fetch organizations from API with projects included
      const response = await fetch(`/api/organizations?userId=${user.uid}`);
      
      if (!response.ok) {
        console.error("refreshOrganizations: Response not OK", response.status);
        setOrganizations([]); // Clear on error
        throw new Error('Failed to fetch organizations');
      }
      
      const organizationsData = await response.json();
      
      setOrganizations(organizationsData);
      return organizationsData;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]); // Clear on error
      return [];
    }
  }, [user]); // Depends on user

  const loadProjectData = useCallback(async (projectId: string) => {
    // Prevent multiple simultaneous calls for the same project
    if (isLoadingProject || 
        (currentProject && currentProject.id === projectId) ||
        loadedProjectsRef.current.has(projectId)) {
      return;
    }
    
    loadedProjectsRef.current.add(projectId);
    setIsLoadingProject(true);
    try {
      // First try to get project directly from API
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        setCurrentProject(project);
        setCurrentOrganization(project.organization || null);
        // Cache the project name for instant future loads
        if (project.name) {
          storeProjectName(projectId, project.name);
        }
        return;
      }
      
      // Fallback to organization-based loading only if we don't have orgs yet
      let orgsToSearch = organizations;

      if (orgsToSearch.length === 0 && user) {
        const fetchedOrgs = await fetchOrganizations();
        if (fetchedOrgs && fetchedOrgs.length > 0) {
          orgsToSearch = fetchedOrgs;
        }
      }

      let foundProject = null;
      let foundOrg = null;
      
      for (const org of orgsToSearch) {
        if (org && org.projects) {
          foundProject = org.projects.find((p: OrganizationProject) => p.id === projectId);
          if (foundProject) {
            foundOrg = org;
            break;
          }
        }
      }

      if (foundProject && foundOrg) {
        setCurrentOrganization(foundOrg);
        setCurrentProject(foundProject);
        // Cache the project name for instant future loads
        if (foundProject.name) {
          storeProjectName(projectId, foundProject.name);
        }
      } else {
        // Don't set a project if we can't find the real one
        // This will keep the loading state until we get real data
        console.warn(`Project ${projectId} not found in organizations`);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
      // Don't set fallback project info with ID as name
      // Keep loading state instead
    } finally {
      setIsLoadingProject(false);
    }
  }, [user?.uid, organizations, currentProject, isLoadingProject, fetchOrganizations]); // Simplified dependencies

  // Effect for initial URL-based workspace and project loading
  useEffect(() => {
    // Only run if pathname actually changed
    if (lastPathnameRef.current === pathname) {
      return;
    }
    lastPathnameRef.current = pathname;
    
    if (isProjectPage && projectIdFromUrl) {
      setCurrentWorkspace('organization');
      
      // Check if we already have a cached name
      const cachedName = getStoredProjectName(projectIdFromUrl);
      if (cachedName && (!currentProject || currentProject.name !== cachedName)) {
        setCurrentProject({ id: projectIdFromUrl, name: cachedName });
      }
      
      // Always try to load fresh data in the background
      if (user && projectIdFromUrl && !loadedProjectsRef.current.has(projectIdFromUrl)) {
        loadProjectData(projectIdFromUrl);
      }
    } else {
      setCurrentWorkspace('personal');
      setCurrentOrganization(null);
      setCurrentProject(null);
      // Clear cache when leaving project pages
      loadedProjectsRef.current.clear();
    }
  }, [pathname, user, projectIdFromUrl, isProjectPage]); // Removed loadProjectData and isLoadingProject from deps

  // Effect for fetching organizations when user changes or on initial load
  useEffect(() => {
    if (user) {
      if (organizations.length === 0) { // Only fetch if not already populated
         fetchOrganizations();
      }
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setCurrentProject(null);
      setCurrentWorkspace('personal'); // Reset to personal if user logs out
    }
  }, [user?.uid]); // Only depend on user.uid, not fetchOrganizations

  // Simplified setWorkspace - temporarily made async for compatibility
  const setWorkspace = async (type: WorkspaceType, orgId?: string, projectId?: string) => {
    setCurrentWorkspace(type);

    if (type === 'personal') {
      setCurrentOrganization(null);
      setCurrentProject(null);
    } else if (type === 'organization' && orgId) {
      // Find organization and project from existing data
      const org = organizations.find(o => o.id === orgId);
      if (org) {
        setCurrentOrganization(org);
        const project = projectId 
          ? org.projects.find((p: OrganizationProject) => p.id === projectId) 
          : org.projects[0];
        setCurrentProject(project || null);
      }
    }
  };

  const getWorkspaceDisplayName = useCallback(() => {
    if (currentWorkspace === 'personal') {
      return 'Personal';
    }

    // If on an organization workspace (project page), ALWAYS show project name
    if (currentWorkspace === 'organization') {
      // If we have a current project with a real name, ALWAYS use it
      if (currentProject && currentProject.name) {
        return currentProject.name; 
      }
      
      // Only fallback to organization name if we're specifically on an org page (not project page)
      if (currentOrganization && !pathname.startsWith('/projects/')) {
        return currentOrganization.name;
      }
      
      // For project pages, show loading while we fetch the actual name
      if (pathname.startsWith('/projects/')) {
        return "Loading...";
      }
      
      // Final fallback 
      return "Loading..."; 
    }
    
    return 'Personal'; // Default fallback
  }, [currentWorkspace, currentProject, currentOrganization, pathname]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    currentOrganization,
    currentProject,
    organizations,
    setWorkspace,
    isPersonalWorkspace: currentWorkspace === 'personal',
    getWorkspaceDisplayName,
    refreshOrganizations,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
