// Profile.tsx
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { getDisplayName, getUserInitials } from "../../types/auth.types";
import CreateCampaignWizard from "./CreateCampaign";
import { Loading } from "./Loading";

export default function Profile() {
  const { user, partner } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  // Get display name and initials using helper functions
  const displayName = getDisplayName(partner || user);
  const initials = getUserInitials(partner || user);
  const partnerId = partner?._id;

  // Show loading state while partner data is being fetched
  if (!partner && !user) {
    return (
      <Card className="border border-muted">
        <CardContent className="py-8">
          <Loading
            message="Loading profile..."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-muted">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0">
              <AvatarFallback className="text-base sm:text-lg">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                {displayName || "Partner"}
              </h3>
              <Badge variant="outline" className="text-primary mt-1 text-xs">
                Media Partner
              </Badge>
            </div>
          </div>

          <div className="mt-4">
            <Button
              className="w-full text-sm sm:text-base"
              variant="default"
              onClick={() => setShowWizard(true)}
              disabled={!partnerId}
            >
              Create Campaign Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog-based wizard modal */}
      {partnerId && (
        <CreateCampaignWizard
          partnerId={partnerId}
          open={showWizard}
          onClose={() => setShowWizard(false)}
        />
      )}
    </>
  );
}