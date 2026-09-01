"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPoints } from "@/lib/format";
import type { Reward } from "@/lib/api-types";

interface RedeemRewardDialogProps {
  reward: Reward;
  customerName: string;
  pointsBalance: number;
  disabled?: boolean;
  /** Resolves once the (simulated) redemption finishes. */
  onConfirm: (reward: Reward) => Promise<void>;
}

/** "Redeem Free Drink?" confirmation shown from the scanned customer screen. */
export function RedeemRewardDialog({
  reward,
  customerName,
  pointsBalance,
  disabled = false,
  onConfirm,
}: RedeemRewardDialogProps) {
  const [open, setOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  async function handleConfirm() {
    setIsRedeeming(true);
    try {
      await onConfirm(reward);
      setOpen(false);
    } finally {
      setIsRedeeming(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size="lg" className="h-10 w-full px-4 sm:w-auto">
          Redeem
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Redeem {reward.name}?</DialogTitle>
          <DialogDescription>
            {formatPoints(reward.pointsRequired)} points will be used.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="font-medium">{customerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Balance after</dt>
            <dd className="font-medium tabular-nums">
              {formatPoints(Math.max(0, pointsBalance - reward.pointsRequired))} points
            </dd>
          </div>
        </dl>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg" className="h-10 px-4" disabled={isRedeeming}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="lg" className="h-10 px-4" onClick={handleConfirm} disabled={isRedeeming}>
            {isRedeeming ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Redeeming…
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
