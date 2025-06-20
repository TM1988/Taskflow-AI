"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Cloud, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatabaseStepProps {
  onComplete: (data: any) => void;
  onSkip: () => void;
  initialData?: any;
}

export default function DatabaseStep({ onComplete, onSkip, initialData }: DatabaseStepProps) {
  const [selectedOption, setSelectedOption] = useState<'official' | 'custom' | null>(
    initialData?.useOfficialMongoDB ? 'official' : 
    initialData?.useCustomMongoDB ? 'custom' : null
  );
  const [connectionString, setConnectionString] = useState(initialData?.connectionString || '');
  const [databaseName, setDatabaseName] = useState(initialData?.databaseName || '');
  const [performanceWarningAcknowledged, setPerformanceWarningAcknowledged] = useState(
    initialData?.performanceWarningAcknowledged || false
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionValid, setConnectionValid] = useState<boolean | null>(null);

  const { toast } = useToast();

  const testConnection = async () => {
    if (!connectionString.trim()) {
      toast({
        title: "Connection string required",
        description: "Please enter a MongoDB connection string",
        variant: "destructive"
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionValid(null);

    try {
      const response = await fetch('/api/db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          connectionString: connectionString.trim(),
          databaseName: databaseName.trim() || 'taskflow'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setConnectionValid(true);
        toast({
          title: "Connection successful!",
          description: "Your MongoDB database is accessible and ready to use.",
        });
      } else {
        setConnectionValid(false);
        toast({
          title: "Connection failed",
          description: result.error || "Could not connect to the database. Please check your connection string.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionValid(false);
      toast({
        title: "Connection failed",
        description: "Network error while testing connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleComplete = () => {
    if (!selectedOption) {
      toast({
        title: "Please select an option",
        description: "Choose either our official MongoDB service or configure your own database.",
        variant: "destructive"
      });
      return;
    }

    if (selectedOption === 'custom') {
      if (!connectionString.trim()) {
        toast({
          title: "Connection string required",
          description: "Please enter your MongoDB connection string.",
          variant: "destructive"
        });
        return;
      }

      if (!performanceWarningAcknowledged) {
        toast({
          title: "Please acknowledge the warning",
          description: "You must acknowledge the performance considerations before proceeding.",
          variant: "destructive"
        });
        return;
      }
    }

    const data = {
      useOfficialMongoDB: selectedOption === 'official',
      useCustomMongoDB: selectedOption === 'custom',
      connectionString: selectedOption === 'custom' ? connectionString.trim() : '',
      databaseName: selectedOption === 'custom' ? (databaseName.trim() || 'taskflow') : '',
      performanceWarningAcknowledged: selectedOption === 'custom' ? performanceWarningAcknowledged : false,
    };

    onComplete(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Database Configuration</h2>
        <p className="text-muted-foreground">
          Configure your MongoDB database to store your TaskFlow data
        </p>
      </div>

      {/* Strong recommendation for own database */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>We strongly recommend using your own MongoDB database.</strong> Our shared database has limited capacity and may become full. 
          Your own database ensures better performance, unlimited storage, and complete data control.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Custom Database Option (Recommended) */}
        <Card 
          className={`cursor-pointer transition-all border-2 ${
            selectedOption === 'custom' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-green-300'
          }`}
          onClick={() => setSelectedOption('custom')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Server className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-green-700">Your Own Database</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                      RECOMMENDED
                    </span>
                    <span className="text-sm text-green-600 font-medium">Free & Unlimited</span>
                  </div>
                </div>
              </div>
              <Checkbox checked={selectedOption === 'custom'} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-gray-600 mb-4">
              Use your own MongoDB database for complete control, unlimited storage, and better performance.
            </CardDescription>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Unlimited storage capacity</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Better performance & reliability</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Complete data ownership</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Free MongoDB Atlas tier available</span>
              </div>
            </div>

            {selectedOption === 'custom' && (
              <div className="mt-6 space-y-4 p-4 bg-white rounded-lg border">
                <div>
                  <Label htmlFor="connectionString" className="text-sm font-medium">
                    MongoDB Connection String <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="connectionString"
                    type="text"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder="mongodb+srv://username:password@cluster.mongodb.net/"
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get this from your MongoDB Atlas dashboard or your MongoDB provider
                  </p>
                </div>

                <div>
                  <Label htmlFor="databaseName" className="text-sm font-medium">
                    Database Name (optional)
                  </Label>
                  <Input
                    id="databaseName"
                    type="text"
                    value={databaseName}
                    onChange={(e) => setDatabaseName(e.target.value)}
                    placeholder="taskflow"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use "taskflow" as default
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testConnection}
                    disabled={isTestingConnection || !connectionString.trim()}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  
                  {connectionValid === true && (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Connected!
                    </span>
                  )}
                  
                  {connectionValid === false && (
                    <span className="text-red-600 text-sm flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Failed
                    </span>
                  )}
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Don't have MongoDB yet?</strong> Create a free MongoDB Atlas account at{" "}
                    <a 
                      href="https://cloud.mongodb.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      cloud.mongodb.com
                    </a>
                    {" "}(512MB free tier available)
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Official Database Option (Limited) */}
        <Card 
          className={`cursor-pointer transition-all border-2 ${
            selectedOption === 'official' 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-200 hover:border-orange-300'
          }`}
          onClick={() => setSelectedOption('official')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Cloud className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-orange-700">Our Shared Database</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      LIMITED CAPACITY
                    </span>
                  </div>
                </div>
              </div>
              <Checkbox checked={selectedOption === 'official'} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-gray-600 mb-4">
              Use our shared MongoDB instance for quick setup, but with capacity limitations.
            </CardDescription>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Limited storage space</span>
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span>May become unavailable when full</span>
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Shared performance with other users</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>No setup required</span>
              </div>
            </div>

            {selectedOption === 'official' && (
              <div className="mt-6 p-4 bg-white rounded-lg border">
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    <strong>Important:</strong> Our shared database has limited capacity and may become full. 
                    You may lose access to your data when this happens. We strongly recommend setting up your own database.
                  </AlertDescription>
                </Alert>

                <div className="mt-4 flex items-start space-x-2">
                  <Checkbox
                    id="performanceWarning"
                    checked={performanceWarningAcknowledged}
                    onCheckedChange={(checked) => setPerformanceWarningAcknowledged(checked as boolean)}
                  />
                  <Label htmlFor="performanceWarning" className="text-sm leading-tight">
                    I understand the limitations and risks of using the shared database, and I may need to migrate to my own database later.
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom MongoDB Configuration */}
      {selectedOption === 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>MongoDB Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connectionString">MongoDB Connection String</Label>
              <Input
                id="connectionString"
                type="password"
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Your MongoDB Atlas connection string or connection URI
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="databaseName">Database Name (optional)</Label>
              <Input
                id="databaseName"
                placeholder="taskflow"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Defaults to "taskflow" if not specified
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                onClick={testConnection} 
                disabled={!connectionString.trim() || isTestingConnection}
                variant="outline"
                size="sm"
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              {connectionValid === true && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Connection successful</span>
                </div>
              )}
              {connectionValid === false && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Connection failed</span>
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div className="font-medium">Performance & Storage Considerations:</div>
                <ul className="text-sm space-y-1">
                  <li>• External databases may have slower response times due to network latency</li>
                  <li>• You are responsible for database backups, security, and maintenance</li>
                  <li>• Storage costs and limits depend on your MongoDB plan</li>
                  <li>• Connection reliability depends on your database provider</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acknowledge"
                checked={performanceWarningAcknowledged}
                onCheckedChange={(checked) => setPerformanceWarningAcknowledged(!!checked)}
              />
              <Label htmlFor="acknowledge" className="text-sm">
                I understand the performance and storage considerations
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={handleComplete}>
          {selectedOption === 'custom' ? 'Save Configuration' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
