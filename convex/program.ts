import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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
    const id = await ctx.db.insert("programs", { ...args, created_at: now, updated_at: now });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "program.createProgram",
      status: "success",
      details: JSON.stringify({ id, name: args.name, curriculum_id: args.curriculum_id, pricing: args.pricing }),
    });
    return id;
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
    const result = await ctx.db.patch(id, { ...fields, updated_at: new Date().toISOString() });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "program.updateProgram",
      status: "success",
      details: JSON.stringify({ id, fields: Object.keys(fields) }),
    });
    return result;
  },
});

export const deleteProgram = mutation({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "warn", source: "backend",
      event_name: "program.deleteProgram",
      status: "warn",
      details: JSON.stringify({ id: args.id, name: program?.name }),
    });
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
