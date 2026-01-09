"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Shield,
  Eye,
  Briefcase,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useParticipants,
  type Participant,
  type AddParticipantInput,
} from "@/hooks/use-participants";

const addParticipantSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["counsel", "client", "observer"]),
});

type AddParticipantFormData = z.infer<typeof addParticipantSchema>;

const roleConfig = {
  counsel: {
    label: "Counsel",
    icon: Briefcase,
    description: "Full access to view, upload, and manage documents",
    color: "text-stone-700 dark:text-stone-300",
    bgColor: "bg-stone-200 dark:bg-stone-700",
  },
  client: {
    label: "Client",
    icon: Users,
    description: "Can view and upload documents",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  observer: {
    label: "Observer",
    icon: Eye,
    description: "View-only access to documents",
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
  },
};

interface ParticipantsManagerProps {
  matterId: string;
  isOwner: boolean;
  onClose?: () => void;
}

export function ParticipantsManager({
  matterId,
  isOwner,
  onClose,
}: ParticipantsManagerProps) {
  const {
    participants,
    isLoading,
    addParticipant,
    updateParticipant,
    removeParticipant,
  } = useParticipants({ matterId });

  const [isAddingParticipant, setIsAddingParticipant] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddParticipantFormData>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      role: "observer",
    },
  });

  const onSubmit = async (data: AddParticipantFormData) => {
    setIsSubmitting(true);
    const success = await addParticipant(data as AddParticipantInput);
    setIsSubmitting(false);
    if (success) {
      reset();
      setIsAddingParticipant(false);
    }
  };

  const handleRemove = async (participant: Participant) => {
    setRemovingId(participant.id);
    await removeParticipant(participant.id);
    setRemovingId(null);
  };

  const handleRoleChange = async (
    participant: Participant,
    newRole: "counsel" | "client" | "observer",
  ) => {
    await updateParticipant(participant.id, { role: newRole });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-stone-200 p-2 dark:bg-stone-700">
            <Shield className="h-5 w-5 text-stone-700 dark:text-stone-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Participants</h2>
            <p className="text-muted-foreground text-sm">
              {participants.length} participant
              {participants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Participants List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : participants.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <Users className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No participants added yet
            </p>
          </div>
        ) : (
          participants.map((participant) => {
            const config = roleConfig[participant.role];
            const RoleIcon = config.icon;

            return (
              <div
                key={participant.id}
                className="bg-card flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-full p-2", config.bgColor)}>
                    <RoleIcon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {participant.user?.display_name ||
                        participant.user?.email ||
                        "Unknown User"}
                    </p>
                    {participant.user?.display_name && (
                      <p className="text-muted-foreground text-sm">
                        {participant.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <>
                      <select
                        value={participant.role}
                        onChange={(e) =>
                          handleRoleChange(
                            participant,
                            e.target.value as "counsel" | "client" | "observer",
                          )
                        }
                        className="border-input bg-background ring-offset-background focus:ring-ring h-9 rounded-md border px-3 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                      >
                        <option value="counsel">Counsel</option>
                        <option value="client">Client</option>
                        <option value="observer">Observer</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(participant)}
                        disabled={removingId === participant.id}
                      >
                        {removingId === participant.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="text-destructive h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        config.bgColor,
                        config.color,
                      )}
                    >
                      {config.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Participant Form */}
      {isOwner && (
        <div>
          {isAddingParticipant ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="bg-card rounded-lg border p-4">
                <div className="mb-4 flex items-center gap-2">
                  <UserPlus className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">Add Participant</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@firm.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      {...register("role")}
                      className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                    >
                      <option value="counsel">Counsel - Full access</option>
                      <option value="client">Client - View & upload</option>
                      <option value="observer">Observer - View only</option>
                    </select>
                    {errors.role && (
                      <p className="text-destructive text-sm">
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingParticipant(false);
                        reset();
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Participant
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingParticipant(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Participant
            </Button>
          )}
        </div>
      )}

      {/* Role Legend */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <p className="mb-3 text-sm font-medium">Role Permissions</p>
        <div className="space-y-2">
          {Object.entries(roleConfig).map(([role, config]) => {
            const RoleIcon = config.icon;
            return (
              <div
                key={role}
                className="flex items-start gap-2 text-sm"
              >
                <RoleIcon className={cn("mt-0.5 h-4 w-4", config.color)} />
                <div>
                  <span className="font-medium">{config.label}:</span>{" "}
                  <span className="text-muted-foreground">
                    {config.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { ParticipantsManagerProps };
