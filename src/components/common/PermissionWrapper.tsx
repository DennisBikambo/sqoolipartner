'use client';

import type { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermission';
import { LockedButton, LockedTab, LockedMessage } from './PermissionFallbacks';

interface PermissionWrapperProps {
  permissionKey?: string;
  category?: string;
  level?: 'read' | 'write' | 'admin' | 'full';
  requireRead?: string; 
  requireWrite?: string; 
  children: ReactNode;
  fallback?: ReactNode | 'button' | 'tab' | 'message';
  fallbackProps?: {
    buttonText?: string;
    buttonVariant?: 'default' | 'outline' | 'ghost';
    buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
    tabTitle?: string;
    tabDescription?: string;
    permissionNeeded?: string;
    messageText?: string;
    messageSize?: 'sm' | 'md' | 'lg';
  };
}

export function PermissionWrapper({
  permissionKey,
  category,
  level = 'read',
  requireRead,
  requireWrite,
  children,
  fallback = null,
  fallbackProps = {},
}: PermissionWrapperProps) {
  const { hasPermission, hasCategory, hasLevel, canRead, canWrite, isSuperAdmin, loading } = usePermissions();

  if (loading) return null;

  // Super admin always has access - bypass all permission checks
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  let hasAccess = false;

  // Check by specific permission key
  if (permissionKey) {
    hasAccess = hasPermission(permissionKey);
  }
  // Check by category + level
  else if (category) {
    hasAccess = hasCategory(category) && hasLevel(level);
  }
  // Check using canRead shorthand
  else if (requireRead) {
    hasAccess = canRead(requireRead);
  }
  // Check using canWrite shorthand
  else if (requireWrite) {
    hasAccess = canWrite(requireWrite);
  }

  if (!hasAccess) {
    // Use pre-built fallbacks based on type
    if (fallback === 'button') {
      return (
        <LockedButton 
          text={fallbackProps.buttonText}
          variant={fallbackProps.buttonVariant}
          size={fallbackProps.buttonSize}
        />
      );
    }
    
    if (fallback === 'tab') {
      return (
        <LockedTab 
          title={fallbackProps.tabTitle}
          description={fallbackProps.tabDescription}
          permissionNeeded={fallbackProps.permissionNeeded}
        />
      );
    }
    
    if (fallback === 'message') {
      return (
        <LockedMessage 
          message={fallbackProps.messageText}
          size={fallbackProps.messageSize}
        />
      );
    }

    // Use custom fallback if provided
    return <>{fallback}</>;
  }

  return <>{children}</>;
}