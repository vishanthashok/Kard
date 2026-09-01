"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CreateRewardRequest } from "@/lib/api-types";

interface RewardFormProps {
  merchantId: string;
  isSubmitting: boolean;
  onSubmit: (request: CreateRewardRequest) => Promise<void>;
  onCancel: () => void;
}

/** Create-a-reward form. Nothing is persisted until the API exists. */
export function RewardForm({
  merchantId,
  isSubmitting,
  onSubmit,
  onCancel,
}: RewardFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; points?: string }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const pointsRequired = Number.parseInt(points, 10);
    const nextErrors: { name?: string; points?: string } = {};
    if (name.trim().length === 0) nextErrors.name = "Give the reward a name.";
    if (!Number.isInteger(pointsRequired) || pointsRequired <= 0) {
      nextErrors.points = "Enter how many points it costs.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      merchantId,
      name,
      description,
      pointsRequired,
      isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="reward-name">Reward Name</Label>
        <Input
          id="reward-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Free Drink"
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name ? "reward-name-error" : undefined}
        />
        {errors.name ? (
          <p id="reward-name-error" role="alert" className="text-sm text-destructive">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reward-description">Description</Label>
        <Textarea
          id="reward-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Any drink on the menu, any size."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reward-points">Points Required</Label>
        <Input
          id="reward-points"
          inputMode="numeric"
          value={points}
          onChange={(event) => setPoints(event.target.value.replace(/[^0-9]/g, ""))}
          placeholder="100"
          aria-invalid={errors.points !== undefined}
          aria-describedby={errors.points ? "reward-points-error" : undefined}
        />
        {errors.points ? (
          <p id="reward-points-error" role="alert" className="text-sm text-destructive">
            {errors.points}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
        <div>
          <Label htmlFor="reward-active">Active</Label>
          <p className="text-sm text-muted-foreground">
            Customers can redeem this reward right away.
          </p>
        </div>
        <Switch id="reward-active" checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-10 px-4"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" className="h-10 px-4" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Reward"
          )}
        </Button>
      </div>
    </form>
  );
}
