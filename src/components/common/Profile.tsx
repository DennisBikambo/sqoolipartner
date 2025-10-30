import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { getDisplayName, getUserInitials } from "../../types/auth.types";
import CreateCampaignWizard from "./CreateCampaign";

export default function Profile() {
  const { user, partner } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  // Get display name and initials using helper functions
  const displayName = getDisplayName(partner || user);
  const initials = getUserInitials(partner || user);
  const partnerId = partner?._id;

  return (
    <>
      <Card className="border border-muted">
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {displayName || "Partner"}
              </h3>
              <Badge variant="outline" className="text-primary">
                Media Partner
              </Badge>
            </div>
          </div>

          <div className="mt-4">
            <Button
              className="w-full"
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