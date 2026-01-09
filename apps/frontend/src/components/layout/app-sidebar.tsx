"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  FileSearch,
  Shield,
  MessageSquare,
  Library,
  LogOut,
  Menu,
} from "lucide-react";
import { OrderlyIcon } from "@/components/icons/orderly";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: typeof Briefcase;
  disabled?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    group: "Workspace",
    items: [
      {
        name: "Matters",
        href: "/protected/matters",
        icon: Briefcase,
      },
      {
        name: "Clause Finder",
        href: "/protected/iql-analyzer",
        icon: FileSearch,
      },
    ],
  },
  {
    group: "Coming Soon",
    items: [
      {
        name: "Contract Analyzer",
        href: "/protected/contract-analyzer",
        icon: Shield,
        disabled: true,
      },
      {
        name: "Chat",
        href: "/protected/chat",
        icon: MessageSquare,
        disabled: true,
      },
      {
        name: "Research",
        href: "#",
        icon: Library,
        disabled: true,
      },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-sidebar-border flex h-16 items-center gap-3 border-b px-6">
        <OrderlyIcon className="h-8 w-8 text-stone-800 dark:text-white" />
        <span className="text-lg font-semibold tracking-tight">Orderly</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        {navigation.map((group) => (
          <div
            key={group.group}
            className="mb-6"
          >
            <p className="text-muted-foreground mb-3 px-3 text-xs font-semibold tracking-wide uppercase">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.disabled ? "#" : item.href}
                    onClick={(e) => {
                      if (item.disabled) {
                        e.preventDefault();
                        return;
                      }
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-white"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      item.disabled && "cursor-not-allowed opacity-50",
                    )}
                    aria-disabled={item.disabled}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-sidebar-border border-t p-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 w-64 border-r",
        className,
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "border-sidebar-border bg-sidebar sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <OrderlyIcon className="h-8 w-8 text-stone-800 dark:text-white" />
        <span className="text-lg font-semibold tracking-tight">Orderly</span>
      </div>

      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
