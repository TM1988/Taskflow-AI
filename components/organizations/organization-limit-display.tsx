"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Plus, 
  Users, 
  FolderOpen, 
  Crown,
  AlertTriangle,
  Info
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description?: string;
  isOwner: boolean;
  userRole: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

interface OrganizationLimitDisplayProps {
  organizations: Organization[];
  userOrganizationCount: number;
  onCreateOrganization: () => void;
  loading?: boolean;
}

export default function OrganizationLimitDisplay({ 
  organizations, 
  userOrganizationCount,
  onCreateOrganization,
  loading = false 
}: OrganizationLimitDisplayProps) {
  // No limits on organizations
  const canCreateOrganization = true;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
            <Badge variant="default">
              {userOrganizationCount} organizations
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Create and manage unlimited organizations
              </p>
            </div>
            
            <Button 
              onClick={onCreateOrganization}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      {organizations.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Organizations</h3>
          
          <div className="grid gap-4">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{org.name}</h4>
                          <Badge variant={org.isOwner ? "default" : "outline"} className="text-xs">
                            {org.isOwner && <Crown className="h-3 w-3 mr-1" />}
                            {org.userRole}
                          </Badge>
                        </div>
                        
                        {org.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {org.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{org.memberCount} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            <span>{org.projectCount} projects</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* No Organizations State */
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Organizations help you collaborate with teams and manage multiple projects together. 
              Create your first organization to get started.
            </p>
            
            <div className="space-y-4 w-full max-w-sm">
              <Button 
                onClick={onCreateOrganization}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Organization
              </Button>
              
              <div className="text-center">
                <Separator className="my-4" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Create unlimited organizations</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Separator for Personal Workspace */}
      {organizations.length > 0 && (
        <div className="relative">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background px-3 text-sm text-muted-foreground">
              Personal Workspace
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
