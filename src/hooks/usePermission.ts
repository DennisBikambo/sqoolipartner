import { useContext } from "react";
import { PermissionContext } from "../context/PermissionContext";

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}