'use client';

import { 
  Home, 
  Megaphone, 
  Wallet, 
  FileText, 
  Users, 
  Settings,
  ChevronLeft,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '../ui/sidebar';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';

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
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
];

export function AppSidebar({ 
  activeItem = 'dashboard',
  onSelect
}: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [forcedCollapsed, setForcedCollapsed] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force collapse on mobile and prevent expansion
  useEffect(() => {
    if (isMobile) {
      setForcedCollapsed(true);
    } else {
      setForcedCollapsed(false);
    }
  }, [isMobile]);

  const isCollapsed = forcedCollapsed || state === 'collapsed';

  return (
    <Sidebar
      collapsible={isMobile ? "none" : "icon"}
      className={cn(
        "border-r border-sidebar-border transition-all duration-300",
        isCollapsed && "w-[72px] min-w-[72px]"
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 shrink-0"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  isCollapsed && "rotate-180"
                )}
              />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className={`space-y-2 ${isCollapsed ? 'items-center' : ''}`} >
          {navigationItems.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeItem;
            return (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  onClick={() => onSelect?.(id)}
                  isActive={isActive}
                  tooltip={label}
                  className={cn(
                    "h-10 gap-3",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{label}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu className={`space-y-2 ${isCollapsed ? 'items-center' : ''}`}>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onSelect?.('settings')}
              isActive={activeItem === 'settings'}
              tooltip="Settings"
              className={cn(
                "h-10 gap-3",
                activeItem === 'settings' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">Settings</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}