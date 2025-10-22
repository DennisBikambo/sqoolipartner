// components/layout/DashboardLayout.tsx
'use client';
import { AppSidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';
import { SidebarProvider } from '../ui/sidebar';

interface User {
  name: string;
  email?: string;
  avatar?: string;
  role: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
  title?: string;
  subtitle?: string;
  user?: User;
  onSelect?: (id: string) => void;   
}

export function DashboardLayout({ 
  children, 
  activeItem = 'dashboard',
  title = 'Dashboard',
  subtitle,
  onSelect,   
}: DashboardLayoutProps) {


  return (
    
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <SidebarProvider>
      <AppSidebar 
        activeItem={activeItem} 
        onSelect={onSelect}   
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className={cn("flex-1 overflow-y-auto bg-muted/30 transition-all duration-300")}>
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
      </SidebarProvider>
    </div>
    
  );
}
