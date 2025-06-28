"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import { Edit2, ArrowLeft, Calendar, Mail, Shield } from "lucide-react";

interface ProfileData {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt?: string;
  lastSignInTime?: string;
  bio?: string;
  role?: string;
  tasksCompleted?: number;
  projectsContributed?: number;
}

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user, updateProfile } = useAuth();
  
  const isOwnProfile = user?.uid === params.userId;

  useEffect(() => {
    fetchProfileData();
  }, [params.userId]);

  useEffect(() => {
    if (profileData && isEditing) {
      setFormData({
        displayName: profileData.displayName || "",
        bio: profileData.bio || "",
      });
    }
  }, [profileData, isEditing]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/${params.userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else if (response.status === 404) {
        toast({
          title: "Profile Not Found",
          description: "The requested profile could not be found.",
          variant: "destructive",
        });
        router.push("/dashboard");
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return;

    try {
      setIsUpdating(true);

      // Update profile in Firebase Auth
      await updateProfile({
        displayName: formData.displayName,
      });

      // Update profile in our database
      const response = await fetch(`/api/profile/${params.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          bio: formData.bio,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p>The requested profile could not be found.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isOwnProfile ? "Your Profile" : `${profileData.displayName}'s Profile`}
            </h1>
            <p className="text-muted-foreground">
              {isOwnProfile ? "Manage your profile settings" : "View profile information"}
            </p>
          </div>
        </div>
        
        {isOwnProfile && (
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profileData.photoURL} alt={profileData.displayName} />
                <AvatarFallback className="text-2xl">
                  {profileData.displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl font-semibold">{profileData.displayName}</h2>
              <p className="text-muted-foreground text-sm">{profileData.email}</p>
              
              {profileData.role && (
                <Badge variant="secondary" className="mt-2">
                  {profileData.role}
                </Badge>
              )}
              
              {profileData.bio && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  {profileData.bio}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details and Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                {isOwnProfile ? "Update your profile details" : "Profile details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing && isOwnProfile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Enter your display name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{profileData.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Member Since</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(profileData.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isOwnProfile && (
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Last Sign In</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(profileData.lastSignInTime)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Task and project statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {profileData.tasksCompleted || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {profileData.projectsContributed || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Projects Contributed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Link for Own Profile */}
          {isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
                <CardDescription>Manage your account and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => router.push("/settings?tab=database")}
                  className="w-full justify-start"
                >
                  Go to Full Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
