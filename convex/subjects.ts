import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSubject = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("subjects", { ...args, created_at: now });
  },
});

export const listSubjects = query({
  handler: async (ctx) => await ctx.db.query("subjects").collect(),
});

export const getSubject = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const updateSubject = mutation({
  args: {
    id: v.id("subjects"),
    fields: v.record(v.string(), v.any()),
  },
  handler: async (ctx, { id, fields }) => {
    return await ctx.db.patch(id, fields);
  },
});

export const deleteSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
