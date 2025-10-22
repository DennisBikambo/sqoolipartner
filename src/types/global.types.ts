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


