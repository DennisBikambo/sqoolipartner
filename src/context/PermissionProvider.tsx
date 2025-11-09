// PermissionProvider.tsx
import type { ReactNode } from "react";
import { PermissionContext, type Permission } from "./PermissionContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import type { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect, useMemo } from "react";
import { isConvexUser, type Partner } from "../types/auth.types";

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, partner, loading: authLoading, loginMethod } = useAuth();
  const [userPermissionIds, setUserPermissionIds] = useState<Id<"permissions">[]>([]);

  // Load permission IDs from user or partner
  useEffect(() => {
    if (loginMethod === "convex" && isConvexUser(user)) {
      setUserPermissionIds(user.permission_ids ?? []);
    } else if (loginMethod === "laravel" && partner) {
      setUserPermissionIds((partner as Partner).permission_ids ?? []);
    } else {
      setUserPermissionIds([]);
    }
  }, [user, partner, loginMethod]);

  // Fetch permission objects from Convex
  const rawPermissions = useQuery(
    api.permission.getPermissionsByIds,
    userPermissionIds.length > 0 ? { permission_ids: userPermissionIds } : "skip"
  );

  const permissions: Permission[] = useMemo(() => {
    if (!rawPermissions) return [];

    // Ensure _id exists to match Permission type
    return rawPermissions
      .filter(
        (p): p is { _id: Id<"permissions">; _creationTime?: number } & typeof p =>
          Boolean(p?._id)
      )
      .map((p) => ({
        ...p,
        _id: p._id,
        created_at: new Date(p._creationTime ?? Date.now()).toISOString(),
      }));
  }, [rawPermissions]);

  const loading = authLoading || (userPermissionIds.length > 0 && rawPermissions === undefined);

  // Check if user has exact permission by key
  const hasPermission = (permissionKey: string): boolean => {
    return permissions.some((p) => p.key === permissionKey);
  };

  // Check if user has exact level in a category
  const hasLevel = (level: "read" | "write" | "admin" | "full"): boolean => {
    return permissions.some((p) => p.level === level);
  };

  // Check if user has permission in a category
  const hasCategory = (category: string): boolean => {
    return permissions.some((p) => p.category === category);
  };

  // Strict read/write checks
  const canRead = (category: string): boolean => {
    return permissions.some((p) => p.category === category && p.level === "read");
  };

  const canWrite = (category: string): boolean => {
    return permissions.some((p) => p.category === category && p.level === "write");
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions: permissions.length > 0 ? permissions : null,
        hasPermission,
        hasCategory,
        hasLevel,
        canRead,
        canWrite,
        loading,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}
