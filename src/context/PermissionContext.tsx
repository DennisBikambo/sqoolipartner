import { createContext } from 'react';
import type { Id } from '../../convex/_generated/dataModel';

export interface Permission {
  _id: Id<'permissions'>;
  key: string;
  name: string;
  description: string;
  category: string;
  level: string;
  is_default: boolean;
  created_at: string;
}

export interface PermissionContextType {
  permissions: Permission[] | null;
  hasPermission: (permissionKey: string) => boolean;
  hasCategory: (category: string) => boolean;
  hasLevel: (level: 'read' | 'write' | 'admin' | 'full') => boolean;
  loading: boolean;
}

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);
