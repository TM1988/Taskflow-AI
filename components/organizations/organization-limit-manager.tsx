"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building, 
  Plus, 
  AlertTriangle,
  Info,
  Users,
  Crown,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";

interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberCount?: number;
  createdAt: string;
  isOwner?: boolean;
}

interface OrganizationLimitManagerProps {
  organizations: Organization[];
  onCreateOrganization: () => void;
  onRequestLimitIncrease: () => void;
}

const ORG_LIMIT_PER_USER = 2;

export default function OrganizationLimitManager({ 
  organizations, 
  onCreateOrganization,
  onRequestLimitIncrease 
}: OrganizationLimitManagerProps) {
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const orgCount = organizations.length;
  const isAtLimit = orgCount >= ORG_LIMIT_PER_USER;
  const canCreateMore = !isAtLimit;

  useEffect(() => {
    // Show warning when approaching limit
    if (orgCount >= ORG_LIMIT_PER_USER - 1) {
      setShowLimitWarning(true);
    }
  }, [orgCount]);

  const handleCreateOrganization = () => {
    if (isAtLimit) {
      toast({
        title: "Organization Limit Reached",
        description: `You can only create ${ORG_LIMIT_PER_USER} organizations. Contact support to increase your limit.`,
        variant: "destructive",
      });
      return;
    }
    onCreateOrganization();
  };

  const getStatusBadge = () => {
    if (isAtLimit) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Limit Reached
      </Badge>;
    } else if (orgCount >= ORG_LIMIT_PER_USER - 1) {
      return <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600">
        <AlertTriangle className="h-3 w-3" />
        Near Limit
      </Badge>;
    } else {
      return <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
        <CheckCircle className="h-3 w-3" />
        Available
      </Badge>;
    }
  };

  const usagePercentage = Math.round((orgCount / ORG_LIMIT_PER_USER) * 100);

  return (
    <div className="space-y-6">
      {/* Limit Warning */}
      {showLimitWarning && (
        <Alert className={`border-2 ${
          isAtLimit 
            ? 'border-red-200 bg-red-50' 
            : 'border-orange-200 bg-orange-50'
        }`}>
          <AlertTriangle className={`h-4 w-4 ${
            isAtLimit ? 'text-red-600' : 'text-orange-600'
          }`} />
          <AlertDescription className={
            isAtLimit ? 'text-red-800' : 'text-orange-800'
          }>
            {isAtLimit 
              ? `You've reached the maximum limit of ${ORG_LIMIT_PER_USER} organizations. Contact support to increase your limit.`
              : `You're approaching the limit of ${ORG_LIMIT_PER_USER} organizations. You can create ${ORG_LIMIT_PER_USER - orgCount} more.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Overview */}
      <Card className={`border-2 ${
        isAtLimit 
          ? 'border-red-200' 
          : orgCount >= ORG_LIMIT_PER_USER - 1 
            ? 'border-orange-200' 
            : 'border-green-200'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5" />
              Organization Usage
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Badge variant="outline">
                {orgCount} / {ORG_LIMIT_PER_USER}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Organizations Used</span>
              <span className="font-medium">{usagePercentage}%</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={`h-3 ${
                isAtLimit ? '[&>div]:bg-red-500' : 
                orgCount >= ORG_LIMIT_PER_USER - 1 ? '[&>div]:bg-orange-500' : ''
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleCreateOrganization}
              disabled={isAtLimit}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isAtLimit ? 'Limit Reached' : 'Create Organization'}
            </Button>
            
            {isAtLimit && (
              <Button 
                variant="outline"
                onClick={onRequestLimitIncrease}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Request Limit Increase
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      {organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations.map((org) => (
                <Card key={org.id} className="p-4 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{org.name}</h4>
                          {org.isOwner && (
                            <Crown className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        
                        {org.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {org.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{org.memberCount || 1} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      View Organization
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Suggestion */}
      {isAtLimit && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Need More Organizations?</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              You've reached your organization limit. Contact our support team to discuss increasing your limit based on your needs.
            </p>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRequestLimitIncrease}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Limit Increase
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Organizations State */}
      {organizations.length === 0 && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Create Your First Organization</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Organizations help you collaborate with teams, manage projects, and organize your work efficiently.
            </p>
            
            <Button onClick={handleCreateOrganization} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
            
            <Alert className="mt-4 max-w-md">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can create up to {ORG_LIMIT_PER_USER} organizations. Each organization can have multiple projects and team members.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
