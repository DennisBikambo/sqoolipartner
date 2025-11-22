import {mutation,query} from "./_generated/server"
import { v } from "convex/values"



export const createTransaction = mutation({
    args:{
        student_name:v.string(),
        phone_number:v.string(),
        mpesa_code:v.string(),
        amount:v.float64(),
        campaign_code:v.string(),
        partner_id:v.id("partners"),
        status:v.string()
    },
    handler:async (ctx,args) =>{
        const now = new Date().toISOString()
        return await ctx.db.insert('transactions',{
            ...args,
            created_at:now,
        })
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
    fields: v.record(v.string(), v.any()),
  },
  handler: async (ctx, { id, fields }) => {
    return await ctx.db.patch(id, { ...fields, verified_at: new Date().toISOString() });
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
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
      .filter(q => q.eq(q.field("mpesa_code"), args.checkout_request_id))
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