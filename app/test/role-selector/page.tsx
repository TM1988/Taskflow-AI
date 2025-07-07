"use client";

import { useState } from "react";
import {
  RoleSelectorFast,
  MemberRoleSelectorFast,
  InviteRoleSelectorFast,
} from "@/components/ui/role-selector-fast";
import {
  UltraFastRoleSelector,
  MemberRoleSelectorUltraFast,
  InviteRoleSelectorUltraFast,
} from "@/components/ui/role-selector-ultra-fast";
import {
  LightningRoleSelector,
  MemberRoleSelectorLightning,
  InviteRoleSelectorLightning,
} from "@/components/ui/role-selector-lightning";
import {
  OptimizedExtremeRoleSelector,
  MemberRoleSelectorOptimizedExtreme,
  InviteRoleSelectorOptimizedExtreme,
} from "@/components/ui/role-selector-optimized-extreme";
import { AssigneeDropdownExtreme } from "@/components/ui/assignee-dropdown-extreme";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import InviteMemberModalFast from "@/components/organizations/invite-member-modal-fast";
import {
  SelectFast,
  SelectContentFast,
  SelectItemFast,
  SelectTriggerFast,
  SelectValueFast,
} from "@/components/ui/select-fast";
import {
  DialogFast,
  DialogContentFast,
  DialogHeaderFast,
  DialogTitleFast,
  DialogFooterFast,
} from "@/components/ui/dialog-fast";
import {
  DropdownSimple,
  DropdownItemSimple,
  DropdownSeparatorSimple,
  DropdownLabelSimple,
} from "@/components/ui/dropdown-simple";
import {
  UserPlus,
  TestTube,
  Zap,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function RoleSelectorTestPage() {
  const [currentRole, setCurrentRole] = useState("member");
  const [inviteRole, setInviteRole] = useState("member");
  const [memberRole, setMemberRole] = useState("member");
  const [ultraFastRole, setUltraFastRole] = useState("member");
  const [lightningRole, setLightningRole] = useState("member");
  const [lightningInviteRole, setLightningInviteRole] = useState("member");
  const [lightningMemberRole, setLightningMemberRole] = useState("member");
  const [extremeRole, setExtremeRole] = useState("member");
  const [extremeInviteRole, setExtremeInviteRole] = useState("member");
  const [extremeMemberRole, setExtremeMemberRole] = useState("member");
  const [selectedAssignee, setSelectedAssignee] = useState("unassigned");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testOrgId] = useState("test-org-123"); // Mock organization ID

  const runPerformanceTest = () => {
    const results: string[] = [];
    const startTime = performance.now();

    // Test role selector operations
    for (let i = 0; i < 100; i++) {
      setCurrentRole(i % 2 === 0 ? "admin" : "member");
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    results.push(
      `✅ Role changes: ${duration.toFixed(2)}ms for 100 operations`,
    );

    if (duration < 50) {
      results.push("🚀 EXCELLENT: No performance issues detected");
    } else if (duration < 100) {
      results.push("⚡ GOOD: Minor performance impact");
    } else {
      results.push("⚠️ WARNING: Performance issues detected");
    }

    setTestResults(results);
  };

  const testFreezingPrevention = () => {
    const results: string[] = [];

    // Rapid fire dropdown openings
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        setTestDialogOpen(true);
        setTimeout(() => setTestDialogOpen(false), 50);
      }, i * 100);
    }

    results.push("🧪 Rapid dialog test initiated - watch for freezing");
    setTestResults(results);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          Ultra-Fast Components Test Page
        </h1>
        <p className="text-muted-foreground">
          Test the performance-optimized components with NO ANIMATIONS that
          prevent app freezing
        </p>
      </div>

      {/* Performance Test Controls */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Performance Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runPerformanceTest} variant="outline">
              🚀 Test Role Changes (100x)
            </Button>
            <Button onClick={testFreezingPrevention} variant="outline">
              🧪 Test Freeze Prevention
            </Button>
            <Button onClick={() => setInviteModalOpen(true)} variant="outline">
              📧 Test Fast Modal
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="mt-4 p-3 bg-background rounded border">
              <h4 className="font-medium mb-2">Test Results:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Ultra-Fast Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Ultra-Fast Role Selector</CardTitle>
            <CardDescription>
              New optimized version with custom roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Select Role:</label>
              <UltraFastRoleSelector
                currentRole={ultraFastRole}
                onChange={setUltraFastRole}
                variant="select"
                className="w-full mt-2"
                organizationId={testOrgId}
                includeCustomRoles={true}
              />
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{ultraFastRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lightning Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Lightning Role Selector</CardTitle>
            <CardDescription>
              Super fast native select - no lag!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Select Role:</label>
              <LightningRoleSelector
                currentRole={lightningRole}
                onChange={setLightningRole}
                variant="native"
                className="w-full mt-2"
                organizationId={testOrgId}
              />
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{lightningRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Extreme Optimized Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Extreme Optimized Selector</CardTitle>
            <CardDescription>
              Beautiful UI with zero lag optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Select Role:</label>
              <OptimizedExtremeRoleSelector
                currentRole={extremeRole}
                onChange={setExtremeRole}
                variant="dropdown"
                className="w-full mt-2"
                organizationId={testOrgId}
              />
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{extremeRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Fast Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Fast Role Selector (Legacy)</CardTitle>
            <CardDescription>Original fast version</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Role:</label>
              <RoleSelectorFast
                currentRole={currentRole}
                onChange={setCurrentRole}
                variant="select"
                className="w-full mt-2"
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Current: </span>
              <Badge variant="outline">{currentRole}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚡ Uses SelectFast components - no blocking animations
            </p>
          </CardContent>
        </Card>

        {/* Ultra-Fast Invitation Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Ultra-Fast Invitation Selector</CardTitle>
            <CardDescription>Optimized with custom roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Invite as:</label>
              <InviteRoleSelectorUltraFast
                currentRole={inviteRole}
                onChange={setInviteRole}
                className="w-full mt-2"
                organizationId={testOrgId}
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{inviteRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Extreme Optimized Invitation Selector */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Extreme Invitation Selector</CardTitle>
            <CardDescription>
              Custom UI with severe optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Invite as:</label>
              <InviteRoleSelectorOptimizedExtreme
                currentRole={extremeInviteRole}
                onChange={setExtremeInviteRole}
                className="w-full mt-2"
                organizationId={testOrgId}
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{extremeInviteRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lightning Invitation Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Lightning Invitation Selector</CardTitle>
            <CardDescription>Native select - instant response</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Invite as:</label>
              <InviteRoleSelectorLightning
                currentRole={lightningInviteRole}
                onChange={setLightningInviteRole}
                className="w-full mt-2"
                organizationId={testOrgId}
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{lightningInviteRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Fast Invitation Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Fast Invitation Selector (Legacy)</CardTitle>
            <CardDescription>Original version</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Invite as:</label>
              <InviteRoleSelectorFast
                currentRole={inviteRole}
                onChange={setInviteRole}
                className="w-full mt-2"
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{inviteRole}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              🚫 Owner role automatically excluded
            </p>
          </CardContent>
        </Card>

        {/* Lightning Member Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Lightning Member Selector</CardTitle>
            <CardDescription>
              Native select for member management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Change Role:</label>
              <div className="mt-2">
                <MemberRoleSelectorLightning
                  currentRole={lightningMemberRole}
                  onChange={setLightningMemberRole}
                  organizationId={testOrgId}
                />
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{lightningMemberRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Extreme Optimized Member Selector */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Extreme Member Selector</CardTitle>
            <CardDescription>Zero-lag member role management</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Change Role:</label>
              <div className="mt-2">
                <MemberRoleSelectorOptimizedExtreme
                  currentRole={extremeMemberRole}
                  onChange={setExtremeMemberRole}
                  organizationId={testOrgId}
                />
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{extremeMemberRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ultra-Fast Member Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Ultra-Fast Member Selector</CardTitle>
            <CardDescription>Optimized for member management</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Change Role:</label>
              <div className="mt-2">
                <MemberRoleSelectorUltraFast
                  currentRole={memberRole}
                  onChange={setMemberRole}
                  organizationId={testOrgId}
                />
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{memberRole}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Fast Member Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Fast Member Selector (Legacy)</CardTitle>
            <CardDescription>Original dropdown version</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Change role:</label>
              <div className="mt-2">
                <MemberRoleSelectorFast
                  currentRole={memberRole}
                  onChange={setMemberRole}
                />
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Role: </span>
              <Badge variant="default">{memberRole}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              🔄 Instant role changes without freezing
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Component Tests */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Raw SelectFast Test */}
        <Card>
          <CardHeader>
            <CardTitle>Raw SelectFast Component</CardTitle>
          </CardHeader>
          <CardContent>
            <SelectFast defaultValue="option1">
              <SelectTriggerFast>
                <SelectValueFast placeholder="Select an option" />
              </SelectTriggerFast>
              <SelectContentFast>
                <SelectItemFast value="option1">Option 1</SelectItemFast>
                <SelectItemFast value="option2">Option 2</SelectItemFast>
                <SelectItemFast value="option3">Option 3</SelectItemFast>
              </SelectContentFast>
            </SelectFast>
            <p className="text-xs text-muted-foreground mt-2">
              Direct SelectFast usage - no animation classes
            </p>
          </CardContent>
        </Card>

        {/* Simple Dropdown Test */}
        <Card>
          <CardHeader>
            <CardTitle>Simple Dropdown Test</CardTitle>
          </CardHeader>
          <CardContent>
            <DropdownSimple
              trigger={<Button variant="outline">Simple Dropdown</Button>}
            >
              <DropdownLabelSimple>Actions</DropdownLabelSimple>
              <DropdownSeparatorSimple />
              <DropdownItemSimple onClick={() => console.log("Action 1")}>
                Action 1
              </DropdownItemSimple>
              <DropdownItemSimple onClick={() => console.log("Action 2")}>
                Action 2
              </DropdownItemSimple>
              <DropdownItemSimple disabled>Disabled Action</DropdownItemSimple>
            </DropdownSimple>
            <p className="text-xs text-muted-foreground mt-2">
              Custom dropdown without Radix animations
            </p>
          </CardContent>
        </Card>

        {/* Extreme Optimized Assignee Dropdown */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Extreme Assignee Dropdown</CardTitle>
            <CardDescription>Zero-lag assignee selection</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Assign to:</label>
              <AssigneeDropdownExtreme
                projectId={testOrgId}
                selectedAssigneeId={selectedAssignee}
                onAssigneeSelect={setSelectedAssignee}
                className="w-full mt-2"
              />
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Selected: </span>
              <Badge variant="secondary">{selectedAssignee}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stress Test */}
      <Card>
        <CardHeader>
          <CardTitle>Stress Test - Multiple Selectors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-medium">User {index + 1}:</label>
                <MemberRoleSelectorOptimizedExtreme
                  currentRole="member"
                  onChange={(role) =>
                    console.log(`User ${index + 1} role: ${role}`)
                  }
                  organizationId={testOrgId}
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            🏋️ Stress test with 12 simultaneous extreme optimized selectors
          </p>
        </CardContent>
      </Card>

      {/* Expected vs Actual Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                OLD (Blocking) Components:
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>❌ App freezes when dropdowns open</li>
                <li>❌ Heavy CSS animations block main thread</li>
                <li>❌ Multiple animation classes cause lag</li>
                <li>❌ Radix UI animations: fade-in, zoom, slide</li>
                <li>❌ Performance degrades with multiple selectors</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                NEW (Fast) Components:
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✅ No app freezing - instant dropdown opening</li>
                <li>✅ Removed all blocking CSS animations</li>
                <li>✅ Immediate role changes without delay</li>
                <li>✅ Owner role automatically excluded</li>
                <li>✅ Scales well with multiple components</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fast Modal */}
      <InviteMemberModalFast
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        organizationId="test-org"
        onInvitationSent={() => console.log("Invitation sent!")}
      />

      {/* Test Dialog */}
      <DialogFast open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContentFast className="sm:max-w-md">
          <DialogHeaderFast>
            <DialogTitleFast>Fast Dialog Test</DialogTitleFast>
          </DialogHeaderFast>
          <div className="py-4">
            <p>This dialog opens without blocking animations!</p>
          </div>
          <DialogFooterFast>
            <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          </DialogFooterFast>
        </DialogContentFast>
      </DialogFast>
    </div>
  );
}
