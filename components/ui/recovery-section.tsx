"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  FileX, 
  Building, 
  Users, 
  FolderOpen,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface SoftDeletedItem {
  id: string;
  type: 'task' | 'project' | 'organization';
  name: string;
  deletedAt: Date;
  expiresAt: Date;
  originalData: any;
}

interface RecoverySectionProps {
  userId: string;
  organizationId?: string;
}

export default function RecoverySection({ userId, organizationId }: RecoverySectionProps) {
  const [deletedItems, setDeletedItems] = useState<SoftDeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [permanentDeleting, setPermanentDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeletedItems();
  }, [userId, organizationId]);

  const fetchDeletedItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId,
        ...(organizationId && { organizationId })
      });
      
      const response = await fetch(`/api/recovery?${params}`);
      if (response.ok) {
        const items = await response.json();
        setDeletedItems(items);
      }
    } catch (error) {
      console.error("Error fetching deleted items:", error);
      toast({
        title: "Error",
        description: "Failed to load deleted items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (itemId: string) => {
    try {
      setRecovering(itemId);
      const response = await fetch(`/api/recovery/${itemId}/restore`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item recovered successfully",
        });
        setDeletedItems(items => items.filter(item => item.id !== itemId));
      } else {
        throw new Error("Failed to recover item");
      }
    } catch (error) {
      console.error("Error recovering item:", error);
      toast({
        title: "Error",
        description: "Failed to recover item",
        variant: "destructive",
      });
    } finally {
      setRecovering(null);
    }
  };

  const handlePermanentDelete = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setPermanentDeleting(itemId);
      const response = await fetch(`/api/recovery/${itemId}/permanent`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item permanently deleted",
        });
        setDeletedItems(items => items.filter(item => item.id !== itemId));
      } else {
        throw new Error("Failed to permanently delete item");
      }
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to permanently delete item",
        variant: "destructive",
      });
    } finally {
      setPermanentDeleting(null);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FileX className="h-4 w-4" />;
      case 'project':
        return <FolderOpen className="h-4 w-4" />;
      case 'organization':
        return <Building className="h-4 w-4" />;
      default:
        return <FileX className="h-4 w-4" />;
    }
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const remaining = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Recovery Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Recovery Center
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Items are kept for 24 hours before permanent deletion
        </p>
      </CardHeader>
      <CardContent>
        {deletedItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <RotateCcw className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No deleted items to recover</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deletedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getItemIcon(item.type)}
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires in {getTimeRemaining(item.expiresAt)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deleted {format(item.deletedAt, "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecover(item.id)}
                    disabled={recovering === item.id || permanentDeleting === item.id}
                  >
                    {recovering === item.id ? (
                      <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Recover
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePermanentDelete(item.id, item.name)}
                    disabled={recovering === item.id || permanentDeleting === item.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {permanentDeleting === item.id ? (
                      <div className="animate-spin h-3 w-3 border border-destructive border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete Forever
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {deletedItems.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Auto-deletion notice</p>
                    <p>Items will be permanently deleted automatically after 24 hours. This cannot be undone.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
