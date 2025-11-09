"use client";

import { useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import DashboardSection from "../sections/DashboardSection";
import CampaignSection from "../sections/CampaignSection";
import WalletSection from "../sections/WalletSection";
import ReportsSection from "../sections/ReportsSection";
import UserSection from "../sections/UserSection";
import ProgramsSection from "../sections/ProgramSection";
import SettingsSection from "../sections/SettingsSection";
import { usePermissions } from "../hooks/usePermission";
import LockedSection from "../sections/LockedSection";

// Locked Section Component


export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState("dashboard");
  const { hasCategory, permissions } = usePermissions();

  // Permission check helper
  const canAccess = (category: string): boolean => {
    // Admin all access bypasses everything
    if (permissions?.key === 'admin.all.access' || permissions?.level === 'full') {
      return true;
    }
    return hasCategory(category);
  };

  
  const sectionMap: Record<string, React.ReactNode> = {
    dashboard: canAccess('dashboard') 
      ? <DashboardSection activeItem={activeItem} setActiveItem={setActiveItem} />
      : <LockedSection sectionName="Dashboard" />,
    
    campaigns: canAccess('campaigns')
      ? <CampaignSection />
      : <LockedSection sectionName="Campaigns" />,
    
    wallet: canAccess('wallet')
      ? <WalletSection activeItem={activeItem} setActiveItem={setActiveItem} />
      : <LockedSection sectionName="Wallet" />,
    
    reports: canAccess('dashboard') 
      ? <ReportsSection />
      : <LockedSection sectionName="Reports" />,
    
    users: canAccess('users')
      ? <UserSection />
      : <LockedSection sectionName="Users" />,
    
    programs: canAccess('programs')
      ? <ProgramsSection />
      : <LockedSection sectionName="Programs" />,
    
    settings: canAccess('settings')
      ? <SettingsSection />
      : <LockedSection sectionName="Settings" />,
  };

  return (
    <DashboardLayout
      activeItem={activeItem}
      onSelect={setActiveItem}
      title={activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
    >
      {sectionMap[activeItem]}
    </DashboardLayout>
  );
}