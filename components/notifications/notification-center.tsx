'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Filter,
  MoreHorizontal,
  Settings,
  Trash2,
  X,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notifications/notificationService';
import { 
  InAppNotification, 
  NotificationSummary, 
  NotificationFilters,
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS 
} from '@/types/notifications';

interface NotificationCenterProps {
  userId: string;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<NotificationFilters>({ read: false });
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    fetchSummary();
    
    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      fetchSummary(); // Refresh summary
    });

    return unsubscribe;
  }, [userId, filters]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(userId, filters);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const summaryData = await notificationService.getNotificationSummary(userId);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingRead(prev => new Set(prev).add(notificationId));
    try {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
        );
        fetchSummary();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    } finally {
      setMarkingRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await notificationService.markAllAsRead(userId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, readAt: new Date() }))
        );
        fetchSummary();
        toast({
          title: 'Success',
          description: 'All notifications marked as read'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const success = await notificationService.deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        fetchSummary();
        toast({
          title: 'Success',
          description: 'Notification deleted'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    if (selectedNotifications.size === 0) return;

    try {
      const notificationIds = Array.from(selectedNotifications);
      
      if (action === 'read') {
        const success = await notificationService.markMultipleAsRead(notificationIds);
        if (success) {
          setNotifications(prev => 
            prev.map(n => selectedNotifications.has(n.id) ? { ...n, read: true, readAt: new Date() } : n)
          );
        }
      } else {
        const success = await notificationService.deleteMultipleNotifications(notificationIds);
        if (success) {
          setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
        }
      }
      
      setSelectedNotifications(new Set());
      fetchSummary();
      
      toast({
        title: 'Success',
        description: `${notificationIds.length} notifications ${action === 'read' ? 'marked as read' : 'deleted'}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} notifications`,
        variant: 'destructive'
      });
    }
  };

  const handleSelectionChange = (notificationId: string, checked: boolean) => {
    const newSelection = new Set(selectedNotifications);
    if (checked) {
      newSelection.add(notificationId);
    } else {
      newSelection.delete(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const getNotificationIcon = (notification: InAppNotification) => {
    const emoji = NOTIFICATION_ICONS[notification.type] || '📢';
    return emoji;
  };

  const getPriorityColor = (priority: string) => {
    return NOTIFICATION_COLORS[priority as keyof typeof NOTIFICATION_COLORS] || 'text-gray-500';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const hasSelected = selectedNotifications.size > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {summary && summary.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {summary.unread}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Filter Notifications</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      variant={filters.read === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, read: false })}
                    >
                      Unread Only
                    </Button>
                    <Button
                      variant={filters.read === undefined ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, read: undefined })}
                    >
                      All
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMarkAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All as Read
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Notification Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bulk Actions */}
        {hasSelected && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedNotifications.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('read')}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark as Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNotifications(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-background'
                  } hover:bg-muted/50 transition-colors`}
                >
                  <Checkbox
                    checked={selectedNotifications.has(notification.id)}
                    onCheckedChange={(checked) => handleSelectionChange(notification.id, !!checked)}
                  />
                  
                  <div className="text-2xl">{getNotificationIcon(notification)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markingRead.has(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.read && (
                              <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDeleteNotification(notification.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {notification.actionUrl && notification.actionLabel && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-2"
                        onClick={() => window.location.href = notification.actionUrl!}
                      >
                        {notification.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
