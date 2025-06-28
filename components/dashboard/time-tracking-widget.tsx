"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Plus,
  Timer as TimerIcon,
  Target,
  Info
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimeTrackingWidgetProps {
  taskId?: string;
  taskName?: string;
  projectId?: string;
}

export default function TimeTrackingWidget({ taskId, taskName, projectId }: TimeTrackingWidgetProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionDescription, setSessionDescription] = useState("");
  
  // Manual entry state
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  
  // Today's time and entries
  const [todayTime, setTodayTime] = useState(0); // in minutes
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    console.log('Time tracking effect - user:', user?.uid, 'authLoading:', authLoading);
    if (!authLoading && user?.uid) {
      console.log('User found and auth loaded, fetching time tracking data...');
      fetchTodayTime();
    } else {
      console.log('Auth still loading or no user');
    }
  }, [user?.uid, authLoading]);

  const fetchTodayTime = async () => {
    if (!user?.uid) {
      console.log('No user ID available for fetching time tracking');
      return;
    }
    
    try {
      console.log('Fetching today time for user:', user?.uid);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's entries
      const todayParams = new URLSearchParams({
        userId: user.uid,
        date: today
      });
      if (projectId) {
        todayParams.append('projectId', projectId);
      }
      const todayResponse = await fetch(`/api/time-tracking?${todayParams.toString()}`);
      console.log('Today time tracking response status:', todayResponse.status);
      
      if (todayResponse.ok) {
        const todayEntries = await todayResponse.json();
        console.log('Today time tracking entries:', todayEntries);
        setTodayEntries(todayEntries);
        const totalMinutes = todayEntries.reduce((sum: number, entry: any) => sum + entry.minutes, 0);
        setTodayTime(totalMinutes);
      }
      
      // Fetch all entries (for removal)
      const allParams = new URLSearchParams({
        userId: user.uid
      });
      if (projectId) {
        allParams.append('projectId', projectId);
      }
      const allResponse = await fetch(`/api/time-tracking?${allParams.toString()}`);
      console.log('All time tracking response status:', allResponse.status);
      
      if (allResponse.ok) {
        const allEntries = await allResponse.json();
        console.log('All time tracking entries:', allEntries.length);
        setAllEntries(allEntries);
      }
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('timeTrackingUpdated'));
    } catch (error) {
      console.error('Error fetching time tracking data:', error);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (totalMinutes: number) => {
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const startTimer = () => {
    setIsRunning(true);
    toast({
      title: "Timer started",
      description: taskName ? `Tracking time for: ${taskName}` : "Tracking focus time",
    });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    toast({
      title: "Timer paused",
      description: "You can resume or save your session",
    });
  };

  const stopAndSaveTimer = async () => {
    if (seconds === 0) {
      toast({
        title: "No time to save",
        description: "Timer hasn't been running",
        variant: "destructive",
      });
      return;
    }

    try {
      const minutes = Math.ceil(seconds / 60); // Round up to nearest minute
      
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          taskId: taskId || null,
          projectId: projectId || null,
          minutes,
          description: sessionDescription || (taskName ? `Work on: ${taskName}` : 'Focus session'),
          type: 'timer'
        })
      });

      if (response.ok) {
        toast({
          title: "Time saved!",
          description: `Recorded ${minutes} minutes of focus time`,
        });
        
        // Reset timer
        setIsRunning(false);
        setSeconds(0);
        setSessionDescription("");
        
        // Refresh today's time
        fetchTodayTime();
      } else {
        throw new Error('Failed to save time');
      }
    } catch (error) {
      console.error('Error saving time:', error);
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      });
    }
  };

  const saveManualEntry = async () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes <= 0) {
      toast({
        title: "Invalid time",
        description: "Please enter a valid time duration",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          taskId: taskId || null,
          projectId: projectId || null,
          minutes: totalMinutes,
          description: manualDescription || 'Manual time entry',
          type: 'manual'
        })
      });

      if (response.ok) {
        toast({
          title: "Time entry added!",
          description: `Recorded ${totalMinutes} minutes${totalMinutes >= 60 ? ` (${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m)` : ''}`,
        });
        
        // Reset form and close dialog
        setManualHours("");
        setManualMinutes("");
        setManualDescription("");
        setIsManualDialogOpen(false);
        
        // Refresh today's time
        fetchTodayTime();
      } else {
        throw new Error('Failed to save time');
      }
    } catch (error) {
      console.error('Error saving manual entry:', error);
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      });
    }
  };

  const removeTimeEntry = async (entryId: string) => {
    try {
      console.log('Removing time entry:', entryId);
      const response = await fetch(`/api/time-tracking?entryId=${entryId}&userId=${user?.uid}`, {
        method: 'DELETE',
      });

      console.log('Remove response status:', response.status);

      if (response.ok) {
        toast({
          title: "Entry removed",
          description: "Time entry has been deleted",
        });
        
        // Refresh today's time
        fetchTodayTime();
      } else {
        const errorText = await response.text();
        console.error('Remove error response:', errorText);
        throw new Error(`Failed to remove entry: ${errorText}`);
      }
    } catch (error) {
      console.error('Error removing time entry:', error);
      toast({
        title: "Error",
        description: "Failed to remove time entry",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {projectId ? 'Project Time Tracking' : 'Time Tracking'}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  {projectId 
                    ? 'Track time spent on project tasks using the timer or add manual entries. Time data contributes to team analytics and project insights.'
                    : 'Track time spent on tasks using the timer or add manual entries. Time data helps improve focus metrics and productivity insights.'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Time Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {projectId ? "Today's Project Time" : "Today's Focus Time"}
            </span>
          </div>
          <span className="text-lg font-bold text-primary">
            {formatMinutes(todayTime)}
          </span>
        </div>

        {/* Timer Section */}
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-primary mb-2">
              {formatTime(seconds)}
            </div>
            {taskName && (
              <p className="text-sm text-muted-foreground">
                Working on: {taskName}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {!isRunning && seconds === 0 && (
              <Button onClick={startTimer} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            )}
            
            {!isRunning && seconds > 0 && (
              <>
                <Button onClick={startTimer} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button onClick={stopAndSaveTimer} className="flex-1">
                  <Square className="h-4 w-4 mr-2" />
                  Save & Stop
                </Button>
              </>
            )}
            
            {isRunning && (
              <>
                <Button onClick={pauseTimer} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button onClick={stopAndSaveTimer} className="flex-1">
                  <Square className="h-4 w-4 mr-2" />
                  Save & Stop
                </Button>
              </>
            )}
          </div>

          {/* Session Description */}
          {(isRunning || seconds > 0) && (
            <div className="space-y-2">
              <Label htmlFor="session-description" className="text-xs">
                Session Description (optional)
              </Label>
              <Input
                id="session-description"
                placeholder="What are you working on?"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </div>

        {/* Manual Entry */}
        <div className="pt-3 border-t">
          <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Time Entry</DialogTitle>
                <DialogDescription>
                  Manually add time you spent working on tasks
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-hours">Hours</Label>
                    <Input
                      id="manual-hours"
                      type="number"
                      placeholder="0"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      min="0"
                      max="24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-minutes">Minutes</Label>
                    <Input
                      id="manual-minutes"
                      type="number"
                      placeholder="30"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      min="0"
                      max="59"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-description">Description</Label>
                  <Textarea
                    id="manual-description"
                    placeholder="What did you work on?"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsManualDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveManualEntry} className="flex-1">
                    Save Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Time Breakdown */}
        <div className="pt-3 border-t">
          {/* Today's Sessions */}
          {todayEntries.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between mb-2"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                <span className="text-xs">Today's Sessions ({todayEntries.length})</span>
                <span className="text-xs">{showBreakdown ? '▼' : '▶'}</span>
              </Button>
              
              {showBreakdown && (
                <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
                  {todayEntries.map((entry, index) => (
                    <div key={entry._id || entry.id || index} className="flex items-start justify-between p-2 bg-muted/50 rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{entry.minutes}m</div>
                        <div className="text-muted-foreground truncate">
                          {entry.description || 'No description'}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeTimeEntry(entry._id || entry.id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* All Time Entries */}
          {allEntries.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between"
                onClick={() => setShowAllEntries(!showAllEntries)}
              >
                <span className="text-xs">All Time Entries ({allEntries.length}) - Click to {showAllEntries ? 'hide' : 'view & remove'}</span>
                <span className="text-xs">{showAllEntries ? '▼' : '▶'}</span>
              </Button>
              
              {showAllEntries && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  <div className="text-xs text-muted-foreground mb-2">Click × to remove any entry</div>
                  {allEntries
                    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
                    .map((entry, index) => (
                    <div key={entry._id || entry.id || index} className="flex items-start justify-between p-2 bg-muted/50 rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{entry.minutes}m</div>
                        <div className="text-muted-foreground truncate">
                          {entry.description || 'No description'}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(entry.createdAt || entry.date).toLocaleDateString()} {new Date(entry.createdAt || entry.date).toLocaleTimeString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeTimeEntry(entry._id || entry.id)}
                        title="Remove this time entry"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {todayEntries.length === 0 && allEntries.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No time entries found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
