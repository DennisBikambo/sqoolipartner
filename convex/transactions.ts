import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"



export const createTransaction = mutation({
    args:{
        student_name:v.string(),
        phone_number:v.string(),
        mpesa_code:v.string(),
        amount:v.float64(),
        campaign_code:v.string(),
        partner_id:v.id("partners"),
        status:v.union(v.literal("pending"), v.literal("Success"), v.literal("Failed")),
        checkout_request_id:v.optional(v.string()),
    },
    handler:async (ctx,args) =>{
        const now = new Date().toISOString()
        const id = await ctx.db.insert('transactions',{
            ...args,
            created_at:now,
        })
        await ctx.runMutation(internal.systemLogs.logEvent, {
          level: "info", source: "backend",
          event_name: "transactions.createTransaction",
          status: "success",
          details: JSON.stringify({ id, mpesa_code: args.mpesa_code, amount: args.amount, campaign_code: args.campaign_code }),
        });
        return id;
    }
})

export const listTransactions = query({
  handler: async (ctx) => await ctx.db.query("transactions").collect(),
});

export const getTransactionById = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getTransactionsByPartner = query({
  args: { partner_id: v.id("partners") },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("partner_id"), args.partner_id))
      .collect(); 
    return wallet ?? null;
  },
});
export const updateTransaction = mutation({
  args: {
    id: v.id("transactions"),
    fields: v.object({
      status: v.optional(v.union(v.literal("pending"), v.literal("Success"), v.literal("Failed"))),
      mpesa_code: v.optional(v.string()),
      amount: v.optional(v.float64()),
      verified_at: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, fields }) => {
    const prev = await ctx.db.get(id);

    // Anomaly: amount being changed on an existing transaction
    if (fields.amount !== undefined && prev?.amount !== undefined && fields.amount !== prev.amount) {
      await ctx.runMutation(internal.systemLogs.logEvent, {
        level: "error", source: "backend",
        event_name: "anomaly.transactionAmountModified",
        status: "error",
        message: `Transaction amount changed from KES ${prev.amount} to KES ${fields.amount}`,
        details: JSON.stringify({ transaction_id: id, prev_amount: prev.amount, new_amount: fields.amount, mpesa_code: prev?.mpesa_code }),
      });
    }

    // Anomaly: status going from Success back to Failed
    if (fields.status === "Failed" && prev?.status === "Success") {
      await ctx.runMutation(internal.systemLogs.logEvent, {
        level: "error", source: "backend",
        event_name: "anomaly.transactionStatusReversed",
        status: "error",
        message: `Transaction status reversed from Success to Failed`,
        details: JSON.stringify({ transaction_id: id, mpesa_code: prev?.mpesa_code, amount: prev?.amount }),
      });
    }

    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "transactions.updateTransaction",
      status: "success",
      details: JSON.stringify({ transaction_id: id, fields, prev_status: prev?.status }),
    });

    return await ctx.db.patch(id, { ...fields, verified_at: fields.verified_at ?? new Date().toISOString() });
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "warn", source: "backend",
      event_name: "transactions.deleteTransaction",
      status: "warn",
      details: JSON.stringify({ id: args.id, mpesa_code: tx?.mpesa_code, amount: tx?.amount, status: tx?.status }),
    });
  },
});

/**
 * GET transaction by M-Pesa code (to prevent duplicates)
 */
export const getTransactionByMpesaCode = query({
  args: { mpesa_code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("mpesa_code"), args.mpesa_code))
      .first();
  },
});

export const getTransactionByCheckoutRequestId = query({
  args: { checkout_request_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_checkout_request_id", q => q.eq("checkout_request_id", args.checkout_request_id))
      .first();
  },
});


export const getRecentTransactionByPhone = query({
  args: { phone_number: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("phone_number"), args.phone_number))
      .order("desc")
      .take(1);
    
    return transactions[0] || null;
  },
});

export const getAllTransactions = query({
  handler: async (ctx) => {
    return await ctx.db.query("transactions").collect();
  },
});

export const getTransactionsByPhoneNumber = query({
  args: { phone_number: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("phone_number"), args.phone_number))
      .collect();
    
    return transactions;
  },
});