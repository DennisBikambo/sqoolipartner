import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * PARTNERS TABLE
   * ------------------------
   * Stores all Sqooli partner profiles and their approval status.
   */
  partners: defineTable({
    name: v.string(),
    laravelUserId: v.number(),
    is_first_login: v.boolean(),
    permission_ids: v.array(v.id("permissions")),
    email: v.string(),
    phone: v.string(),
    username: v.string(),
  }),


  users: defineTable({
    partner_id: v.id("partners"), 
    email: v.string(),
    password_hash: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    extension:v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("partner_admin"),
      v.literal("accountant"),
      v.literal("campaign_manager"),
      v.literal("viewer"),
      v.literal("super_agent"),
      v.literal("master_agent"),
      v.literal("merchant_admin")
    ), 
    permission_ids: v.array(v.id("permissions")),
    is_active: v.boolean(),
    is_account_activated: v.boolean(),
    is_first_login: v.boolean(),
    last_login: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_partner_id", ["partner_id"])
    .index("by_permission_ids", ["permission_ids"])
    .index("by_role", ["role"]),
  
  /**
   * PERMISSIONS TABLE
   * ------------------------
   * Master list of all available permissions in the system
   * Each permission defines what a user can access/do
   */
  permissions: defineTable({
    key: v.string(), 
    name: v.string(), 
    description: v.string(), 
    category: v.union(
      v.literal("users"),
      v.literal("campaigns"),
      v.literal("programs"),
      v.literal("wallet"),
      v.literal("dashboard"),
      v.literal("settings"),
      v.literal("all_access")
    ),
    level: v.union(
      v.literal("read"),
      v.literal("write"),
      v.literal("admin"),
      v.literal("full")
    ),
    is_default: v.boolean(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_is_default", ["is_default"]),

  /**
   * ROLES TABLE
   * ------------------------
   * Defines system roles and their associated permissions
   * Each role has a predefined set of permission IDs
   */
  roles: defineTable({
    name: v.string(), // Role name e.g., "partner_admin", "campaign_manager"
    display_name: v.string(), // Human-readable name e.g., "Partner Administrator"
    description: v.string(), // What this role can do
    permission_ids: v.array(v.id("permissions")), // Array of permission IDs
    is_system_role: v.boolean(), // Whether this is a built-in role (cannot be deleted)
    is_active: v.boolean(), // Whether this role is currently active
    created_at: v.string(),
    updated_at: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_is_active", ["is_active"])
    .index("by_is_system_role", ["is_system_role"]),

  /**
   * CAMPAIGNS TABLE
   * ------------------------
   * Tracks all marketing or partnership campaigns tied to programs.
   */
  channels: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    partnerId: v.id("partners"),
    subchanells: v.optional(v.array(v.string())),
  }),

  campaigns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    program_id: v.id('programs'),
    partner_id: v.id("partners"),
    user_id: v.optional(v.id("users")),
    channel_id: v.optional(v.id("channels")),
    promo_code: v.optional(v.string()), // Optional: backward compatibility for existing campaigns
    target_signups: v.number(),
    daily_target: v.number(),
    bundled_offers: v.object({
      min_lessons: v.number(),
      total_price: v.number(),
    }),
    discount_rule: v.object({
      price_per_lesson: v.number(),
      min_amount: v.optional(v.number()),
    }),
    revenue_projection: v.number(),
    revenue_share: v.object({
      partner_percentage: v.number(),
      sqooli_percentage: v.number(),
    }),
    whatsapp_number: v.string(),
    duration_start: v.string(),
    duration_end: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("expired")
    ),
  })
    .index("by_partner_id", ["partner_id"])
    .index("by_user_id", ["user_id"])
    .index("by_program_id", ["program_id"])
    .index("by_promo_code", ["promo_code"]),

  /**
   * PROMO CODES TABLE
   * ------------------------
   * Stores multiple promo codes per campaign (e.g., different codes for different radio stations)
   */
  promo_codes: defineTable({
    campaign_id: v.id("campaigns"),
    code: v.string(), // e.g., "RADIOAFRICA2025"
    label: v.string(), // e.g., "Radio Africa"
    description: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
  })
    .index("by_campaign_id", ["campaign_id"])
    .index("by_code", ["code"]),

  /**
   * PROGRAM ENROLLMENTS TABLE
   * ------------------------
   * Logs every user’s redemption or enrollment via a campaign.
   */
  program_enrollments: defineTable({
    program_id: v.id('programs'),
    campaign_id: v.id("campaigns"),
    user_id: v.id("users"),
    redeem_code: v.string(), 
    transaction_id: v.optional(v.id("transactions")),
    status: v.union(
      v.literal("pending"),
      v.literal("redeemed"),
      v.literal("expired")
    ),
    meta: v.optional(
      v.object({
        phone: v.optional(v.string()),
        payment_amount: v.optional(v.number()),
      })
    ),
  })
    .index("by_program_id", ["program_id"])
    .index("by_campaign_id", ["campaign_id"])
    .index("by_redeem_code", ["redeem_code"])
    .index("by_transaction_id", ["transaction_id"]),

  /**
   * ASSETS TABLE
   * ------------------------
   * Stores media and marketing assets linked to campaigns.
   */
  assets: defineTable({
    campaign_id: v.id("campaigns"),
    type: v.union(
      v.literal("qr_code"),
      v.literal("social_post"),
      v.literal("flyer"),
      v.literal("how_to_pay")
    ),
    url: v.optional(v.string()),
    content: v.optional(v.string()),
    generated_at: v.number(),
  }).index("by_campaign_id", ["campaign_id"]),

  /**
   * PARTNER REVENUE LOGS TABLE
   * ------------------------
   * Records the revenue split between partners and Sqooli per transaction.
   */
  partner_revenue_logs: defineTable({
    partner_id: v.id("partners"),
    campaign_id: v.id("campaigns"),
    user_id: v.id("users"),
    transaction_id: v.id("transactions"),
    amount: v.number(), // Partner’s 20% share
    gross_amount: v.number(), // Full transaction amount
    split_timestamp: v.number(),
  })
    .index("by_partner_id", ["partner_id"])
    .index("by_campaign_id", ["campaign_id"]),

  //  Curricula Table
  curricula: defineTable({
    name: v.string(),
    description: v.string(),
    created_at: v.string(),
    updated_at: v.optional(v.string()),
  }),

  // Subjects Table
  subjects: defineTable({
    name: v.string(),
    created_at: v.string(),
  }),

  // Programs Table
  programs: defineTable({
    name: v.string(),
    curriculum_id: v.id("curricula"),
    start_date: v.string(),
    end_date: v.string(),
    pricing: v.float64(),
    subjects: v.array(v.string()), 
    timetable: v.record(
      v.string(), 
      v.array(
        v.object({
          subject: v.string(),
          time: v.string(),
        })
      )
    ),
    created_at: v.string(),
    updated_at: v.optional(v.string()),
  }),

  program_subjects: defineTable({
    program_id: v.id("programs"),
    subject_id: v.id("subjects"),
  }),

  // Trasaction paid
  transactions: defineTable({
    student_name: v.string(),
    phone_number: v.string(),
    mpesa_code: v.string(),
    amount: v.float64(),
    campaign_code: v.string(),
    partner_id: v.id("partners"), 
    status: v.string(), 
    created_at: v.string(),
    verified_at: v.optional(v.string()),
  })
    .index("by_mpesa_code", ["mpesa_code"])
    .index("by_campaign_code", ["campaign_code"])
    .index("by_partner_id", ["partner_id"]),

  wallets: defineTable({
    account_number: v.string(), 
    partner_id: v.id("partners"), 
    user_id : v.id("users"),
    balance: v.number(), 
    pending_balance: v.number(), 
    lifetime_earnings: v.number(), 
    withdrawal_method: v.union(
      v.literal("mpesa"),
      v.literal("bank"),
      v.literal("paybill")
    ), 
    bank_name: v.optional(v.string()), 
    branch: v.optional(v.string()), 
    paybill_number: v.optional(v.string()), 
    beneficiaries: v.array(
      v.object({
        label: v.string(), 
        account_number: v.string(), 
        provider: v.string(), 
      })
    ), 
    pin: v.string(), 
    pin_set_at: v.string(), 
    updated_at: v.optional(v.string()), 
    created_at: v.string(), 
    is_setup_complete: v.boolean(), 
  })
    .index("by_account_number", ["account_number"])
    .index("by_user_id", ["user_id"])
    .index("by_partner_id",["partner_id"]),
  

  audit_logs: defineTable({
    user_id: v.id("users"),
    partner_id: v.id("partners"),
    action: v.string(), 
    entity_type: v.string(),
    entity_id: v.optional(v.string()),
    details: v.optional(v.string()), 
    ip_address: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_partner_id", ["partner_id"])
    .index("by_action", ["action"]),

  
  sessions: defineTable({
    user_id: v.id("users"),
    token: v.string(), 
    expires_at: v.string(), 
    created_at: v.string(),
  }).index("by_token", ["token"])
    .index("by_user_id", ["user_id"]),

  


/**
 * WITHDRAWALS TABLE
 * ------------------------
 * Tracks all withdrawal requests from partners
 */
withdrawals: defineTable({
  wallet_id: v.id("wallets"),
  partner_id: v.id("partners"),
  user_id: v.id("users"), 
  amount: v.number(),
  withdrawal_method: v.union(
    v.literal("mpesa"),
    v.literal("bank"),
    v.literal("paybill")
  ),
  // Destination details (based on withdrawal_method)
  destination_details: v.object({
    account_number: v.string(),
    account_name: v.optional(v.string()), 
    bank_name: v.optional(v.string()),
    branch: v.optional(v.string()),
    paybill_number: v.optional(v.string()),
  }),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  reference_number: v.string(), 
  mpesa_receipt: v.optional(v.string()), 
  notes: v.optional(v.string()),
  processed_at: v.optional(v.string()),
  failed_reason: v.optional(v.string()),
  updated_at: v.optional(v.string()),
})
  .index("by_wallet_id", ["wallet_id"])
  .index("by_partner_id", ["partner_id"])
  .index("by_user_id", ["user_id"])
  .index("by_status", ["status"])
  .index("by_reference_number", ["reference_number"]),

/**
 * WITHDRAWAL_LIMITS TABLE
 * ------------------------
 * Tracks all withdrawal requests from partners
 */
withdrawal_limits: defineTable({
  partner_id: v.optional(v.id("partners")), 
  min_withdrawal_amount: v.number(),
  max_withdrawal_amount: v.number(),
  daily_limit: v.number(),
  monthly_limit: v.number(),
  processing_days: v.number(), 
  is_active: v.boolean(),
  updated_at: v.optional(v.string()),
})
  .index("by_partner_id", ["partner_id"])
  .index("by_is_active", ["is_active"]),


  notifications: defineTable({
    partnerId: v.id("partners"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_partner_id", ["partnerId"])
    .index("by_partnerId_isRead", ["partnerId", "isRead"]),


  channels: defineTable({
    partnerId: v.id("partners"),
    name: v.string(),
    code:v.string(),
    subchanells:v.array(v.string()),
    description: v.string(),
  }).index("by_partner_id", ["partnerId"]),

});









  
