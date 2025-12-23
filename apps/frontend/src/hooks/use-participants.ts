"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface Participant {
  id: string;
  matter_id: string;
  user_id: string;
  role: "counsel" | "client" | "observer";
  added_at: string;
  user?: {
    email: string;
    display_name?: string;
  };
}

export interface AddParticipantInput {
  email: string;
  role: "counsel" | "client" | "observer";
}

export interface UpdateParticipantInput {
  role: "counsel" | "client" | "observer";
}

interface UseParticipantsOptions {
  matterId: string;
}

export function useParticipants({ matterId }: UseParticipantsOptions) {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = createClient();

  const fetchParticipants = React.useCallback(async () => {
    if (!matterId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("matter_participants")
        .select(
          `
          id,
          matter_id,
          user_id,
          role,
          added_at,
          profiles:user_id (
            email,
            display_name
          )
        `,
        )
        .eq("matter_id", matterId)
        .order("added_at", { ascending: true });

      if (fetchError) throw fetchError;

      // Transform the data to flatten the profiles
      const transformedData = (data || []).map((p: any) => ({
        ...p,
        user: p.profiles
          ? {
              email: p.profiles.email,
              display_name: p.profiles.display_name,
            }
          : undefined,
        profiles: undefined,
      }));

      setParticipants(transformedData);
    } catch (err: any) {
      setError(err.message || "Failed to load participants");
      toast.error("Failed to load participants");
    } finally {
      setIsLoading(false);
    }
  }, [matterId, supabase]);

  React.useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Subscribe to real-time changes
  React.useEffect(() => {
    if (!matterId) return;

    const channel = supabase
      .channel(`participants:${matterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matter_participants",
          filter: `matter_id=eq.${matterId}`,
        },
        () => {
          // Refetch on any change to get the user data
          fetchParticipants();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matterId, supabase, fetchParticipants]);

  const addParticipant = async (
    input: AddParticipantInput,
  ): Promise<boolean> => {
    try {
      // First, look up the user by email
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", input.email)
        .single();

      if (userError || !userData) {
        toast.error("User not found with that email address");
        return false;
      }

      // Check if already a participant
      const existing = participants.find((p) => p.user_id === userData.id);
      if (existing) {
        toast.error("This user is already a participant");
        return false;
      }

      const { error: insertError } = await supabase
        .from("matter_participants")
        .insert({
          matter_id: matterId,
          user_id: userData.id,
          role: input.role,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("This user is already a participant");
        } else {
          throw insertError;
        }
        return false;
      }

      toast.success("Participant added successfully");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to add participant");
      return false;
    }
  };

  const updateParticipant = async (
    participantId: string,
    input: UpdateParticipantInput,
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("matter_participants")
        .update({ role: input.role })
        .eq("id", participantId);

      if (updateError) throw updateError;

      toast.success("Participant role updated");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to update participant");
      return false;
    }
  };

  const removeParticipant = async (participantId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("matter_participants")
        .delete()
        .eq("id", participantId);

      if (deleteError) throw deleteError;

      toast.success("Participant removed");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to remove participant");
      return false;
    }
  };

  return {
    participants,
    isLoading,
    error,
    addParticipant,
    updateParticipant,
    removeParticipant,
    refetch: fetchParticipants,
  };
}
