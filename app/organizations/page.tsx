"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Settings,
  Crown,
  Calendar,
  Folder,
  UserPlus,
  Building,
  RefreshCw,
  Trash2,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CreateOrganizationModal from "@/components/organizations/create-organization-modal";

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

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [deletedOrganizations, setDeletedOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const ORG_LIMIT = 2;

  const fetchOrganizations = useCallback(async () => {
    if (!user?.uid) {
      console.log("No user found, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching organizations for user:", user.uid);
      
      const response = await fetch(`/api/organizations?userId=${user.uid}`);
      if (response.ok) {
        const orgs = await response.json();
        console.log("Fetched organizations:", orgs);
        setOrganizations(orgs);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch organizations");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user, fetchOrganizations]);

  const handleOrganizationCreated = (newOrg: any) => {
    console.log("Organization created, adding to list:", newOrg);
    setOrganizations(prev => [...prev, newOrg]);
    setCreateModalOpen(false);
    toast({
      title: "Success",
      description: `Organization "${newOrg.name}" created successfully`,
    });
  };

  const handleCreateOrganization = () => {
    if (organizations.length >= ORG_LIMIT) {
      toast({
        title: "Organization Limit Reached",
        description: `You can only create ${ORG_LIMIT} organizations.`,
        variant: "destructive",
      });
      return;
    }
    setCreateModalOpen(true);
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      setOrganizations(prev => prev.filter(o => o.id !== orgId));
      
      toast({
        title: "Organization Deleted",
        description: `${orgName} has been deleted successfully.`,
      });

      fetchOrganizations();
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  const fetchDeletedOrganizations = async () => {
    if (!user?.uid) return;

    try {
      setLoadingDeleted(true);
      const response = await fetch(`/api/organizations?userId=${user.uid}&deleted=true`);
      if (response.ok) {
        const deletedOrgs = await response.json();
        setDeletedOrganizations(deletedOrgs);
      } else {
        console.error("Failed to fetch deleted organizations");
        setDeletedOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching deleted organizations:", error);
      setDeletedOrganizations([]);
    } finally {
      setLoadingDeleted(false);
    }
  };

  const handleRecoverOrganization = async (orgId: string, orgName: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to recover organization');
      }

      // Remove from deleted list and refresh active organizations
      setDeletedOrganizations(prev => prev.filter(o => o.id !== orgId));
      await fetchOrganizations();
      
      toast({
        title: "Organization Recovered",
        description: `${orgName} has been restored successfully.`,
      });
    } catch (error) {
      console.error("Error recovering organization:", error);
      toast({
        title: "Error",
        description: "Failed to recover organization",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (orgId: string, orgName: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/permanent-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to permanently delete organization');
      }

      setDeletedOrganizations(prev => prev.filter(o => o.id !== orgId));
      
      toast({
        title: "Organization Permanently Deleted",
        description: `${orgName} has been permanently removed.`,
      });
    } catch (error) {
      console.error("Error permanently deleting organization:", error);
      toast({
        title: "Error",
        description: "Failed to permanently delete organization",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Organizations</h1>
            <p className="text-muted-foreground">
              Manage your teams and collaborate on projects
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchOrganizations}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleCreateOrganization}
            disabled={organizations.length >= ORG_LIMIT}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Active Organizations
          </TabsTrigger>
          <TabsTrigger value="deleted" className="flex items-center gap-2" onClick={fetchDeletedOrganizations}>
            <Trash2 className="h-4 w-4" />
            Recently Deleted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {organizations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {org.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{org.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={org.isOwner ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {org.isOwner && <Crown className="h-3 w-3 mr-1" />}
                          {org.userRole}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/organizations/${org.id}/settings`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {org.isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrganization(org.id, org.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {org.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{org.memberCount || 1} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span>{org.projects?.length || 0} projects</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Created {formatDate(org.createdAt)}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/organizations/${org.id}`)}
                  >
                    View Details
                  </Button>
                  {org.isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Coming Soon",
                          description: "Member invitation feature coming soon!",
                        });
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Organizations</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first organization to start collaborating with your team
            and managing projects together.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            You can create up to {ORG_LIMIT} organizations.
          </p>
          <Button onClick={handleCreateOrganization}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Organization
          </Button>
        </div>
      )}
      </TabsContent>

      <TabsContent value="deleted">
        {loadingDeleted ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : deletedOrganizations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deletedOrganizations.map((org) => (
              <Card key={org.id} className="p-6 border-dashed border-2 border-muted">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 opacity-60">
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                          {org.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg text-muted-foreground">{org.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          Deleted
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Deleted {new Date(org.deletedAt).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRecoverOrganization(org.id, org.name)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Recover
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDelete(org.id, org.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trash2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Deleted Organizations</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Organizations you delete will appear here for recovery within 24 hours.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>

      <CreateOrganizationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onOrganizationCreated={handleOrganizationCreated}
      />
    </div>
  );
}
