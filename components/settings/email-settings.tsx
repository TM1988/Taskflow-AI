"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailNotificationSettings } from "@/types/email-notifications";

interface EmailSettingsProps {
  userId: string;
}

export default function EmailSettings({ userId }: EmailSettingsProps) {
  const [settings, setSettings] = useState<EmailNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/email-settings`);
      if (response.ok) {
        const userSettings = await response.json();
        setSettings(userSettings);
      } else {
        throw new Error('Failed to fetch email settings');
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
      toast({
        title: "Error",
        description: "Failed to load email settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof EmailNotificationSettings, value: any) => {
    if (!settings) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/users/${userId}/email-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        toast({
          title: "Settings Updated",
          description: "Your email notification preferences have been saved",
        });
      } else {
        throw new Error('Failed to update email settings');
      }
    } catch (error) {
      console.error("Error updating email settings:", error);
      toast({
        title: "Error",
        description: "Failed to update email settings",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateOrganizationInviteSetting = async (key: 'enabled' | 'emailEnabled', value: boolean) => {
    if (!settings) return;

    const newOrgSettings = {
      ...settings.organizationInvites,
      [key]: value
    };

    await updateSetting('organizationInvites', newOrgSettings);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure when you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Email Notifications</CardTitle>
        </div>
        <CardDescription>
          Configure when you receive email notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Policy Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Email Policy:</strong> TaskFlow only sends emails for organization invitations. 
            All other notifications (tasks, projects, deadlines, etc.) are delivered in-app only 
            to reduce email clutter and keep you focused.
          </AlertDescription>
        </Alert>

        {/* Organization Invitations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="org-invite-enabled" className="text-base font-medium">
                Organization Invitations
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications when you're invited to join organizations
              </p>
            </div>
            <Switch
              id="org-invite-enabled"
              checked={settings.organizationInvites.enabled}
              onCheckedChange={(value) => updateOrganizationInviteSetting('enabled', value)}
              disabled={updating}
            />
          </div>

          {settings.organizationInvites.enabled && (
            <div className="ml-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="org-invite-email" className="text-sm font-medium">
                  Email Delivery
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send organization invitations to your email address
                </p>
              </div>
              <Switch
                id="org-invite-email"
                checked={settings.organizationInvites.emailEnabled}
                onCheckedChange={(value) => updateOrganizationInviteSetting('emailEnabled', value)}
                disabled={updating}
              />
            </div>
          )}
        </div>

        {/* In-App Only Notice */}
        <div className="pt-4 border-t">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">All Other Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Task assignments, project updates, deadlines, comments, and system notifications 
                are delivered through the in-app notification center only. This helps reduce 
                email overload while keeping you informed within the platform.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
