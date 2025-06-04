"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  setWorkspace: (type: WorkspaceType, orgId?: string, projectId?: string) => void;
  isPersonalWorkspace: boolean;
  getWorkspaceDisplayName: () => string;
  refreshOrganizations: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>('personal');
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentProject, setCurrentProject] = useState<OrganizationProject | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Load workspace preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWorkspace = localStorage.getItem('workspace-context');
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          setCurrentWorkspace(parsed.type || 'personal');
        } catch (error) {
          console.error('Error parsing saved workspace:', error);
        }
      }
    }
  }, []);

  // Fetch organizations when user changes
  useEffect(() => {
    if (user) {
      refreshOrganizations();
    } else {
      setOrganizations([]);
      setCurrentWorkspace('personal');
      setCurrentOrganization(null);
      setCurrentProject(null);
    }
  }, [user]);

  const refreshOrganizations = async () => {
    if (!user) return;

    try {
      // For now, using mock data - replace with actual API call
      const mockOrganizations: Organization[] = [
        {
          id: "org1",
          name: "Acme Corp",
          role: "Admin",
          projects: [
            { id: "proj1", name: "E-commerce Platform", description: "Main platform" },
            { id: "proj2", name: "Mobile App", description: "iOS/Android app" }
          ]
        },
        {
          id: "org2",
          name: "Tech Startup",
          role: "Member",
          projects: [
            { id: "proj3", name: "AI Dashboard", description: "Analytics platform" }
          ]
        }
      ];

      setOrganizations(mockOrganizations);

      // Restore organization context if needed
      const savedWorkspace = localStorage.getItem('workspace-context');
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          if (parsed.type === 'organization' && parsed.orgId) {
            const org = mockOrganizations.find(o => o.id === parsed.orgId);
            if (org) {
              setCurrentOrganization(org);
              if (parsed.projectId) {
                const project = org.projects.find(p => p.id === parsed.projectId);
                setCurrentProject(project || org.projects[0] || null);
              } else {
                setCurrentProject(org.projects[0] || null);
              }
            }
          }
        } catch (error) {
          console.error('Error restoring workspace context:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const setWorkspace = (type: WorkspaceType, orgId?: string, projectId?: string) => {
    setCurrentWorkspace(type);

    if (type === 'personal') {
      setCurrentOrganization(null);
      setCurrentProject(null);
      localStorage.setItem('workspace-context', JSON.stringify({ type: 'personal' }));
    } else if (type === 'organization' && orgId) {
      const org = organizations.find(o => o.id === orgId);
      if (org) {
        setCurrentOrganization(org);
        
        // Set project (use provided projectId or first available project)
        const project = projectId 
          ? org.projects.find(p => p.id === projectId) 
          : org.projects[0];
        setCurrentProject(project || null);

        localStorage.setItem('workspace-context', JSON.stringify({
          type: 'organization',
          orgId,
          projectId: project?.id
        }));
      }
    }
  };

  const getWorkspaceDisplayName = () => {
    if (currentWorkspace === 'personal') {
      return 'Personal';
    }
    if (currentOrganization && currentProject) {
      return `${currentOrganization.name} / ${currentProject.name}`;
    }
    if (currentOrganization) {
      return currentOrganization.name;
    }
    return 'Personal';
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
