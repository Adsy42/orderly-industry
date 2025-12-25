"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, MessageSquare, FileSearch } from "lucide-react";
import { OrderlyIcon } from "@/components/icons/orderly";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const navigation = [
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
  {
    name: "Chat",
    href: "/protected/chat",
    icon: MessageSquare,
  },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/protected/matters"
          className="flex items-center gap-2 font-semibold"
        >
          <OrderlyIcon className="h-6 w-6" />
          <span className="hidden sm:inline">Orderly</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const isChat = item.href === "/protected/chat";
            const isDisabled = isChat; // Chat is under maintenance

            return (
              <Link
                key={item.name}
                href={isDisabled ? "#" : item.href}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
                aria-disabled={isDisabled}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User actions */}
        <div className="flex items-center gap-2">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export type {};
