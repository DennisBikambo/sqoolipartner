import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create
export const createCurriculum = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("curricula", {
      ...args,
      created_at: now,
      updated_at: now,
    });
  },
});

// Read All
export const listCurricula = query({
  handler: async (ctx) => {
    return await ctx.db.query("curricula").collect();
  },
});

// Read One
export const getCurriculum = query({
  args: { id: v.id("curricula") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update (Dynamic)
export const updateCurriculum = mutation({
  args: {
    id: v.id("curricula"),
    fields: v.record(v.string(), v.any()), 
  },
  handler: async (ctx, { id, fields }) => {
    return await ctx.db.patch(id, { ...fields, updated_at: new Date().toISOString() });
  },
});

// Delete
export const deleteCurriculum = mutation({
  args: { id: v.id("curricula") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
