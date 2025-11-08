'use client';
import { AppSidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
  title?: string;
  onSelect?: (id: string) => void;   
}

export function DashboardLayout({ 
  children, 
  activeItem = 'dashboard',
  title = 'Dashboard',
  onSelect,   
}: DashboardLayoutProps) {

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed Header - Full Width at Top */}
      <Header title={title} />
      
      {/* Content Area with Sidebar - Add top padding for fixed header */}
      <div className="flex flex-1 overflow-hidden ">
        {/* Floating Sticky Sidebar */}
        <AppSidebar 
          activeItem={activeItem} 
          onSelect={onSelect}   
        />
        
        {/* Main Content - Add left margin for sidebar spacing */}
        <main className="flex-1 overflow-y-auto bg-muted/30 lg:ml-[130px]">
          {children}
        </main>
      </div>
    </div>
  );
}