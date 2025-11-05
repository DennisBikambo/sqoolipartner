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
      {/* Header - Full Width at Top */}
      <Header title={title} />
      
      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AppSidebar 
          activeItem={activeItem} 
          onSelect={onSelect}   
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}