// components/ui/password-strength-indicator.tsx
"use client";

import { validatePassword, getPasswordStrength } from "@/lib/password-validation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  const { strength, score } = getPasswordStrength(password);

  const requirements = [
    { label: "6-12 characters", test: password.length >= 6 && password.length <= 12 },
    { label: "Uppercase letter", test: /[A-Z]/.test(password) },
    { label: "Lowercase letter", test: /[a-z]/.test(password) },
    { label: "Number", test: /[0-9]/.test(password) },
    { label: "Special character", test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  if (!password) return null;

  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500", 
    strong: "bg-green-500"
  };

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium capitalize",
            strength === 'weak' && "text-red-500",
            strength === 'medium' && "text-yellow-500",
            strength === 'strong' && "text-green-500"
          )}>
            {strength}
          </span>
        </div>
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < score ? strengthColors[strength] : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Requirements:</p>
          <div className="space-y-1">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {req.test ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={cn(
                  req.test ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                )}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
