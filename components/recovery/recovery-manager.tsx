"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  Search, 
  Filter,
  Archive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  FolderOpen,
  Building,
  Columns
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { recoveryService } from "@/services/recovery/recoveryService";
import { DeletedItem, RecoveryStats } from "@/types/recovery";
import { formatDistanceToNow } from "date-fns";

interface RecoveryManagerProps {
  organizationId?: string;
  projectId?: string;
}

export default function RecoveryManager({ organizationId, projectId }: RecoveryManagerProps) {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [recovering, setRecovering] = useState<string[]>([]);
  const [showExpiredWarning, setShowExpiredWarning] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDeletedItems();
    fetchStats();
  }, [organizationId, projectId, typeFilter]);

  const fetchDeletedItems = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (typeFilter !== "all") filters.type = typeFilter;
      if (organizationId) filters.organizationId = organizationId;
      if (projectId) filters.projectId = projectId;
      
      const items = await recoveryService.getDeletedItems(filters);
      setDeletedItems(items);
      
      // Check if any items are expiring soon
      const expiringSoon = items.some(item => 
        new Date(item.recoveryDeadline).getTime() - Date.now() < 6 * 60 * 60 * 1000 // 6 hours
      );
      setShowExpiredWarning(expiringSoon);
    } catch (error) {
      console.error("Failed to fetch deleted items:", error);
      toast({
        title: "Error",
        description: "Failed to load deleted items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await recoveryService.getRecoveryStats(organizationId);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch recovery stats:", error);
    }
  };

  const handleRecoverItem = async (itemId: string) => {
    try {
      setRecovering(prev => [...prev, itemId]);
      
      const result = await recoveryService.recoverItem(itemId);
      
      if (result.success) {
        toast({
          title: "Item Recovered",
          description: "The item has been successfully restored",
        });
        
        // Remove from deleted items list
        setDeletedItems(prev => prev.filter(item => item.id !== itemId));
        setSelectedItems(prev => prev.filter(id => id !== itemId));
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to recover item:", error);
      toast({
        title: "Recovery Failed",
        description: error instanceof Error ? error.message : "Failed to recover item",
        variant: "destructive",
      });
    } finally {
      setRecovering(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkRecover = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      const result = await recoveryService.bulkRecover({
        itemIds: selectedItems,
        userId: "current-user-id", // You'll need to get this from auth context
      });
      
      toast({
        title: "Bulk Recovery Complete",
        description: `Successfully recovered ${result.recovered.length} items${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
      });
      
      // Remove recovered items from list
      setDeletedItems(prev => prev.filter(item => !result.recovered.includes(item.id)));
      setSelectedItems([]);
      fetchStats();
    } catch (error) {
      console.error("Failed to bulk recover:", error);
      toast({
        title: "Bulk Recovery Failed",
        description: error instanceof Error ? error.message : "Failed to recover items",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
      return;
    }
    
    try {
      await recoveryService.permanentlyDelete(itemId);
      
      toast({
        title: "Item Permanently Deleted",
        description: "The item has been permanently removed",
      });
      
      setDeletedItems(prev => prev.filter(item => item.id !== itemId));
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      fetchStats();
    } catch (error) {
      console.error("Failed to permanently delete:", error);
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <FileText className="h-4 w-4" />;
      case 'project': return <FolderOpen className="h-4 w-4" />;
      case 'organization': return <Building className="h-4 w-4" />;
      case 'column': return <Columns className="h-4 w-4" />;
      default: return <Archive className="h-4 w-4" />;
    }
  };

  const getExpiryStatus = (recoveryDeadline: Date) => {
    const now = Date.now();
    const deadline = new Date(recoveryDeadline).getTime();
    const timeLeft = deadline - now;
    
    if (timeLeft < 0) {
      return { status: 'expired', color: 'text-red-600', text: 'Expired' };
    } else if (timeLeft < 6 * 60 * 60 * 1000) { // 6 hours
      return { status: 'expiring', color: 'text-orange-600', text: 'Expiring Soon' };
    } else {
      return { status: 'safe', color: 'text-green-600', text: 'Safe' };
    }
  };

  const filteredItems = deletedItems.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalDeleted}</div>
              <div className="text-sm text-muted-foreground">Total Deleted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.byType.task}</div>
              <div className="text-sm text-muted-foreground">Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.byType.project}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.byType.organization}</div>
              <div className="text-sm text-muted-foreground">Organizations</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning for expiring items */}
      {showExpiredWarning && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Some items are expiring soon and will be permanently deleted. Recover them before the deadline.
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Recovery Center
            </CardTitle>
            
            <div className="flex gap-2">
              {selectedItems.length > 0 && (
                <Button onClick={handleBulkRecover} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Recover {selectedItems.length} Items
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deleted items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="organization">Organizations</SelectItem>
                <SelectItem value="column">Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {filteredItems.length > 0 && (
            <div className="flex items-center gap-4 pb-2 border-b">
              <Checkbox
                checked={selectedItems.length === filteredItems.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} of {filteredItems.length} selected
              </span>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No deleted items found</p>
                <p className="text-sm">Items will appear here when deleted and can be recovered for 24 hours</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const expiryStatus = getExpiryStatus(item.recoveryDeadline);
                const isRecovering = recovering.includes(item.id);
                
                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(prev => [...prev, item.id]);
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                      
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            Deleted {formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true })}
                          </span>
                          <span className={`flex items-center gap-1 ${expiryStatus.color}`}>
                            <Clock className="h-3 w-3" />
                            Expires {formatDistanceToNow(new Date(item.recoveryDeadline), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={expiryStatus.status === 'expired' ? 'destructive' : 'outline'}
                          className={`text-xs ${expiryStatus.color}`}
                        >
                          {expiryStatus.text}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecoverItem(item.id)}
                          disabled={isRecovering || expiryStatus.status === 'expired'}
                          className="flex items-center gap-2"
                        >
                          {isRecovering ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Recover
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePermanentDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
