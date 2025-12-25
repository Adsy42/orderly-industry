"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function ChatPage(): React.ReactNode {
  // Chat feature is currently under maintenance
  // All code below is preserved but not rendered
  const CHAT_UNDER_MAINTENANCE = true;

  if (CHAT_UNDER_MAINTENANCE) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Wrench className="text-muted-foreground h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Chat Under Maintenance</CardTitle>
            <CardDescription>
              The chat feature is currently unavailable while we make
              improvements. Please check back soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center text-sm">
              We apologize for any inconvenience.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original chat implementation (preserved but not rendered)
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>
          <ArtifactProvider>
            <Thread />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
