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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface AppSidebarProps {
  activeItem?: string;
  onSelect?: (id: string) => void;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'programs', label: 'Programs', icon: LayoutGrid },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ 
  activeItem = 'dashboard',
  onSelect
}: AppSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect?.(id);
    setIsMobileMenuOpen(false);
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
            {navigationItems.map(({ id, label, icon: Icon }) => {
              const isActive = id === activeItem;
              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 w-full py-2.5 px-2 rounded-md transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                  title={label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight text-center">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
