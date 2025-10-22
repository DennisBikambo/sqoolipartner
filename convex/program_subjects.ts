import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createProgramSubject = mutation({
  args: {
    program_id: v.id("programs"),
    subject_id: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("program_subjects", args);
  },
});

export const listProgramSubjects = query({
  handler: async (ctx) => await ctx.db.query("program_subjects").collect(),
});

export const getProgramSubject = query({
  args: { id: v.id("program_subjects") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const updateProgramSubject = mutation({
  args: {
    id: v.id("program_subjects"),
    fields: v.record(v.string(), v.any()),
  },
  handler: async (ctx, { id, fields }) => {
    return await ctx.db.patch(id, fields);
  },
});

export const deleteProgramSubject = mutation({
  args: { id: v.id("program_subjects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
