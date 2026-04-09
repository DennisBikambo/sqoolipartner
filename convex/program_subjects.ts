import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const createProgramSubject = mutation({
  args: {
    program_id: v.id("programs"),
    subject_id: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("program_subjects", args);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "program_subjects.createProgramSubject",
      status: "success",
      details: JSON.stringify({ id, program_id: args.program_id, subject_id: args.subject_id }),
    });
    return id;
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
    const result = await ctx.db.patch(id, fields);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "program_subjects.updateProgramSubject",
      status: "success",
      details: JSON.stringify({ id, fields: Object.keys(fields) }),
    });
    return result;
  },
});

export const deleteProgramSubject = mutation({
  args: { id: v.id("program_subjects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "warn", source: "backend",
      event_name: "program_subjects.deleteProgramSubject",
      status: "warn",
      details: JSON.stringify({ id: args.id }),
    });
  },
});
