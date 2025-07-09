"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        /* Ensure no sidebar or dashboard components appear */
        .sidebar, [data-sidebar], .dashboard-layout, .app-sidebar {
          display: none !important;
        }
        
        body, #__next, .layout-container {
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>

      {/* Simple Navigation - No sidebar or dashboard header */}
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">Taskflow AI Demo</span>
          </div>
          
          <Button variant="outline" onClick={() => router.push("/landing")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landing
          </Button>
        </div>
      </nav>

      {/* Demo Content */}
      <section className="container mx-auto max-w-4xl pt-24 pb-20 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Taskflow AI Demo</h1>
          <p className="text-xl text-muted-foreground">
            See Taskflow AI in action - experience the future of project management
          </p>
        </div>

        {/* Video Placeholder */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Demo Video Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're preparing an amazing demo video to showcase all the features of Taskflow AI.
                  Check back soon!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>What You'll See</CardTitle>
              <CardDescription>Key features demonstrated in our video</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                  <span>AI-powered task management</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                  <span>Real-time team collaboration</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                  <span>Advanced analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                  <span>Project organization & workflows</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                  <span>Time tracking & reporting</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>Don't wait for the demo - start using Taskflow AI today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Taskflow AI is completely free and ready to use. Create your account now and start 
                managing your projects with AI-powered insights.
              </p>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => router.push("/auth")}>
                  Sign Up Free
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
                  Try Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Experience Taskflow AI Now</h2>
              <p className="text-muted-foreground mb-6">
                Why wait? Start using Taskflow AI today and transform how your team manages projects.
                It's completely free with unlimited users and powerful features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => router.push("/auth")}>
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/landing")}>
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
