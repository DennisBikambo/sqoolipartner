import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import { api } from "../../convex/_generated/api";

export default function BeneficiariesSection() {
  const {  partner } = useAuth();
  
  
  const partnerId = partner?._id;

  const campaigns = useQuery(
    api.campaign.getCampaignsByPartner,
    partnerId ? { partner_id: partnerId } : "skip"
  );

  return (
    <div>
      {partner && (!campaigns || campaigns.length === 0) && <NoCampaignCard />}
    </div>
  );
}