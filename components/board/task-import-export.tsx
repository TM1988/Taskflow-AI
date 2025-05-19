"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TaskImportExportProps {
  projectId: string;
  onTasksImported?: () => void;
}

export default function TaskImportExport({
  projectId,
  onTasksImported,
}: TaskImportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  // Handle task export
  const handleExport = async () => {
    if (!projectId) return;

    setIsExporting(true);
    try {
      // Fetch all tasks for the project
      const response = await fetch(`/api/projects/${projectId}/export-tasks`);

      if (!response.ok) {
        throw new Error(`Failed to export tasks: ${response.statusText}`);
      }

      // Get the tasks as JSON
      const tasks = await response.json();

      // Create a JSON file for download
      const blob = new Blob([JSON.stringify(tasks, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `taskflow-tasks-${projectId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your tasks have been exported successfully",
      });
    } catch (error) {
      console.error("Error exporting tasks:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your tasks",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  // Handle task import
  const handleImport = async () => {
    if (!projectId || !importFile) return;

    setIsImporting(true);
    try {
      // Read the file content
      const fileContent = await importFile.text();
      let tasksToImport: any[];

      try {
        tasksToImport = JSON.parse(fileContent);
        if (!Array.isArray(tasksToImport)) {
          throw new Error(
            "The imported file does not contain a valid tasks array",
          );
        }
      } catch (parseError) {
        throw new Error(
          "Failed to parse the JSON file. Please make sure it's valid.",
        );
      }

      // Send tasks to the API
      const response = await fetch(`/api/projects/${projectId}/import-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasksToImport }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import tasks");
      }

      const result = await response.json();

      toast({
        title: "Import successful",
        description: `Successfully imported ${result.importedCount} tasks`,
      });

      // Close the dialog and reset state
      setImportDialogOpen(false);
      setImportFile(null);

      // Notify parent component to refresh
      if (onTasksImported) {
        onTasksImported();
      }
    } catch (error) {
      console.error("Error importing tasks:", error);
      toast({
        title: "Import failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error importing your tasks",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Export Tasks
      </Button>

      <Button
        variant="secondary"
        onClick={() => setImportDialogOpen(true)}
        className="flex items-center"
      >
        <Upload className="mr-2 h-4 w-4" />
        Import Tasks
      </Button>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Tasks</DialogTitle>
            <DialogDescription>
              Import tasks from a JSON file. This will add the tasks to your
              current board and will not overwrite existing tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="cursor-pointer"
            />

            {importFile && (
              <p className="text-sm text-muted-foreground">
                Selected file: {importFile.name}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !importFile}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
