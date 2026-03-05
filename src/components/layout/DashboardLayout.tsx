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
    <div className="min-h-screen bg-background">
      {/* Fixed Header - Full Width at Top */}
      <Header title={title} />

      {/* Content Area with Sidebar - pt matches header height (h-14 / sm:h-16) */}
      <div className="flex pt-14 sm:pt-16 min-h-screen overflow-hidden bg-muted/30">
        {/* Floating Sticky Sidebar */}
        <AppSidebar 
          activeItem={activeItem} 
          onSelect={onSelect}   
        />
        
        {/* Main Content - Add left margin for sidebar spacing */}
        <main className="flex-1 overflow-y-auto lg:ml-[110px]">
          {children}
        </main>
      </div>
    </div>
  );
}