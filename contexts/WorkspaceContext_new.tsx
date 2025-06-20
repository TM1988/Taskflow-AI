"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// Simple project name cache - key is projectId, value is project name
const PROJECT_CACHE_KEY = 'taskflow_project_names';

const getCachedProjectName = (projectId: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cache = JSON.parse(localStorage.getItem(PROJECT_CACHE_KEY) || '{}');
    return cache[projectId] || null;
  } catch {
    return null;
  }
};

const setCachedProjectName = (projectId: string, name: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const cache = JSON.parse(localStorage.getItem(PROJECT_CACHE_KEY) || '{}');
    cache[projectId] = name;
    localStorage.setItem(PROJECT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Extract project ID from URL
  const projectIdFromUrl = pathname.startsWith('/projects/') ? pathname.split('/')[2] : null;
  
  // State
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>('personal');
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentProject, setCurrentProject] = useState<OrganizationProject | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // SIMPLE DISPLAY NAME FUNCTION - prioritizes cache, then current project, then shows what we know
  const getWorkspaceDisplayName = useCallback(() => {
    if (currentWorkspace === 'personal') {
      return 'Personal';
    }

    // On project pages, try to show project name
    if (projectIdFromUrl) {
      // First try cached name for instant display
      const cachedName = getCachedProjectName(projectIdFromUrl);
      if (cachedName) {
        return cachedName;
      }
      
      // Then try current project state
      if (currentProject?.name) {
        return currentProject.name;
      }
      
      // Last resort - show loading only if we have no cached name
      return 'Loading...';
    }

    // For org pages, show org name
    if (currentOrganization?.name) {
      return currentOrganization.name;
    }

    return 'Loading...';
  }, [currentWorkspace, currentProject, currentOrganization, projectIdFromUrl]);

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
    if (!user?.uid) return [];
    try {
      const response = await fetch(`/api/organizations?userId=${user.uid}`);
      if (response.ok) {
        const orgs = await response.json();
        setOrganizations(orgs);
        return orgs;
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
    return [];
  }, [user?.uid]);

  const refreshOrganizations = useCallback(async () => {
    return await fetchOrganizations();
  }, [fetchOrganizations]);

  // Simple setWorkspace that respects cached names
  const setWorkspace = useCallback(async (type: WorkspaceType, orgId?: string, projectId?: string) => {
    setCurrentWorkspace(type);

    if (type === 'personal') {
      setCurrentOrganization(null);
      setCurrentProject(null);
    } else if (type === 'organization') {
      // If we have a project ID, try to use cached name first
      if (projectId) {
        const cachedName = getCachedProjectName(projectId);
        if (cachedName) {
          setCurrentProject({ id: projectId, name: cachedName });
        }
        
        // Load fresh data in background without overriding cached display
        try {
          const response = await fetch(`/api/projects/${projectId}`);
          if (response.ok) {
            const project = await response.json();
            if (project.name) {
              setCachedProjectName(projectId, project.name);
              setCurrentProject(project);
              setCurrentOrganization(project.organization || null);
            }
          }
        } catch (error) {
          console.error('Error loading project:', error);
        }
      }
      
      // Handle organization
      if (orgId && organizations.length > 0) {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
          setCurrentOrganization(org);
        }
      }
    }
  }, [organizations]);

  // Effect to handle URL changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setCurrentWorkspace('organization');
      
      // Always try to get cached name first for instant display
      const cachedName = getCachedProjectName(projectIdFromUrl);
      if (cachedName) {
        setCurrentProject({ id: projectIdFromUrl, name: cachedName });
      }
      
      // Load fresh data in background
      const loadProjectData = async () => {
        try {
          const response = await fetch(`/api/projects/${projectIdFromUrl}`);
          if (response.ok) {
            const project = await response.json();
            if (project.name) {
              setCachedProjectName(projectIdFromUrl, project.name);
              setCurrentProject(project);
              setCurrentOrganization(project.organization || null);
            }
          }
        } catch (error) {
          console.error('Error loading project:', error);
        }
      };
      
      loadProjectData();
    } else {
      setCurrentWorkspace('personal');
      setCurrentOrganization(null);
      setCurrentProject(null);
    }
  }, [projectIdFromUrl]);

  // Load organizations on mount
  useEffect(() => {
    if (user) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setCurrentProject(null);
      setCurrentWorkspace('personal');
    }
  }, [user, fetchOrganizations]);

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
