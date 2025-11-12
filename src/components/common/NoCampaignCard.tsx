"use client";

import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { isConvexUser } from "../../types/auth.types";
import CreateCampaignWizard from "./CreateCampaign";

interface NoCampaignCardProps {
  title?: string;
  message?: string;
}

export const NoCampaignCard: React.FC<NoCampaignCardProps> = ({
  title = "No Campaigns Yet",
  message = "You don't have any active campaigns yet. Create one to get started.",
}) => {
  const { partner, user } = useAuth();
  const [openWizard, setOpenWizard] = useState(false);

  // Only show wizard if we have a Convex user (with _id)
  if (openWizard && partner?._id && user && isConvexUser(user)) {
    return (
      <Card className="border border-[var(--color-border)] shadow-md p-6 relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4"
          onClick={() => setOpenWizard(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <CreateCampaignWizard
          partnerId={partner._id}
          user_id={user._id}
          open={openWizard}
          onClose={() => setOpenWizard(false)}
        />
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] shadow-sm">
      <CardContent className="text-center py-10">
        <h2 className="text-lg font-semibold mb-2 text-[var(--color-primary)]">
          {title}
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-4">{message}</p>

        <Button
          onClick={() => setOpenWizard(true)}
          className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-accent)]"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Campaign
        </Button>
      </CardContent>
    </Card>
  );
};
