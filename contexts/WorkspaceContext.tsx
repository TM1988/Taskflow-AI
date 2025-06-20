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

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Automatically detect workspace type from URL
  const isProjectPage = pathname.startsWith('/projects/');
  const projectIdFromUrl = isProjectPage ? pathname.split('/')[2] : null;
  
  // INITIALIZE workspace state based on current URL immediately!
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>(
    isProjectPage ? 'organization' : 'personal'
  );
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  // Initialize currentProject with placeholder if on a project page
  const [currentProject, setCurrentProject] = useState<OrganizationProject | null>(
    isProjectPage && projectIdFromUrl 
      ? { id: projectIdFromUrl, name: "Loading project..." } 
      : null
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const fetchOrganizations = useCallback(async () => {
    if (!user?.uid) {
      console.log("fetchOrganizations: No user UID, returning empty array.");
      setOrganizations([]); // Clear if no user
      return [];
    }
    console.log("fetchOrganizations: Called for user:", user.uid);
    try {
      const response = await fetch(`/api/organizations?userId=${user.uid}`);
      if (response.ok) {
        const orgs = await response.json();
        console.log("Fetched organizations successfully in fetchOrganizations:", orgs);
        setOrganizations(orgs); // Ensure state is set here
        return orgs;
      } else {
        console.error("fetchOrganizations: Response not OK", response.status, await response.text());
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
      console.log("refreshOrganizations: No user, returning empty array.");
      setOrganizations([]); // Clear if no user
      return [];
    }
    console.log("refreshOrganizations: Called by user:", user.uid);
    try {
      // Fetch organizations from API with projects included
      const response = await fetch(`/api/organizations?userId=${user.uid}`);
      
      if (!response.ok) {
        console.error("refreshOrganizations: Response not OK", response.status, await response.text());
        setOrganizations([]); // Clear on error
        throw new Error('Failed to fetch organizations');
      }
      
      const organizationsData = await response.json();
      console.log('Refreshed organizations with projects:', organizationsData);
      
      setOrganizations(organizationsData);
      return organizationsData;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]); // Clear on error
      return [];
    }
  }, [user]); // Depends on user

  const loadProjectData = useCallback(async (projectId: string) => {
    console.log(`loadProjectData called for projectId: ${projectId}. Current organizations count: ${organizations.length}`);
    try {
      let orgsToSearch = organizations;

      if (orgsToSearch.length === 0 && user) { // Ensure user exists before fetching
        console.log("Organizations list is empty, attempting to fetch them now within loadProjectData.");
        const fetchedOrgs = await fetchOrganizations();
        if (fetchedOrgs && fetchedOrgs.length > 0) {
          console.log("Successfully fetched organizations within loadProjectData:", fetchedOrgs);
          orgsToSearch = fetchedOrgs;
        } else {
          console.log("Failed to fetch organizations or no organizations found within loadProjectData. Trying refresh.");
          // Try refresh as a fallback
          const refreshedOrgs = await refreshOrganizations();
          if (refreshedOrgs && refreshedOrgs.length > 0) {
             orgsToSearch = refreshedOrgs;
          } else {
            console.error('Still no organizations after fetch/refresh in loadProjectData.');
            return; 
          }
        }
      }

      let foundProject = null;
      let foundOrg = null;
      
      console.log("Searching for project in orgsToSearch:", orgsToSearch);
      for (const org of orgsToSearch) {
        if (org && org.projects) {
          foundProject = org.projects.find((p: OrganizationProject) => p.id === projectId);
          if (foundProject) {
            foundOrg = org;
            break;
          }
        } else {
          console.warn("Encountered an undefined org or org without projects array:", org);
        }
      }

      if (!foundProject && user && organizations.length > 0 && orgsToSearch === organizations) {
        console.log("Project not found in existing (potentially stale) organizations, refreshing and trying again.");
        const freshOrgs = await refreshOrganizations();
        for (const org of freshOrgs) {
           if (org && org.projects) {
            foundProject = org.projects.find((p: OrganizationProject) => p.id === projectId);
            if (foundProject) {
              foundOrg = org;
              break;
            }
          }
        }
      }

      if (foundProject && foundOrg) {
        console.log("Project and Org found:", foundProject, foundOrg);
        setCurrentOrganization(foundOrg);
        setCurrentProject(foundProject);
      } else {
        console.log(`Project with ID ${projectId} not found after all attempts.`);
        // Potentially set currentProject to an error state or null if not found
        // setCurrentProject({ id: projectId, name: "Project not found" }); 
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  }, [user, organizations, fetchOrganizations, refreshOrganizations]);

  // Effect for initial URL-based workspace and project loading
  useEffect(() => {
    console.log("Workspace context update - pathname:", pathname, "isProjectPage:", isProjectPage, "projectIdFromUrl:", projectIdFromUrl, "currentProject:", currentProject, "user:", user);
    
    if (isProjectPage && projectIdFromUrl) {
      setCurrentWorkspace('organization');
      if (user && projectIdFromUrl && (!currentProject || currentProject.id !== projectIdFromUrl || currentProject.name === "Loading project...")) {
        console.log("Calling loadProjectData for:", projectIdFromUrl);
        loadProjectData(projectIdFromUrl);
      }
    } else {
      setCurrentWorkspace('personal');
      setCurrentOrganization(null);
      setCurrentProject(null);
    }
  }, [pathname, user, loadProjectData, isProjectPage, projectIdFromUrl, currentProject]);

  // Effect for fetching organizations when user changes or on initial load
  useEffect(() => {
    if (user) {
      console.log("User detected, fetching organizations. Current organizations count:", organizations.length);
      if (organizations.length === 0) { // Only fetch if not already populated
         fetchOrganizations();
      }
    } else {
      console.log("User is null, clearing organizations and workspace details.");
      setOrganizations([]);
      setCurrentOrganization(null);
      setCurrentProject(null);
      setCurrentWorkspace('personal'); // Reset to personal if user logs out
    }
  }, [user, fetchOrganizations]);

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

  const getWorkspaceDisplayName = () => {
    console.log("getWorkspaceDisplayName called - currentWorkspace:", currentWorkspace, "org:", currentOrganization?.name, "project:", currentProject?.name);
    
    if (currentWorkspace === 'personal') {
      return 'Personal';
    }

    // If on an organization workspace (project page)
    if (currentWorkspace === 'organization') {
      if (currentProject) {
        // This will return "Loading project..." initially if that's the name, 
        // or the actual project name once loaded.
        return currentProject.name; 
      }
      // If project is null but org is loaded (e.g. navigating to an org page without a specific project selected yet)
      if (currentOrganization) {
        return currentOrganization.name;
      }
      // Fallback if project and org are not yet loaded, but we know it's an org workspace.
      // This state implies currentProject should have been initialized with a placeholder.
      // If for some reason currentProject is null here on an org page, show a generic loading.
      return "Loading..."; 
    }
    
    return 'Personal'; // Default fallback
  };

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
