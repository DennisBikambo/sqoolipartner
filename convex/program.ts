import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createProgram = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("programs", { ...args, created_at: now, updated_at: now });
  },
});

export const listPrograms = query({
  handler: async (ctx) => await ctx.db.query("programs").collect(),
});

export const getProgramById = query({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const updateProgram = mutation({
  args: {
    id: v.id("programs"),
    fields: v.record(v.string(), v.any()),
  },
  handler: async (ctx, { id, fields }) => {
    return await ctx.db.patch(id, { ...fields, updated_at: new Date().toISOString() });
  },
});

export const deleteProgram = mutation({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getPurchasesCount = query({
  args: { program_id: v.id("programs") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("program_enrollments")
      .withIndex("by_program_id", (q) => q.eq("program_id", args.program_id))
      .collect();
    return enrollments.length;
  },
});
