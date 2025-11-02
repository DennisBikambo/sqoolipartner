import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import { ComingSoon } from "../components/common/ComingSoon";
import { Loading } from "../components/common/Loading";
import { api } from "../../convex/_generated/api";

export default function ReportsSection() {
  const { partner } = useAuth();

  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  
  if (partner && campaigns === undefined) {
    return (
      <Loading 
        message="Loading your campaigns..." 
        size="md"
      />
    );
  }

  return (
    <div>
      {partner && (!campaigns || campaigns.length === 0) ? (
        <NoCampaignCard />
      ) : (
        <ComingSoon
          title="Reports & Analytics"
          description="Comprehensive campaign reports and analytics are coming soon. Track your performance metrics, conversion rates, and revenue insights all in one place."
          icon="sparkles"
        />
      )}
    </div>
  );
}