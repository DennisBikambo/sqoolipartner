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

      // 1️⃣ Get the transaction by checkout_request_id
      const txn = await ctx.runQuery(api.transactions.getTransactionByCheckoutRequestId, {
        checkout_request_id,
      });

      if (!txn) {
        return new Response(
          JSON.stringify({ success: false, error: "Transaction not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // 2️⃣ Update transaction status
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
            message: "Transaction marked as expired (failed payment).",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // ✅ SUCCESS LOGIC
      const grossAmount = parseFloat(amount);
      const partnerShare = grossAmount * 0.2;

      // 3️⃣ Get campaign info
      const campaign = await ctx.runQuery(api.campaign.getCampaignByPromoCode, {
        promo_code: txn.campaign_code,
      });

      if (!campaign) {
        throw new Error(`Campaign not found for code ${txn.campaign_code}`);
      }

      // 4️⃣ Enroll user in program_enrollments
      const redeemCode = `R-${Math.floor(100000 + Math.random() * 900000)}`;
      const pricePerLesson = campaign.discount_rule?.price_per_lesson;
      const numberOfLessons = Math.floor(grossAmount / pricePerLesson);
      await ctx.runMutation(api.program_enrollments.createEnrollment, {
        program_id: campaign.program_id,
        campaign_id: campaign._id,
        redeem_code: redeemCode,
        transaction_id: txn._id,
        status: "redeemed", 
        meta: {
          phone: phone_number || txn.phone_number,
          payment_amount: grossAmount,
          number_of_lessons_subscribed: numberOfLessons
        },
      });

      // 5️⃣ Record partner revenue
      await ctx.runMutation(api.partner_revenue.logRevenue, {
        partner_id: campaign.partner_id,
        campaign_id: campaign._id,
        transaction_id: txn._id,
        amount: partnerShare,
        gross_amount: grossAmount,
      });

      // 6️⃣ Update partner’s wallet
      await ctx.runMutation(api.wallet.updateWalletBalance, {
        partner_id: campaign.partner_id,
        amount_to_add: partnerShare,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment processed successfully",
          redeem_code: redeemCode,
          partner_share: partnerShare,
          gross_amount: grossAmount,
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
 * GET /education-insights
 * Provides aggregated educational data for AI agents (e.g., n8n)
 * Includes campaigns, programs, subjects, curricula, and lesson cost
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

      // 2️⃣ Determine expired vs active campaigns
      const now = new Date();
      const enrichedCampaigns = campaigns.map((c) => {
        const isExpired = new Date(c.duration_end) < now;
        return {
          ...c,
          is_expired: isExpired,
          status: isExpired ? "expired" : c.status,
        };
      });

      // 3️⃣ Compute summary
      const totalPrograms = programs.length;
      const totalSubjects = subjects.length;
      const totalCampaigns = campaigns.length;
      const activeCampaigns = enrichedCampaigns.filter((c) => !c.is_expired && c.status === "active").length;

      const LESSON_COST = 200; 

      // 4️⃣ Generate summary insights for reasoning agents
      const insights = {
        overview: {
          total_programs: totalPrograms,
          total_subjects: totalSubjects,
          total_campaigns: totalCampaigns,
          active_campaigns: activeCampaigns,
          lesson_cost_kes: LESSON_COST,
        },
        notes: [
          `Each lesson costs KES ${LESSON_COST}.`,
          `${totalPrograms} programs are currently available.`,
          `${totalSubjects} subjects are offered across all curricula.`,
          `${activeCampaigns} campaigns are active and open for enrollment.`,
          `Expired or inactive campaigns should not be used for new enrollments.`,
        ],
      };

      return new Response(
        JSON.stringify({
          success: true,
          insights,
          data: {
            campaigns: enrichedCampaigns,
            programs,
            subjects,
            curricula,
          },
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
