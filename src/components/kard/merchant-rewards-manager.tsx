"use client";

import { useState } from "react";
import { Gift, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/kard/empty-state";
import { Panel } from "@/components/kard/panel";
import { RewardForm } from "@/components/kard/reward-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createReward } from "@/lib/api-client";
import { KardApiError, type CreateRewardRequest, type Reward } from "@/lib/api-types";
import { formatPoints } from "@/lib/format";

interface MerchantRewardsManagerProps {
  merchantId: string;
  initialRewards: Reward[];
}

/**
 * Active/inactive reward lists plus the create form.
 *
 * Created rewards live in component state only — `createReward()` does not
 * persist anything until the Kard API is connected.
 */
export function MerchantRewardsManager({
  merchantId,
  initialRewards,
}: MerchantRewardsManagerProps) {
  const [rewards, setRewards] = useState(initialRewards);
  const [isCreating, setIsCreating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const active = rewards.filter((reward) => reward.isActive);
  const inactive = rewards.filter((reward) => !reward.isActive);

  async function handleCreate(request: CreateRewardRequest) {
    setIsCreating(true);
    try {
      const reward = await createReward(request);
      setRewards((current) => [...current, reward]);
      setIsFormOpen(false);
      toast.success(`${reward.name} created`, {
        description: "Not saved yet — rewards persist once the API is connected.",
      });
    } catch (error) {
      toast.error(
        error instanceof KardApiError ? error.message : "Could not create that reward.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Rewards</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            What your customers can redeem their points for.
          </p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-10 px-4">
              <Plus aria-hidden />
              Create Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Reward</DialogTitle>
              <DialogDescription>
                Set what customers get and how many points it takes.
              </DialogDescription>
            </DialogHeader>
            <RewardForm
              merchantId={merchantId}
              isSubmitting={isCreating}
              onSubmit={handleCreate}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </header>

      <Panel title="Active Rewards" description={`${active.length} live right now`}>
        {active.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No active rewards"
            description="Create your first reward so customers have something to work toward."
            action={
              <Button className="h-10 px-4" onClick={() => setIsFormOpen(true)}>
                <Plus aria-hidden />
                Create Reward
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {active.map((reward) => (
              <RewardListItem key={reward.id} reward={reward} />
            ))}
          </ul>
        )}
      </Panel>

      {inactive.length > 0 ? (
        <Panel title="Inactive" description="Hidden from customers.">
          <ul className="divide-y divide-border/70">
            {inactive.map((reward) => (
              <RewardListItem key={reward.id} reward={reward} />
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function RewardListItem({ reward }: { reward: Reward }) {
  return (
    <li className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-medium">{reward.name}</p>
        {reward.description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{reward.description}</p>
        ) : null}
      </div>
      <p className="shrink-0 text-sm font-medium tabular-nums">
        {formatPoints(reward.pointsRequired)} points
      </p>
    </li>
  );
}
