import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  action: string;
  target: string;
  timestamp: string;
  type: 'commit' | 'pr' | 'task' | 'comment';
}

function ActivityItem({ user, action, target, timestamp, type }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 rounded-lg p-3 transition-all hover:bg-accent">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{user.name}</span>
          <span className="text-muted-foreground"> {action} </span>
          <span className={cn(
            "font-medium",
            type === 'commit' && "text-purple-500 dark:text-purple-400",
            type === 'pr' && "text-blue-500 dark:text-blue-400",
            type === 'task' && "text-green-500 dark:text-green-400",
            type === 'comment' && "text-orange-500 dark:text-orange-400",
          )}>
            {target}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  );
}

export default function RecentActivity() {
  // Mock activity data
  const activities = [
    {
      user: {
        name: "Alice Chen",
        avatar: "https://i.pravatar.cc/150?img=1",
        initials: "AC",
      },
      action: "merged pull request",
      target: "Fix authentication flow",
      timestamp: "10 minutes ago",
      type: 'pr' as const,
    },
    {
      user: {
        name: "Bob Smith",
        avatar: "https://i.pravatar.cc/150?img=2",
        initials: "BS",
      },
      action: "completed task",
      target: "API documentation",
      timestamp: "25 minutes ago",
      type: 'task' as const,
    },
    {
      user: {
        name: "Charlie Kim",
        avatar: "https://i.pravatar.cc/150?img=3",
        initials: "CK",
      },
      action: "pushed",
      target: "15 commits to main",
      timestamp: "1 hour ago",
      type: 'commit' as const,
    },
    {
      user: {
        name: "Diana Wong",
        avatar: "https://i.pravatar.cc/150?img=4",
        initials: "DW",
      },
      action: "commented on",
      target: "User profile redesign",
      timestamp: "3 hours ago",
      type: 'comment' as const,
    },
    {
      user: {
        name: "Ethan Davis",
        avatar: "https://i.pravatar.cc/150?img=5",
        initials: "ED",
      },
      action: "created task",
      target: "Implement dark mode",
      timestamp: "5 hours ago",
      type: 'task' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions from your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.map((activity, index) => (
            <ActivityItem key={index} {...activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}