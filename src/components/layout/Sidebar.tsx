'use client';

import { 
  Home, 
  Megaphone, 
  Wallet, 
  Users, 
  Settings,
  Menu,
  X,
  LayoutGrid,
  Lock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { usePermissions } from '../../hooks/usePermission';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  requiredPermission?: string; 
  requiredCategory?: string;   
}

interface AppSidebarProps {
  activeItem?: string;
  onSelect?: (id: string) => void;
}

const navigationItems: NavItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: Home,
    requiredCategory: 'dashboard',
  },
  { 
    id: 'campaigns', 
    label: 'Campaigns', 
    icon: Megaphone,
    requiredCategory: 'campaigns',
  },
  { 
    id: 'programs', 
    label: 'Programs', 
    icon: LayoutGrid,
    requiredCategory: 'programs',
  },
  { 
    id: 'wallet', 
    label: 'Wallet', 
    icon: Wallet,
    requiredCategory: 'wallet',
  },
  { 
    id: 'users', 
    label: 'Users', 
    icon: Users,
    requiredCategory: 'users',
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings,
    requiredCategory: 'settings',
  },
];

export function AppSidebar({ 
  activeItem = 'dashboard',
  onSelect
}: AppSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hasPermission, hasCategory, permissions, loading } = usePermissions();

  // Debug: Log the current permission
  console.log('Current User Permissions:', permissions);


  const handleSelect = (id: string, isLocked: boolean) => {
    if (isLocked) {
      alert('This feature is locked. Contact your administrator for access.');
      return;
    }
    onSelect?.(id);
    setIsMobileMenuOpen(false);
  };

  const checkAccess = (item: NavItem): boolean => {
    // If still loading permissions, deny access temporarily
    if (loading || !permissions) return false;

    if (permissions.key === 'admin.all.access' || permissions.level === 'full') return true;
    if (item.requiredPermission && hasPermission(item.requiredPermission)) return true;
    if (item.requiredCategory && hasCategory(item.requiredCategory)) return true;

    return false;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-lg bg-background/90 border border-border shadow-md backdrop-blur-md"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Overlay background for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          "bg-background border border-border rounded-2xl shadow-lg backdrop-blur-md",
          "overflow-hidden flex flex-col",
          // desktop position
          "lg:top-20 lg:left-4 lg:w-[110px] lg:h-[calc(100vh-6rem)]",
          // mobile centered overlay
          isMobileMenuOpen 
            ? "top-1/2 left-1/2 w-[85%] max-w-[360px] h-auto -translate-x-1/2 -translate-y-1/2 p-4"
            : "translate-x-[-150%] lg:translate-x-0"
        )}
      >
        <nav className="flex flex-col justify-center gap-4 lg:justify-between lg:h-full">
          <div className="flex flex-col gap-4">
            {navigationItems.map(({ id, label, icon: Icon, ...permissionReq }) => {
              const isActive = id === activeItem;
              const hasAccess = checkAccess({ id, label, icon: Icon, ...permissionReq });
              const isLocked = !hasAccess;

              // Debug log for campaigns specifically
              if (id === 'campaigns') {
                console.log('Campaigns Access Check:', {
                  hasAccess,
                  isLocked,
                  permission: permissions,
                  category: permissions?.category
                });
              }

              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id, isLocked)}
                  disabled={isLocked}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 w-full py-2.5 px-2 rounded-md transition-all",
                    isActive && !isLocked && "text-primary bg-primary/10",
                    !isActive && !isLocked && "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    isLocked && "text-muted-foreground/40 cursor-not-allowed opacity-50"
                  )}
                  title={isLocked ? `${label} (Locked)` : label}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 shrink-0" />
                    {isLocked && (
                      <Lock className="absolute -top-1 -right-1 h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-center">
                    {label}
                  </span>
                  {isLocked && (
                    <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] rounded-md" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}