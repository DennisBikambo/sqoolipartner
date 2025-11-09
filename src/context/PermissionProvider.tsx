import type { ReactNode } from "react";
import { PermissionContext, type Permission } from "./PermissionContext";
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../hooks/useAuth';
import type { Id } from '../../convex/_generated/dataModel';
import { useState, useEffect, useMemo } from 'react';

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, partner, loading: authLoading, loginMethod } = useAuth();
  const [userPermissionIds, setUserPermissionIds] = useState<Id<'permissions'>[]>([]);

  // 🧩 Extract permission IDs from user or partner
  useEffect(() => {
    const hasPermissionIds = (obj: unknown): obj is { permission_ids: Id<'permissions'>[] } => {
      if (typeof obj !== 'object' || obj === null) return false;
      return (
        'permission_ids' in obj &&
        Array.isArray((obj as { permission_ids?: unknown }).permission_ids)
      );
    };

    if (loginMethod === 'convex' && user && hasPermissionIds(user)) {
      setUserPermissionIds(user.permission_ids);
    } else if (loginMethod === 'laravel' && partner && hasPermissionIds(partner)) {
      setUserPermissionIds(partner.permission_ids);
    } else {
      setUserPermissionIds([]);
    }
  }, [user, partner, loginMethod]);

  // 🧠 Fetch all permissions belonging to this user
  const rawPermissions = useQuery(
    api.permission.getPermissionsByIds,
    userPermissionIds.length > 0 ? { permission_ids: userPermissionIds } : "skip"
  );

  const permissions: Permission[] = useMemo(() => {
    if (!rawPermissions) return [];

    // Narrow type to ensure _id exists on each permission before mapping
    const hasId = (p: typeof rawPermissions[number]): p is typeof p & { _id: Id<'permissions'> } =>
      p?._id !== undefined && p?._id !== null;

    return rawPermissions
      .filter(hasId)
      .map((p) => ({
        ...p,
        _id: p._id,
        created_at: new Date(p._creationTime ?? Date.now()).toISOString(),
      }));
  }, [rawPermissions]);

  const loading = authLoading || (userPermissionIds.length > 0 && rawPermissions === undefined);

  // ✅ Permission checking helpers (now works with arrays)
  const hasPermission = (permissionKey: string): boolean => {
    if (!permissions.length) return false;
    return permissions.some(
      (p) => p.key === 'admin.all.access' || p.level === 'full' || p.key === permissionKey
    );
  };

  const hasCategory = (category: string): boolean => {
    if (!permissions.length) return false;
    return permissions.some(
      (p) => p.key === 'admin.all.access' || p.level === 'full' || p.category === category
    );
  };

  const hasLevel = (level: 'read' | 'write' | 'admin' | 'full'): boolean => {
    if (!permissions.length) return false;
    const levelHierarchy = { read: 1, write: 2, admin: 3, full: 4 };
    return permissions.some((p) => {
      const userLevel = levelHierarchy[p.level as keyof typeof levelHierarchy] || 0;
      const requiredLevel = levelHierarchy[level];
      return userLevel >= requiredLevel;
    });
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions: permissions.length > 0 ? permissions : null,
        hasPermission,
        hasCategory,
        hasLevel,
        loading,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}
