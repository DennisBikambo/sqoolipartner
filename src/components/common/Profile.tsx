'use client';

import { useState } from "react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { getDisplayName, getUserInitials, isConvexUser } from "../../types/auth.types";
import CreateCampaignWizard from "./CreateCampaign";
import { Loading } from "./Loading";

export default function Profile() {
  const { user, partner } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  const displayName = getDisplayName(partner || user);
  const initials = getUserInitials(partner || user);
  const partnerId = partner?._id;
  const userId = user && isConvexUser(user) ? user._id : undefined;

  if (!partner && !user) {
    return (
      <Card className="rounded-xl p-6 space-y-4 border border-border bg-card">
        <div className="flex justify-center items-center h-20">
          <Loading message="Loading profile..." size="sm" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl overflow-hidden border-0 shadow-sm text-primary-foreground animate-fadeIn h-fit">
        {/* --- Top Section (Blue Gradient Header) --- */}
        <div className="relative p-8 pb-12 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground rounded-t-2xl">
          {/* Curved bottom overlay for same Wallet aesthetic */}
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-primary/40 to-transparent rounded-t-[2rem]" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="h-20 w-20 border-2 border-primary-foreground/20 shadow-lg">
              <AvatarFallback className="text-xl font-semibold bg-primary-foreground/20 text-primary-foreground">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-semibold">{displayName || "Partner"}</h3>
              <Badge
                variant="outline"
                className="mt-2 text-primary-foreground/90 border-primary-foreground/40 text-xs sm:text-sm"
              >
                Media Partner
              </Badge>
            </div>
          </div>
        </div>

        {/* --- Bottom Section (Muted / White area) --- */}
        <div className="bg-background/90 text-foreground/90 p-6 space-y-6">
          {/* Info Section */}
          <div className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-inner space-y-2">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
              Account Information
            </h4>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">Name:</p>
              <p className="font-medium">{displayName || "—"}</p>

              <p className="text-muted-foreground">Role:</p>
              <p className="font-medium capitalize">{partner?.role || "Media Partner"}</p>
            </div>
          </div>

          {/* Button Section */}
          <div>
            <Button
              className="w-full sm:w-auto bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90"
              onClick={() => setShowWizard(true)}
              disabled={!partnerId}
            >
              Create Campaign Link
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Campaign Modal */}
      {partnerId && userId && (
        <CreateCampaignWizard
          partnerId={partnerId}
          user_id={userId}
          open={showWizard}
          onClose={() => setShowWizard(false)}
        />
      )}
    </>
  );
}
