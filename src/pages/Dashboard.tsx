"use client";

import { useEffect, useState, useRef } from "react";
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
import PermissionRefreshBanner from "../components/common/PermissionRefresherBanner";


export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState("dashboard");
  const { hasCategory, permissions } = usePermissions();

  const prevPermissions = useRef<string | null>(null);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);

  useEffect(() => {
    if (!permissions) return;

    const currentPermStr = JSON.stringify(permissions);
    if (prevPermissions.current && prevPermissions.current !== currentPermStr) {
      setShowRefreshBanner(true);
    }
    prevPermissions.current = currentPermStr;
  }, [permissions]);

  const canAccess = (category: string): boolean => {
    if (!permissions) return false;

    const admin = permissions.some(
      (p) => p.category === "all_access" || p.level === "full"
    );
    if (admin) return true;

    return hasCategory(category);
  };

  const sectionMap: Record<string, React.ReactNode> = {
    dashboard: canAccess("dashboard")
      ? <DashboardSection activeItem={activeItem} setActiveItem={setActiveItem} />
      : <LockedSection sectionName="Dashboard" />,

    campaigns: canAccess("campaigns")
      ? <CampaignSection />
      : <LockedSection sectionName="Campaigns" />,

    wallet: canAccess("wallet")
      ? <WalletSection activeItem={activeItem} setActiveItem={setActiveItem} />
      : <LockedSection sectionName="Wallet" />,

    reports: canAccess("dashboard")
      ? <ReportsSection />
      : <LockedSection sectionName="Reports" />,

    users: canAccess("users")
      ? <UserSection />
      : <LockedSection sectionName="Users" />,

    programs: canAccess("programs")
      ? <ProgramsSection />
      : <LockedSection sectionName="Programs" />,

    settings: canAccess("settings")
      ? <SettingsSection />
      : <LockedSection sectionName="Settings" />,
  };

  return (
    <>
      {showRefreshBanner && (
        <PermissionRefreshBanner onRefresh={() => window.location.reload()} />
      )}

      <DashboardLayout
        activeItem={activeItem}
        onSelect={setActiveItem}
        title={activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
      >
        {sectionMap[activeItem]}
      </DashboardLayout>
    </>
  );
}
