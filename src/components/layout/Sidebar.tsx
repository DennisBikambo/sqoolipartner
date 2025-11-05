'use client';

import { 
  Home, 
  Megaphone, 
  Wallet, 
  FileText, 
  Users, 
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '../ui/sidebar';
import { cn } from '../../lib/utils';

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

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border transition-all duration-300",
        "w-[72px] min-w-[72px]" 
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border p-4" />

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="space-y-6 items-center">
          {navigationItems.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeItem;
            return (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  onClick={() => onSelect?.(id)}
                  isActive={isActive}
                  tooltip={label}
                  className={cn(
                    "h-10 w-full justify-center",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu className="space-y-2 items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onSelect?.('settings')}
              isActive={activeItem === 'settings'}
              tooltip="Settings"
              className={cn(
                "h-10 w-full justify-center",
                activeItem === 'settings' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
