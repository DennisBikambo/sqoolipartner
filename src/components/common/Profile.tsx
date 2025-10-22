import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useAuth } from "../../hooks/useAuth";
import CreateCampaignWizard from "./CreateCampaign";

export default function Profile() {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <>
      <Card className="border border-muted">
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {user?.name || "Partner"}
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
            >
              Create Campaign Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog-based wizard modal */}
      <div>
          {user?._id && (
            <CreateCampaignWizard
              partnerId={user._id}
              open = {showWizard}
              onClose={() => setShowWizard(false)}
            />
          )}
     </div>
    </>
  );
}
