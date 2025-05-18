"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  const [counter, setCounter] = useState(0);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Test Page</h1>
      <p className="text-muted-foreground mb-8">
        This is a simple test page to isolate the node:events module issue.
      </p>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Counter Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl font-bold">{counter}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCounter(counter - 1)}>
                Decrease
              </Button>
              <Button onClick={() => setCounter(counter + 1)}>
                Increase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}