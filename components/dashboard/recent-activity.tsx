import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Activity } from "lucide-react";

interface RecentActivityProps {
  projectId?: string;
}

export default function RecentActivity({ projectId }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Activity tracking has been removed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Activity Tracking Disabled</h3>
          <p className="text-muted-foreground">
            Activity tracking has been removed from TaskFlow to focus on core project management features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}