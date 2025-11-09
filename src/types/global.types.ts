import type { Id } from "../../convex/_generated/dataModel";

export type Curriculum = {
  id: string; 
  name: string;
  description?: string;
  created_at: string; 
  updated_at?: string;
};

export type Subject = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
};

export type Program = {
  id: string;
  name: string;
  curriculum_id: string; 
  start_date: string; 
  end_date: string; 
  pricing: number;
  subjects: string[]; 
  timetable?: { [day: string]: { subject: string; time: string }[] }; 
  created_at: string;
  updated_at?: string;
};

export type ProgramSubject = {
  program_id: string;
  subject_id: string;
};




export interface DashboardMetrics {
  totalCampaigns: number;
  ongoingCampaigns: number;
  totalSignups: number;
  totalEarnings: number;
}

export interface DashboardEarnings {
  date: string;
  amount: number;
}

export interface DashboardCampaign {
  _id: Id<"campaigns">;
  name: string;
  duration_start: string;
  duration_end: string;
  status: string;
  revenue_projection: number;
  target_signups: number;
}

export interface DashboardEnrollment {
  _id: Id<"program_enrollments">;
  status?: string;
  _creationTime: number;
}

export interface DashboardWallet {
  balance: number;
  withdrawal_method: "mpesa_b2c" | "bank_transfer" | "paypal" | string;
  beneficiaries: {
    account_number: string;
  }[];
}


export type CampaignProps = {
  _id: Id<"campaigns">;
  _creationTime: number;
  name: string;
  program_id: string;
  partner_id: string;
  promo_code: string;
  target_signups: number;
  daily_target: number;
  bundled_offers: {
    min_lessons: number;
    total_price: number;
  };
  discount_rule: {
    price_per_lesson: number;
    min_amount?: number;
  };
  revenue_projection: number;
  revenue_share: {
    partner_percentage: number;
    sqooli_percentage: number;
  };
  whatsapp_number: string;
  duration_start: string;
  duration_end: string;
  status: "draft" | "active" | "expired";
};


