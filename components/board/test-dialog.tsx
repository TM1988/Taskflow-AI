"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TestDialog({ open, onOpenChange }: TestDialogProps) {
  console.log("🧪 TestDialog: Rendering with open =", open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] bg-white dark:bg-gray-800 border-4 border-red-500"
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          backgroundColor: "white",
          border: "4px solid red",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          minWidth: "400px",
          padding: "24px",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-red-600 text-xl font-bold">
            🧪 TEST DIALOG - This should be VERY visible!
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-yellow-200 p-4 rounded border-2 border-yellow-600">
            <h3 className="font-bold text-black">SUCCESS!</h3>
            <p className="text-black">If you can see this, the dialog is working!</p>
            <p className="text-black text-sm mt-2">
              Dialog state: {open ? "OPEN" : "CLOSED"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              console.log("🧪 TestDialog: Close button clicked");
              onOpenChange(false);
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Close Test Dialog
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
