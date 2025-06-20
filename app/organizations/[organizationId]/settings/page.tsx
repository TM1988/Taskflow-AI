"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Shield,
  Users,
  Settings,
  Edit,
  Crown,
  Lock,
  FolderPlus,
  Database,
  AlertTriangle,
  Cloud,
  Server
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import SupportSection from "@/components/support/support-section";
import StorageTab from "@/components/organizations/storage-tab";

interface OrganizationSettingsPageProps {
  params: {
    organizationId: string;
  };
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  memberCount?: number;
}

const DEFAULT_PERMISSIONS: Permission[] = [
  // Project Management
  {
    id: "projects.create",
    name: "Create Projects",
    description: "Can create new projects",
    category: "Projects",
  },
  {
    id: "projects.edit",
    name: "Edit Projects",
    description: "Can edit project details",
    category: "Projects",
  },
  {
    id: "projects.delete",
    name: "Delete Projects",
    description: "Can delete projects",
    category: "Projects",
  },
  {
    id: "projects.view",
    name: "View Projects",
    description: "Can view all projects",
    category: "Projects",
  },

  // Member Management
  {
    id: "members.invite",
    name: "Invite Members",
    description: "Can send invitations to new members",
    category: "Members",
  },
  {
    id: "members.remove",
    name: "Remove Members",
    description: "Can remove members from organization",
    category: "Members",
  },
  {
    id: "members.roles",
    name: "Manage Roles",
    description: "Can change member roles",
    category: "Members",
  },

  // Organization Management
  {
    id: "org.settings",
    name: "Organization Settings",
    description: "Can access organization settings",
    category: "Organization",
  },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: "owner",
    name: "Owner",
    description: "Full access to everything",
    permissions: DEFAULT_PERMISSIONS.map((p) => p.id),
    isDefault: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Can manage projects and members",
    permissions: [
      "projects.create",
      "projects.edit",
      "projects.view",
      "members.invite",
      "members.roles",
    ],
    isDefault: true,
  },
  {
    id: "member",
    name: "Member",
    description: "Basic project access",
    permissions: ["projects.view"],
    isDefault: true,
  },
];

export default function OrganizationSettingsPage({
  params,
}: OrganizationSettingsPageProps) {
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: "",
  });
  
  // SMTP Configuration state
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    useTLS: true,
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  
  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState({
    welcome: "",
    taskNotification: "",
    dueReminder: "",
  });
  const [templatesSaving, setTemplatesSaving] = useState(false);
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssignments: true,
    dueReminders: true,
    projectUpdates: false,
    weeklyDigest: false,
  });
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  // Storage settings state
  const [storageSaving, setStorageSaving] = useState(false);
  const [showStorageWarning, setShowStorageWarning] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshOrganizations } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the tab from URL parameters, default to "general"
  const defaultTab = searchParams.get("tab") || "general";

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${params.organizationId}`);
        if (response.ok) {
          const org = await response.json();
          setOrganization(org);
          setFormData({
            description: org.description || "",
          });
          
          // Calculate member counts for each role
          const roleCounts: Record<string, number> = {};
          
          // Count owner
          roleCounts['owner'] = 1; // Always 1 owner
          
          // Count members by their roles
          if (org.members && org.memberRoles) {
            org.members.forEach((memberId: string) => {
              if (memberId !== org.ownerId) { // Skip owner, already counted
                const role = org.memberRoles[memberId] || 'member';
                roleCounts[role] = (roleCounts[role] || 0) + 1;
              }
            });
          }
          
          // Update roles with member counts
          const rolesWithCounts = DEFAULT_ROLES.map(role => ({
            ...role,
            memberCount: roleCounts[role.id] || 0
          }));
          
          // Add custom roles with counts
          if (org.customRoles) {
            const customRolesWithCounts = org.customRoles.map((role: any) => ({
              ...role,
              memberCount: roleCounts[role.id] || 0
            }));
            setRoles([...rolesWithCounts, ...customRolesWithCounts]);
          } else {
            setRoles(rolesWithCounts);
          }
        } else {
          throw new Error("Organization not found");
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        toast({
          title: "Error",
          description: "Failed to load organization details",
          variant: "destructive",
        });
        router.push("/organizations");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [params.organizationId, router, toast]);

  // Load SMTP configuration
  useEffect(() => {
    const fetchSmtpConfig = async () => {
      try {
        const response = await fetch(`/api/organizations/${params.organizationId}/smtp-config`);
        if (response.ok) {
          const data = await response.json();
          setSmtpConfig(prev => ({
            ...prev,
            ...data.smtpConfig
          }));
        }
      } catch (error) {
        console.error("Error fetching SMTP config:", error);
      }
    };

    fetchSmtpConfig();
  }, [params.organizationId]);

  // Initialize test email address with user's email
  useEffect(() => {
    if (user?.email && !testEmailAddress) {
      setTestEmailAddress(user.email);
    }
  }, [user?.email, testEmailAddress]);

  // Load email templates
  useEffect(() => {
    const fetchEmailTemplates = async () => {
      try {
        const response = await fetch(`/api/organizations/${params.organizationId}/email-templates`);
        if (response.ok) {
          const data = await response.json();
          setEmailTemplates(prev => ({
            ...prev,
            ...data.emailTemplates
          }));
        }
      } catch (error) {
        console.error("Error fetching email templates:", error);
      }
    };

    fetchEmailTemplates();
  }, [params.organizationId]);

  // Load notification settings
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const response = await fetch(`/api/organizations/${params.organizationId}/notification-settings`);
        if (response.ok) {
          const data = await response.json();
          setNotificationSettings(prev => ({
            ...prev,
            ...data.notificationSettings
          }));
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      }
    };

    fetchNotificationSettings();
  }, [params.organizationId]);

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);

      const response = await fetch(
        `/api/organizations/${params.organizationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: formData.description,
          }),
        }
      );

      if (response.ok) {
        const updatedOrg = await response.json();
        setOrganization(updatedOrg);
        
        // Refresh organizations in context to update everywhere
        await refreshOrganizations();
        
        toast({
          title: "Success",
          description: "Organization updated successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update organization");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update organization",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRole = async (roleData: Partial<Role>) => {
    try {
      if (!roleData.name || !roleData.description) {
        toast({
          title: "Error",
          description: "Role name and description are required",
          variant: "destructive",
        });
        return;
      }

      if (editingRole && editingRole.isDefault && editingRole.id !== 'owner') {
        // Update default role (member or admin)
        const response = await fetch(
          `/api/organizations/${params.organizationId}/default-roles`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              roleId: editingRole.id,
              ...roleData 
            }),
          }
        );

        if (response.ok) {
          // Update the local roles state
          const updatedRoles = roles.map(r => 
            r.id === editingRole.id 
              ? { ...r, ...roleData }
              : r
          );
          setRoles(updatedRoles);
          toast({ title: "Success", description: "Default role updated successfully" });
        }
      } else if (editingRole && !editingRole.isDefault) {
        // Update existing custom role
        const customRoles = roles.filter((r) => !r.isDefault);
        const updatedCustomRoles = customRoles.map((r) =>
          r.id === editingRole.id ? { ...r, ...roleData } : r
        );

        const response = await fetch(
          `/api/organizations/${params.organizationId}/roles`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customRoles: updatedCustomRoles }),
          }
        );

        if (response.ok) {
          setRoles([...DEFAULT_ROLES, ...updatedCustomRoles]);
          toast({ title: "Success", description: "Role updated successfully" });
        }
      } else {
        // Create new role
        const customRoles = roles.filter((r) => !r.isDefault);
        const newRole: Role = {
          id: `custom_${Date.now()}`,
          name: roleData.name!,
          description: roleData.description!,
          permissions: roleData.permissions || [],
          isDefault: false,
        };

        const updatedCustomRoles = [...customRoles, newRole];

        const response = await fetch(
          `/api/organizations/${params.organizationId}/roles`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customRoles: updatedCustomRoles }),
          }
        );

        if (response.ok) {
          setRoles([...DEFAULT_ROLES, ...updatedCustomRoles]);
          toast({ title: "Success", description: "Role created successfully" });
        }
      }

      setRoleModalOpen(false);
      setEditingRole(null);
    } catch (error) {
      console.error("Error saving role:", error);
      toast({
        title: "Error",
        description: "Failed to save role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const roleToDelete = roles.find(r => r.id === roleId);
      
      if (!roleToDelete) {
        toast({
          title: "Error",
          description: "Role not found",
          variant: "destructive",
        });
        return;
      }

      // Check if trying to delete the Owner role
      if (roleId === 'owner') {
        toast({
          title: "Error",
          description: "Cannot delete the Owner role",
          variant: "destructive",
        });
        return;
      }

      // Delete the role (both default and custom roles should be deleted)
      const response = await fetch(
        `/api/organizations/${params.organizationId}/roles/${roleId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        // Remove the role from the local state
        const updatedRoles = roles.filter(r => r.id !== roleId);
        setRoles(updatedRoles);
        
        toast({ 
          title: "Success", 
          description: `Role "${roleToDelete.name}" has been deleted successfully` 
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive",
      });
    }
    setDeleteRoleConfirm(null);
  };

  const handleDeleteOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      await refreshOrganizations();
      
      toast({
        title: "Organization Deleted",
        description: `${organization?.name} has been deleted successfully.`,
      });

      // Redirect to organizations page
      router.push('/organizations');
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // SMTP Configuration functions
  const handleSaveSmtpConfig = async () => {
    setSmtpSaving(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/smtp-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "SMTP configuration saved successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save SMTP configuration");
      }
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save SMTP configuration",
        variant: "destructive",
      });
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast({
        title: "Error",
        description: "Please enter an email address to send the test email to",
        variant: "destructive",
      });
      return;
    }

    setSmtpTesting(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/smtp-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...smtpConfig, testEmailAddress }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: data.message || `Test email sent successfully to ${testEmailAddress}`,
        });
      } else {
        throw new Error(data.error || "Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleSaveEmailTemplates = async () => {
    setTemplatesSaving(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/email-templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailTemplates),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email templates saved successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save email templates");
      }
    } catch (error) {
      console.error("Error saving email templates:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save email templates",
        variant: "destructive",
      });
    } finally {
      setTemplatesSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setNotificationsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/notification-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationSettings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification settings saved successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save notification settings");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleToggleStorage = async () => {
    if (!isOwner) return;

    // If switching from self-hosted to official, show warning
    if (organization.settings?.useSelfHosting) {
      setShowStorageWarning(true);
      return;
    }

    // If switching from official to self-hosted, proceed directly
    await updateStorageSettings(true);
  };

  const updateStorageSettings = async (useSelfHosting: boolean) => {
    setStorageSaving(true);
    try {
      const response = await fetch(`/api/organizations/${params.organizationId}/storage-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useSelfHosting }),
      });

      if (response.ok) {
        const updatedOrg = await response.json();
        setOrganization(updatedOrg);
        setShowStorageWarning(false);
        
        // Refresh organizations in context to update everywhere
        await refreshOrganizations();
        
        toast({
          title: "Success",
          description: useSelfHosting 
            ? "Organization data will now be stored in your custom database"
            : "Organization data will now be stored in the official database",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update storage settings");
      }
    } catch (error) {
      console.error("Error updating storage settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update storage settings",
        variant: "destructive",
      });
    } finally {
      setStorageSaving(false);
    }
  };

  const formatDate = (dateValue: any) => {
    try {
      if (!dateValue) return "Unknown date";
      
      // Handle Firebase Timestamp objects
      if (dateValue && typeof dateValue.toDate === "function") {
        return dateValue.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
      
      // Handle ISO strings and regular dates
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Unknown date";
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short", 
        day: "numeric"
      });
    } catch {
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  const isOwner = organization.ownerId === user?.uid;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/organizations/${params.organizationId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">{organization.name}</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="email">Email & Notifications</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Organization details and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="name"
                    value={organization.name}
                    disabled
                    className="bg-muted"
                  />
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Immutable
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Organization names cannot be changed after creation for security
                  reasons.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={!isOwner}
                  rows={3}
                  placeholder="Describe your organization..."
                />
              </div>

              {isOwner && (
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveGeneral} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <StorageTab 
            organizationId={params.organizationId}
            organization={organization}
            isOwner={isOwner}
            onStorageUpdated={() => {
              // Refresh organization data
              const fetchOrganization = async () => {
                try {
                  const response = await fetch(`/api/organizations/${params.organizationId}`);
                  if (response.ok) {
                    const org = await response.json();
                    setOrganization(org);
                  }
                } catch (error) {
                  console.error("Error refreshing organization:", error);
                }
              };
              fetchOrganization();
              refreshOrganizations();
            }}
          />
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>
                    Manage custom roles and their permissions
                  </CardDescription>
                </div>
                {isOwner && (
                  <Button onClick={() => {
                    setEditingRole(null);
                    setRoleModalOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {role.id === 'owner' && <Crown className="h-4 w-4 text-amber-500" />}
                          {role.isDefault && role.id !== 'owner' && <Shield className="h-4 w-4 text-blue-500" />}
                          <span className="font-medium">{role.name}</span>
                          {role.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {role.permissions.length} permissions
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {role.memberCount || 0} {role.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Always show view details for all roles */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Show role details in a read-only modal for Owner role only
                              if (role.id === 'owner') {
                                setEditingRole({ ...role, isReadonly: true } as Role & { isReadonly?: boolean });
                              } else {
                                setEditingRole(role);
                              }
                              setRoleModalOpen(true);
                            }}
                          >
                            {role.id === 'owner' ? 'View Details' : 'Edit'}
                          </Button>
                          
                          {/* Delete for all roles except Owner, only for owners */}
                          {role.id !== 'owner' && isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteRoleConfirm(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <div className="space-y-6">
            {/* SMTP Configuration - Owner Only */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    SMTP Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure email server settings for this organization (Owner only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        placeholder="smtp.example.com"
                        value={smtpConfig.host}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        placeholder="587"
                        value={smtpConfig.port}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">Username</Label>
                      <Input
                        id="smtp-username"
                        placeholder="username@example.com"
                        value={smtpConfig.username}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">Password</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        placeholder="••••••••"
                        value={smtpConfig.password}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="smtp-tls" 
                      checked={smtpConfig.useTLS}
                      onCheckedChange={(checked) => setSmtpConfig({ ...smtpConfig, useTLS: !!checked })}
                    />
                    <Label htmlFor="smtp-tls">Use TLS encryption</Label>
                  </div>
                  
                  {/* Test Email Section */}
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-email">Test Email Address</Label>
                      <Input
                        id="test-email"
                        type="email"
                        placeholder="test@example.com"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter the email address where you want to receive the test email
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSendTestEmail}
                      disabled={smtpTesting || !smtpConfig.host || !smtpConfig.username || !testEmailAddress}
                    >
                      {smtpTesting ? "Sending..." : "Send Test Email"}
                    </Button>
                    <Button 
                      onClick={handleSaveSmtpConfig}
                      disabled={smtpSaving || !smtpConfig.host || !smtpConfig.username}
                    >
                      {smtpSaving ? "Saving..." : "Save SMTP Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Email Templates - Role-based access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Customize email templates for organization notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-template">Welcome Email Template</Label>
                    <Textarea
                      id="welcome-template"
                      placeholder="Welcome to {organization_name}! We're excited to have you on board..."
                      rows={4}
                      value={emailTemplates.welcome}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, welcome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-template">Task Notification Template</Label>
                    <Textarea
                      id="notification-template"
                      placeholder="You have been assigned a new task: {task_title}..."
                      rows={4}
                      value={emailTemplates.taskNotification}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, taskNotification: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder-template">Due Date Reminder Template</Label>
                    <Textarea
                      id="reminder-template"
                      placeholder="Reminder: Your task {task_title} is due on {due_date}..."
                      rows={4}
                      value={emailTemplates.dueReminder}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, dueReminder: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveEmailTemplates}
                    disabled={templatesSaving}
                  >
                    {templatesSaving ? "Saving..." : "Save Templates"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure when organization members receive email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Task Assignments</Label>
                      <p className="text-sm text-muted-foreground">
                        Send emails when members are assigned tasks
                      </p>
                    </div>
                    <Checkbox 
                      checked={notificationSettings.taskAssignments}
                      onCheckedChange={(checked) => setNotificationSettings({ 
                        ...notificationSettings, 
                        taskAssignments: !!checked 
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Due Date Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminder emails 24 hours before task due dates
                      </p>
                    </div>
                    <Checkbox 
                      checked={notificationSettings.dueReminders}
                      onCheckedChange={(checked) => setNotificationSettings({ 
                        ...notificationSettings, 
                        dueReminders: !!checked 
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Project Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Send emails when projects are created or updated
                      </p>
                    </div>
                    <Checkbox 
                      checked={notificationSettings.projectUpdates}
                      onCheckedChange={(checked) => setNotificationSettings({ 
                        ...notificationSettings, 
                        projectUpdates: !!checked 
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Send weekly summary emails to all members
                      </p>
                    </div>
                    <Checkbox 
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={(checked) => setNotificationSettings({ 
                        ...notificationSettings, 
                        weeklyDigest: !!checked 
                      })}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotificationSettings}
                    disabled={notificationsSaving}
                  >
                    {notificationsSaving ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support & Help</CardTitle>
              <CardDescription>
                Get help with organization management and contact support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupportSection 
                userId={user?.uid || ''} 
                userEmail={user?.email || ''} 
                organizationId={params.organizationId}
                organizationName={organization?.name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isOwner && (
                <div className="space-y-4">
                  <div className="p-4 border border-destructive rounded-lg">
                    <h3 className="font-medium text-destructive mb-2">Delete Organization</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will delete the organization and move it to recently deleted where it can be recovered for a limited time. All projects and data will be preserved but inaccessible until restored.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Organization
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Creation/Edit Modal */}
      <RoleModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        role={editingRole}
        permissions={DEFAULT_PERMISSIONS}
        onSave={handleSaveRole}
      />

      {/* Delete Role Confirmation */}
      <ConfirmationDialog
        open={!!deleteRoleConfirm}
        onOpenChange={() => setDeleteRoleConfirm(null)}
        title="Delete Role"
        description="Are you sure you want to delete this role? Members with this role will lose their permissions associated with this role."
        confirmText="Delete Role"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deleteRoleConfirm) {
            handleDeleteRole(deleteRoleConfirm);
          }
        }}
      />

      {/* Delete Organization Confirmation */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Organization"
        description={`Are you sure you want to delete "${organization?.name}"? This will move the organization to recently deleted where it can be recovered for a limited time. All projects and data will be preserved but inaccessible until restored.`}
        onConfirm={handleDeleteOrganization}
        confirmText="Delete Organization"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Storage Warning Dialog */}
      <Dialog open={showStorageWarning} onOpenChange={setShowStorageWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Warning: Data Loss
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>
                Switching from self-hosted to official database will result in 
                <strong className="text-destructive"> permanent loss</strong> of all data 
                stored in your custom database for this organization, including:
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>All projects in this organization</li>
                <li>All tasks in those projects</li>
                <li>Project configurations and settings</li>
                <li>Historical data and activity logs</li>
              </ul>
              <p className="font-medium">
                This action cannot be undone. Are you absolutely sure?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2">
            <Button
              variant="destructive"
              onClick={() => updateStorageSettings(false)}
              disabled={storageSaving}
              className="w-full"
            >
              {storageSaving ? "Switching..." : "Yes, Switch to Official Database"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowStorageWarning(false)}
              disabled={storageSaving}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Role Modal Component
function RoleModal({ 
  open, 
  onOpenChange, 
  role, 
  permissions, 
  onSave 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: (Role & { isReadonly?: boolean }) | null;
  permissions: Permission[];
  onSave: (role: Partial<Role>) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const isReadonly = role?.id === 'owner'; // Only Owner role should be readonly

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        permissions: [],
      });
    }
  }, [role, open]);

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleSelectAllCategory = (categoryPermissions: Permission[], isSelectAll: boolean) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    setFormData((prev) => ({
      ...prev,
      permissions: isSelectAll
        ? Array.from(new Set([...prev.permissions, ...categoryPermissionIds]))
        : prev.permissions.filter(p => !categoryPermissionIds.includes(p))
    }));
  };

  const isCategoryFullySelected = (categoryPermissions: Permission[]) => {
    return categoryPermissions.every(p => formData.permissions.includes(p.id));
  };

  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Modify the role details and permissions"
              : "Create a custom role with specific permissions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter role name"
                disabled={isReadonly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter role description"
                disabled={isReadonly}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`select-all-${category}`}
                    checked={isCategoryFullySelected(categoryPermissions)}
                    onCheckedChange={(checked) => !isReadonly && handleSelectAllCategory(categoryPermissions, !!checked)}
                    disabled={isReadonly}
                  />
                  <h4 className="font-medium text-sm">{category} - Select All</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 ml-6">
                  {categoryPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() => !isReadonly && handlePermissionToggle(permission.id)}
                        disabled={isReadonly}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isReadonly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadonly && (
            <Button onClick={() => onSave(formData)}>
              {role && !role.isReadonly ? 'Update Role' : 'Create Role'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
