import type { Curriculum, Subject,Program,ProgramSubject } from './types/global.types';


// Dummy Curricula Data (for curriculum_id foreign key)
const curricula: Curriculum[] = [
  {
    id: "curr_1",
    name: "CBC",
    description: "Competency-Based Curriculum for Kenyan primary and secondary",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "curr_2",
    name: "8-4-4",
    description: "Traditional Kenyan education system",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "curr_3",
    name: "Cambridge",
    description: "International Cambridge curriculum",
    created_at: "2025-01-01T00:00:00Z",
  },
];

// Dummy Subjects Data (for program_subject or JSON subjects field)
const subjects: Subject[] = [
  {
    id: "sub_1",
    name: "Mathematics",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sub_2",
    name: "English",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sub_3",
    name: "Science",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sub_4",
    name: "Kiswahili",
    created_at: "2025-01-01T00:00:00Z",
  },
];

// Dummy Programs Data (main table)
const programs: Program[] = [
  {
    id: "prog_1",
    name: "Nov-Dec Holiday Tuition 2025",
    curriculum_id: "curr_1", // CBC
    start_date: "2025-11-01",
    end_date: "2025-12-19",
    pricing: 250.0, // KES per lesson
    subjects: ["Mathematics", "English", "Science", "Kiswahili"], // JSON approach
    timetable: {
      monday: [
        { subject: "Mathematics", time: "09:00-10:00" },
        { subject: "English", time: "10:30-11:30" },
      ],
      tuesday: [
        { subject: "Science", time: "09:00-10:00" },
        { subject: "Kiswahili", time: "10:30-11:30" },
      ],
    },
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "prog_2",
    name: "April Holiday Tuition 2026",
    curriculum_id: "curr_2", // 8-4-4
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    pricing: 200.0,
    subjects: ["Mathematics", "English"],
    timetable: {
      wednesday: [
        { subject: "Mathematics", time: "08:00-09:00" },
        { subject: "English", time: "09:30-10:30" },
      ],
    },
    created_at: "2025-10-01T00:00:00Z",
  },
  {
    id: "prog_3",
    name: "Cambridge Summer Program 2025",
    curriculum_id: "curr_3", // Cambridge
    start_date: "2025-12-01",
    end_date: "2025-12-31",
    pricing: 300.0,
    subjects: ["Science", "English"],
    timetable: {
      friday: [
        { subject: "Science", time: "10:00-11:00" },
        { subject: "English", time: "11:30-12:30" },
      ],
    },
    created_at: "2025-10-01T00:00:00Z",
  },
];

// Optional: Dummy Program-Subject Mapping (if using relational instead of JSON subjects)
const programSubjects: ProgramSubject[] = [
  { program_id: "prog_1", subject_id: "sub_1" }, // Nov-Dec: Mathematics
  { program_id: "prog_1", subject_id: "sub_2" }, // Nov-Dec: English
  { program_id: "prog_1", subject_id: "sub_3" }, // Nov-Dec: Science
  { program_id: "prog_1", subject_id: "sub_4" }, // Nov-Dec: Kiswahili
  { program_id: "prog_2", subject_id: "sub_1" }, // April: Mathematics
  { program_id: "prog_2", subject_id: "sub_2" }, // April: English
  { program_id: "prog_3", subject_id: "sub_3" }, // Cambridge: Science
  { program_id: "prog_3", subject_id: "sub_2" }, // Cambridge: English
];


export interface CampaignFormData {
  // Step 1: Basic Info
  name: string;
  program_id: string;
  
  // Step 2: Campaign Details
  target?: number;
  duration_start: string;
  duration_end: string;
  revenue_projection?: number;
  
  // Step 3: Offers & Discounts
  bundled_offers?: {
    offers: string[];
  };
  discount_rule?: {
    type: string;
    value: number;
    min_amount?: number;
  };
  
  // Step 4: Contact & Status
  whatsapp_number?: string;
  status: 'draft' | 'active' | 'expired';
}

export interface CampaignStep {
  id: number;
  title: string;
  description: string;
  fields: string[];
}

export const CAMPAIGN_STEPS: CampaignStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Campaign name and program selection',
    fields: ['name', 'program_id']
  },
  {
    id: 2,
    title: 'Campaign Details',
    description: 'Target, duration, and projections',
    fields: ['target', 'duration_start', 'duration_end', 'revenue_projection']
  },
  {
    id: 3,
    title: 'Offers & Discounts',
    description: 'Bundled offers and discount rules',
    fields: ['bundled_offers', 'discount_rule']
  },
  {
    id: 4,
    title: 'Contact & Launch',
    description: 'WhatsApp contact and campaign status',
    fields: ['whatsapp_number', 'status']
  }
];

// Export for use in Convex or React
export { curricula, subjects, programs, programSubjects };

