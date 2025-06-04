import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <div className="min-h-screen h-screen flex overflow-hidden">
        <div className="w-64 flex-none">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
