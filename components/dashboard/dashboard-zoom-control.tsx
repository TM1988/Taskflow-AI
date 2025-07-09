"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardZoomControlProps {
  onZoomChange: (zoom: number) => void;
}

const ZOOM_LEVELS = [
  { value: 0.5, label: "50%" },
  { value: 0.6, label: "60%" },
  { value: 0.75, label: "75%" },
  { value: 0.85, label: "85%" },
  { value: 1, label: "100%" },
  { value: 1.1, label: "110%" },
  { value: 1.25, label: "125%" },
  { value: 1.5, label: "150%" },
];

export default function DashboardZoomControl({ onZoomChange }: DashboardZoomControlProps) {
  const [currentZoom, setCurrentZoom] = useState(1);

  // Load saved zoom level from localStorage
  useEffect(() => {
    const savedZoom = localStorage.getItem('taskflow-dashboard-zoom');
    if (savedZoom) {
      const zoom = parseFloat(savedZoom);
      setCurrentZoom(zoom);
      onZoomChange(zoom);
    }
  }, [onZoomChange]);

  // Add keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle when Ctrl/Cmd is pressed and focus is not on an input
      if ((event.ctrlKey || event.metaKey) && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        if (event.key === '=' || event.key === '+') {
          event.preventDefault();
          zoomIn();
        } else if (event.key === '-') {
          event.preventDefault();
          zoomOut();
        } else if (event.key === '0') {
          event.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentZoom]);

  const handleZoomChange = (newZoom: number) => {
    setCurrentZoom(newZoom);
    onZoomChange(newZoom);
    localStorage.setItem('taskflow-dashboard-zoom', newZoom.toString());
  };

  const zoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level.value === currentZoom);
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    handleZoomChange(ZOOM_LEVELS[nextIndex].value);
  };

  const zoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level.value === currentZoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    handleZoomChange(ZOOM_LEVELS[prevIndex].value);
  };

  const resetZoom = () => {
    handleZoomChange(1);
  };

  const getCurrentLabel = () => {
    const level = ZOOM_LEVELS.find(level => level.value === currentZoom);
    return level ? level.label : `${Math.round(currentZoom * 100)}%`;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={currentZoom <= ZOOM_LEVELS[0].value}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom Out (Ctrl/Cmd + -)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 min-w-[60px]">
                  <Badge variant="secondary" className="text-xs">
                    {getCurrentLabel()}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {ZOOM_LEVELS.map((level) => (
                  <DropdownMenuItem
                    key={level.value}
                    onClick={() => handleZoomChange(level.value)}
                    className={`justify-center ${
                      currentZoom === level.value ? "bg-accent" : ""
                    }`}
                  >
                    {level.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom Level (Ctrl/Cmd + 0 to reset)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={currentZoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1].value}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom In (Ctrl/Cmd + +)</p>
          </TooltipContent>
        </Tooltip>

        {currentZoom !== 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset Zoom</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
