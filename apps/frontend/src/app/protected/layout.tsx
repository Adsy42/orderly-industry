import { Toaster } from "sonner";
import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      {/* Desktop Sidebar - Fixed position */}
      <AppSidebar className="hidden lg:flex lg:flex-col" />

      {/* Mobile Navigation - Sticky top */}
      <MobileNav className="lg:hidden" />

      {/* Main Content Area */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
          {children}
        </div>
      </main>

      <Toaster
        position="bottom-right"
        richColors
      />
    </div>
  );
}
