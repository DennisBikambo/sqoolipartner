"use client";
import { Alert,AlertTitle,AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

interface PermissionRefreshBannerProps {
  onRefresh: () => void;
}

export default function PermissionRefreshBanner({ onRefresh }: PermissionRefreshBannerProps) {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl">
      <Alert className="flex items-center justify-between shadow-lg">
        <div>
          <AlertTitle>Permissions Updated</AlertTitle>
          <AlertDescription>
            Your permissions have changed. Please refresh the page.
          </AlertDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </Alert>
    </div>
  );
}
