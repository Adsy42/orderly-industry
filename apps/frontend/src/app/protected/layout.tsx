import { Toaster } from "sonner";
import { AppHeader } from "@/components/app-header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <Toaster
        position="bottom-right"
        richColors
      />
    </div>
  );
}
