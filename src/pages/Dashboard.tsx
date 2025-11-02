"use client";

import { useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import DashboardSection from "../sections/DashboardSection";
import CampaignSection from "../sections/CampaignSection";
import WalletSection from "../sections/WalletSection";
import ReportsSection from "../sections/ReportsSection";
import { UserSection } from "../sections/UserSection";
// import UsersSection from "../sections/UsersSection"; // create this if not yet
// import SettingsSection from "../sections/SettingsSection"; // create this if not yet
// import { useAuth } from "../hooks/useAuth";
// import { useQuery } from "convex/react";
// import { api } from "../../convex/_generated/api";

export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState("dashboard");
  // const { user } = useAuth();

  // const campaigns = useQuery(
  //   api.campaign.getCampaignsByPartner,
  //   user ? { partner_id: user._id } : "skip"
  // );

  // ✅ Map sidebar IDs to page sections
  const sectionMap: Record<string, React.ReactNode> = {
    dashboard: <DashboardSection activeItem={activeItem} setActiveItem={setActiveItem} />,
    campaigns: <CampaignSection />,
    wallet: <WalletSection activeItem={activeItem} setActiveItem={setActiveItem} />,
    reports: <ReportsSection />,
    users: <UserSection />,
    // settings: <SettingsSection />,
  };

  return (
    <DashboardLayout
      activeItem={activeItem}
      onSelect={setActiveItem}
      title={activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
      subtitle={
        activeItem === "dashboard"
          ? "Overview of students performance"
          : undefined
      }
    >
      {sectionMap[activeItem]}
    </DashboardLayout>
  );
}
