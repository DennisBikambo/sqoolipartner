// components/layout/DashboardLayout.tsx
'use client';
import { AppSidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, SidebarInset } from '../ui/sidebar';

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
  onSelect,   
}: DashboardLayoutProps) {

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar 
        activeItem={activeItem} 
        onSelect={onSelect}   
      />
      
      <SidebarInset className="flex flex-col">
        {/* Header */}
        <Header title={title} />

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}