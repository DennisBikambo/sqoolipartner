import type { ReactNode } from "react";
import { PermissionContext, type Permission } from "./PermissionContext";
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../hooks/useAuth';
import type { Id } from '../../convex/_generated/dataModel';
import { useState, useEffect } from 'react';

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, partner, loading: authLoading, loginMethod } = useAuth();
  const [userPermissionId, setUserPermissionId] = useState<Id<'permissions'> | null>(null);

  // Set permission ID once auth data is available
  useEffect(() => {
    const hasPermissionId = (obj: unknown): obj is { permission_id: Id<'permissions'> } => {
      if (typeof obj !== 'object' || obj === null) return false;
      return 'permission_id' in obj && typeof (obj as { permission_id?: unknown }).permission_id === 'string';
    };

    if (loginMethod === 'convex' && user && hasPermissionId(user)) {
      setUserPermissionId(user.permission_id);
    } else if (loginMethod === 'laravel' && partner && hasPermissionId(partner)) {
      setUserPermissionId(partner.permission_id);
    }
  }, [user, partner, loginMethod]);

  const rawPermission = useQuery(
    api.permission.getPermissionById,
    userPermissionId ? { permission_id: userPermissionId } : "skip"
  );
  const permission: Permission | undefined | null = rawPermission ? {
    ...rawPermission,
    created_at: new Date(rawPermission._creationTime).toISOString()
  } : rawPermission;

  const loading = authLoading || (!!userPermissionId && permission === undefined);

  const hasPermission = (permissionKey: string): boolean => {
    if (!permission) return false;
    if (permission.key === 'admin.all.access' || permission.level === 'full') return true;
    return permission.key === permissionKey;
  };

  const hasCategory = (category: string): boolean => {
    if (!permission) return false;
    if (permission.key === 'admin.all.access' || permission.level === 'full') return true;
    return permission.category === category;
  };

  const hasLevel = (level: 'read' | 'write' | 'admin' | 'full'): boolean => {
    if (!permission) return false;
    const levelHierarchy = { read: 1, write: 2, admin: 3, full: 4 };
    const userLevel = levelHierarchy[permission.level as keyof typeof levelHierarchy] || 0;
    const requiredLevel = levelHierarchy[level];
    return userLevel >= requiredLevel;
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions: permission || null,
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
