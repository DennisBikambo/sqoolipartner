// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * POST /mpesa-payment
 * Receives M-Pesa payment data from n8n webhook
 */
http.route({
  path: "/mpesa-payment",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { student_name, phone_number, mpesa_code, amount, campaign_code } = body;

      if (!student_name || !phone_number || !mpesa_code || !amount || !campaign_code) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing required fields: student_name, phone_number, mpesa_code, amount, campaign_code",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get campaign
      const campaign = await ctx.runQuery(api.campaign.getCampaignByPromoCode, {
        promo_code: campaign_code.toUpperCase(),
      });

      if (!campaign) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Campaign with code '${campaign_code}' not found`,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (campaign.status !== "active") {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Campaign '${campaign_code}' is not active (status: ${campaign.status})`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Prevent duplicate transactions
      const existingTxn = await ctx.runQuery(api.transactions.getTransactionByMpesaCode, { mpesa_code });
      if (existingTxn) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Transaction with M-Pesa code '${mpesa_code}' already exists`,
            transaction_id: existingTxn._id,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create transaction with "pending" status
      const transactionId = await ctx.runMutation(api.transactions.createTransaction, {
        student_name,
        phone_number,
        mpesa_code,
        amount: parseFloat(amount),
        campaign_code: campaign_code.toUpperCase(),
        partner_id: campaign.partner_id,
        status: "pending",
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Transaction recorded successfully",
          transaction_id: transactionId,
          campaign: {
            name: campaign.name,
            partner_id: campaign.partner_id,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error processing M-Pesa payment:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * PATCH /mpesa-callback
 * Called by n8n after parsing M-Pesa callback data
 * Now only handles transaction updates and partner revenue
 * User creation will be handled by the AI agent after this completes
 */
http.route({
  path: "/mpesa-callback",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    try {
      const {
        checkout_request_id,
        result_code,
        mpesa_receipt_number,
        phone_number,
        amount,
        transaction_date,
      } = await request.json();

      const isSuccess = Number(result_code) === 0;

      // 1️⃣ Lookup transaction
      const txn = await ctx.runQuery(api.transactions.getTransactionByCheckoutRequestId, {
        checkout_request_id,
      });

      if (!txn) {
        return new Response(
          JSON.stringify({ success: false, error: "Transaction not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 2️⃣ Update transaction
      await ctx.runMutation(api.transactions.updateTransaction, {
        id: txn._id,
        fields: {
          status: isSuccess ? "Success" : "Failed",
          mpesa_code: mpesa_receipt_number || txn.mpesa_code,
          amount: amount ? parseFloat(amount) : txn.amount,
          verified_at: transaction_date || new Date().toISOString(),
        },
      });

      if (!isSuccess) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Transaction marked as failed.",
            payment_status: "failed",
            transaction_id: txn._id,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // ✅ TRUE SUCCESS FLOW - No user creation here anymore
      const grossAmount = parseFloat(amount);
      const partnerShare = grossAmount * 0.2;

      // Get campaign details
      const campaign = await ctx.runQuery(api.campaign.getCampaignByPromoCode, {
        promo_code: txn.campaign_code,
      });

      if (!campaign) {
        throw new Error(`Campaign not found for code ${txn.campaign_code}`);
      }

      // Get program details (for price per lesson)
      const program = await ctx.runQuery(api.program.getProgramById, {
        id: campaign.program_id,
      });

      if (!program) {
        throw new Error(`Program not found for campaign ${campaign._id}`);
      }

      const pricePerLesson = program.pricing;
      const numberOfLessons = Math.floor(grossAmount / pricePerLesson);

      // Generate redeem code
      const redeemCode = `R-${Math.floor(100000 + Math.random() * 900000)}`;

      // Student enrollment (only if campaign has a user_id)
      if (campaign.user_id) {
        await ctx.runMutation(api.program_enrollments.createEnrollment, {
          program_id: campaign.program_id,
          user_id: campaign.user_id,
          campaign_id: campaign._id,
          redeem_code: redeemCode,
          transaction_id: txn._id,
          status: "redeemed",
          meta: {
            phone: phone_number || txn.phone_number,
            payment_amount: grossAmount,
          },
        });

        // Partner revenue
        await ctx.runMutation(api.partner_revenue.logRevenue, {
          partner_id: campaign.partner_id,
          user_id: campaign.user_id,
          campaign_id: campaign._id,
          transaction_id: txn._id,
          amount: partnerShare,
          gross_amount: grossAmount,
        });
      }

      // Update wallet
      await ctx.runMutation(api.wallet.updateWalletBalance, {
        partner_id: campaign.partner_id,
        amount_to_add: partnerShare,
      });

      // ✅ Return data that the AI agent will need to create the user
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment processed successfully",
          payment_status: "success",
          transaction_id: txn._id,
          
          // Data for agent to create user
          user_creation_data: {
            student_name: txn.student_name,
            phone_number: phone_number || txn.phone_number,
            redeem_code: redeemCode,
            amount_paid: grossAmount,
            no_of_lessons: numberOfLessons,
            price_per_lesson: pricePerLesson,
            campaign_id: campaign._id,
          },
          
          // Payment summary
          payment_summary: {
            partner_share: partnerShare,
            gross_amount: grossAmount,
            number_of_lessons: numberOfLessons,
            price_per_lesson: pricePerLesson,
            redeem_code: redeemCode,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error handling M-Pesa callback:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});



/**
 * POST /education-insights
 * Provides comprehensive educational data for AI agents (e.g., n8n)
 * This endpoint is the primary reference for campaign pricing, program details,
 * and enrollment information used by AI systems to assist customers
 */
http.route({
  path: "/education-insights",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      console.log(body.message)

      // 1️⃣ Fetch all data
      const [campaigns, programs, subjects, curricula] = await Promise.all([
        ctx.runQuery(api.campaign.getAllCampaigns),
        ctx.runQuery(api.program.listPrograms),
        ctx.runQuery(api.subjects.listSubjects),
        ctx.runQuery(api.curricula.listCurricula),
      ]);

      const now = new Date();

      // 2️⃣ Build program lookup map with full details
      const programMap = new Map(
        programs.map((p) => {
          const curriculum = curricula.find((c) => c._id === p.curriculum_id);
          return [
            p._id,
            {
              ...p,
              curriculum_name: curriculum?.name || "Unknown",
              subject_list: p.subjects,
            },
          ];
        })
      );

      // 3️⃣ Enrich campaigns with complete program and pricing details
      const enrichedCampaigns = campaigns.map((c) => {
        const isExpired = new Date(c.duration_end) < now;
        const program = programMap.get(c.program_id);
        const pricePerLesson = program?.pricing || 0;
        
        return {
          campaign_id: c._id,
          campaign_name: c.name,
          promo_code: c.promo_code,
          status: isExpired ? "expired" : c.status,
          is_expired: isExpired,
          duration_start: c.duration_start,
          duration_end: c.duration_end,
          partner_id: c.partner_id,
          
          // Program details
          program_id: c.program_id,
          program_name: program?.name || "Unknown",
          curriculum_name: program?.curriculum_name || "Unknown",
          subjects: program?.subject_list || [],
          
          // Pricing information
          price_per_lesson: pricePerLesson,
          minimum_payment: pricePerLesson, // 1 lesson minimum
          example_payments: {
            one_lesson: pricePerLesson,
            five_lessons: pricePerLesson * 5,
            ten_lessons: pricePerLesson * 10,
            twenty_lessons: pricePerLesson * 20,
          },
          
          // Timetable (if available)
          timetable: program?.timetable || {},
        };
      });

      interface PricingTier {
          price_per_lesson: number;
          programs: {
            program_id: string;
            program_name: string;
            curriculum: string;
            subjects: string[];
          }[];
          active_campaigns: {
            campaign_name: string;
            promo_code: string;
            duration_end: string;
          }[];
      }
      // 4️⃣ Create pricing tiers grouped by price point
      const pricingTiers = programs.reduce((acc, p) => {
        const price = p.pricing;
        if (!acc[price]) {
          acc[price] = {
            price_per_lesson: price,
            programs: [],
            active_campaigns: [],
          };
        }
        
        acc[price].programs.push({
          program_id: p._id,
          program_name: p.name,
          curriculum: curricula.find((c) => c._id === p.curriculum_id)?.name || "Unknown",
          subjects: p.subjects,
        });
        
        // Add active campaigns for this pricing tier
        const activeCampaignsForPrice = enrichedCampaigns.filter(
          (ec) => ec.program_id === p._id && ec.status === "active" && !ec.is_expired
        );
        
        acc[price].active_campaigns.push(...activeCampaignsForPrice.map(c => ({
          campaign_name: c.campaign_name,
          promo_code: c.promo_code || "",
          duration_end: c.duration_end,
        })));
        
        return acc;
      }, {} as Record<number, PricingTier>);

      // 5️⃣ Compute summary statistics
      const activeCampaigns = enrichedCampaigns.filter((c) => !c.is_expired && c.status === "active");
      const pricingOptions = Object.keys(pricingTiers).map(Number).sort((a, b) => a - b);
      const minPrice = Math.min(...pricingOptions);
      const maxPrice = Math.max(...pricingOptions);

      // 6️⃣ Generate AI-friendly insights
      const insights = {
        summary: {
          total_programs: programs.length,
          total_subjects: subjects.length,
          total_campaigns: campaigns.length,
          active_campaigns: activeCampaigns.length,
          pricing_tiers: pricingOptions.length,
        },
        
        pricing_overview: {
          min_price_per_lesson: minPrice,
          max_price_per_lesson: maxPrice,
          available_price_points: pricingOptions,
          pricing_tiers: Object.entries(pricingTiers).map(([price, data]) => ({
            price_per_lesson: Number(price),
            programs_count: data.programs.length,
            active_campaigns_count: data.active_campaigns.length,
            programs: data.programs,
            campaigns: data.active_campaigns,
          })).sort((a, b) => a.price_per_lesson - b.price_per_lesson),
        },
        
        ai_agent_instructions: [
          `When a customer inquires about pricing, reference the campaign they're interested in to determine the exact price per lesson.`,
          `Each campaign is linked to a specific program, which determines its pricing.`,
          `Minimum payment is 1 lesson worth (price_per_lesson), but customers can pay for multiple lessons at once.`,
          `To calculate total cost: number_of_lessons × price_per_lesson`,
          `To calculate lessons from payment: Math.floor(payment_amount ÷ price_per_lesson)`,
          `Only recommend active campaigns (status="active" and is_expired=false).`,
          `Use the promo_code field when directing customers to make payments.`,
          `Each campaign has a duration_end date - do not recommend expired campaigns.`,
        ],
        
        common_queries: {
          "How much does it cost?": "The cost depends on which campaign/program the student enrolls in. Prices range from KES {minPrice} to KES {maxPrice} per lesson.",
          "Can I pay for multiple lessons?": "Yes! Customers can pay for as many lessons as they want. The system calculates: payment_amount ÷ price_per_lesson.",
          "Which campaign should I choose?": "Recommend based on: curriculum match, subjects offered, price point, and campaign availability (check duration_end).",
          "What subjects are available?": "Check the 'subjects' array for each campaign to see which subjects are included in that program.",
        },
      };

      // 7️⃣ Build comprehensive response
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          insights,
          
          // Active campaigns for quick reference
          active_campaigns: activeCampaigns,
          
          // All campaigns with full enrichment
          all_campaigns: enrichedCampaigns,
          
          // Programs with curriculum info
          programs: programs.map(p => ({
            ...p,
            curriculum_name: curricula.find(c => c._id === p.curriculum_id)?.name || "Unknown",
          })),
          
          // Reference data
          subjects,
          curricula,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching education insights:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});


/**
 * GET /health
 * Health check endpoint
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;