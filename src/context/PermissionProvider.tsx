// PermissionProvider.tsx
import type { ReactNode } from "react";
import { PermissionContext, type Permission, type UserRole } from "./PermissionContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import type { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect, useMemo } from "react";
import { isConvexUser, type Partner } from "../types/auth.types";

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, partner, loading: authLoading, loginMethod } = useAuth();
  const [userPermissionIds, setUserPermissionIds] = useState<Id<"permissions">[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Load permission IDs and role from user or partner
  useEffect(() => {
    if (loginMethod === "convex" && isConvexUser(user)) {
      setUserPermissionIds(user.permission_ids ?? []);
      setUserRole(user.role as UserRole);
    } else if (loginMethod === "laravel" && partner) {
      setUserPermissionIds((partner as Partner).permission_ids ?? []);
      setUserRole((partner as Partner).role as UserRole);
    } else {
      setUserPermissionIds([]);
      setUserRole(null);
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

  // Check if user is super admin (has full access)
  const isSuperAdmin = (): boolean => {
    return userRole === "super_admin" || permissions.some((p) => p.category === "all_access" || p.level === "full");
  };

  // Check if user has exact permission by key
  const hasPermission = (permissionKey: string): boolean => {
    if (isSuperAdmin()) return true;
    return permissions.some((p) => p.key === permissionKey);
  };

  // Check if user has exact level in a category
  const hasLevel = (level: "read" | "write" | "admin" | "full"): boolean => {
    if (isSuperAdmin()) return true;
    return permissions.some((p) => p.level === level);
  };

  // Check if user has permission in a category
  const hasCategory = (category: string): boolean => {
    if (isSuperAdmin()) return true;
    return permissions.some((p) => p.category === category);
  };

  // Strict read/write checks
  const canRead = (category: string): boolean => {
    if (isSuperAdmin()) return true;
    return permissions.some((p) => p.category === category && p.level === "read");
  };

  const canWrite = (category: string): boolean => {
    if (isSuperAdmin()) return true;
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
        isSuperAdmin,
        loading,
        userRole,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}