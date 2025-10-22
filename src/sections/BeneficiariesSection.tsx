import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import { api } from "../../convex/_generated/api";


export default function BeneficiariesSection() {
    const { user } = useAuth();

  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    user ? { partner_id: user._id } : "skip"
  );
  return (
    <div>
      {user && (!campaigns || campaigns.length === 0) && <NoCampaignCard />}
    </div>
  );
}