'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface TeamWorkloadProps {
  projectId?: string;
}

interface TeamMemberProps {
  name: string;
  role: string;
  avatar: string;
  initials: string;
  taskCount: number;
  capacity: number;
}

function TeamMember({ name, role, avatar, initials, taskCount, capacity }: TeamMemberProps) {
  const workloadPercentage = Math.min(100, (taskCount / capacity) * 100);
  
  // Determine status based on workload
  let statusColor = "bg-green-500";
  if (workloadPercentage >= 90) {
    statusColor = "bg-red-500";
  } else if (workloadPercentage >= 75) {
    statusColor = "bg-yellow-500";
  }
  
  return (
    <div className="flex items-start gap-4 mb-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{taskCount}/{capacity}</p>
            <div className={`h-2 w-2 rounded-full ${statusColor} ml-auto`}></div>
          </div>
        </div>
        <Progress 
          value={workloadPercentage} 
          className="h-2"
        />
      </div>
    </div>
  );
}

export default function TeamWorkload({ projectId }: TeamWorkloadProps) {
  // Mock team data
  const teamMembers = [
    {
      name: "Alice Chen",
      role: "Frontend Developer",
      avatar: "https://i.pravatar.cc/150?img=1",
      initials: "AC",
      taskCount: 8,
      capacity: 10,
    },
    {
      name: "Bob Smith",
      role: "Backend Developer", 
      avatar: "https://i.pravatar.cc/150?img=2",
      initials: "BS",
      taskCount: 12,
      capacity: 10,
    },
    {
      name: "Carol Johnson",
      role: "UI/UX Designer",
      avatar: "https://i.pravatar.cc/150?img=3",
      initials: "CJ",
      taskCount: 5,
      capacity: 8,
    },
    {
      name: "Diana Wong",
      role: "Product Manager",
      avatar: "https://i.pravatar.cc/150?img=4",
      initials: "DW",
      taskCount: 9,
      capacity: 10,
    },
    {
      name: "Ethan Davis",
      role: "QA Engineer",
      avatar: "https://i.pravatar.cc/150?img=5",
      initials: "ED",
      taskCount: 6,
      capacity: 6,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>
          Current task allocation across team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {teamMembers.map((member, index) => (
            <TeamMember key={index} {...member} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
