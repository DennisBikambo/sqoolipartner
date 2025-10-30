import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import { api } from "../../convex/_generated/api";

export default function ReportsSection() {
  const { partner } = useAuth();

  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partner?._id ? { partner_id: partner._id } : "skip"
  );

  return (
    <div>
      {partner && (!campaigns || campaigns.length === 0) && <NoCampaignCard />}
    </div>
  );
}
