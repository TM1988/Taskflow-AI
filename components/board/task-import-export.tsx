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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

      const tasks = await response.json();
      const blob = new Blob([JSON.stringify(tasks, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `taskflow-tasks-${projectId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

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

      setImportDialogOpen(false);
      setImportFile(null);

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Tasks</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import Tasks</TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
