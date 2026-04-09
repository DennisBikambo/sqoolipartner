import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const createSubject = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("subjects", { ...args, created_at: now });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "subjects.createSubject",
      status: "success",
      details: JSON.stringify({ id, name: args.name }),
    });
    return id;
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
    const result = await ctx.db.patch(id, fields);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "subjects.updateSubject",
      status: "success",
      details: JSON.stringify({ id, fields: Object.keys(fields) }),
    });
    return result;
  },
});

export const deleteSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "warn", source: "backend",
      event_name: "subjects.deleteSubject",
      status: "warn",
      details: JSON.stringify({ id: args.id, name: subject?.name }),
    });
  },
});
