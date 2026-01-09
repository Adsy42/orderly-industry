import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16",
        "rounded-2xl border-2 border-dashed border-zinc-200",
        "dark:border-slate-700",
        className,
      )}
    >
      {/* Icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="h-8 w-8" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
        {description}
      </p>

      {/* Action */}
      {action && (
        <Button
          onClick={action.onClick}
          className="rounded-xl px-5 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
