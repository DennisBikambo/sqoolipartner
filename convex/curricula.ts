import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Create
export const createCurriculum = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("curricula", {
      ...args,
      created_at: now,
      updated_at: now,
    });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "curricula.createCurriculum",
      status: "success",
      details: JSON.stringify({ id, name: args.name }),
    });
    return id;
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
    const result = await ctx.db.patch(id, { ...fields, updated_at: new Date().toISOString() });
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "info", source: "backend",
      event_name: "curricula.updateCurriculum",
      status: "success",
      details: JSON.stringify({ id, fields: Object.keys(fields) }),
    });
    return result;
  },
});

// Delete
export const deleteCurriculum = mutation({
  args: { id: v.id("curricula") },
  handler: async (ctx, args) => {
    const curriculum = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await ctx.runMutation(internal.systemLogs.logEvent, {
      level: "warn", source: "backend",
      event_name: "curricula.deleteCurriculum",
      status: "warn",
      details: JSON.stringify({ id: args.id, name: curriculum?.name }),
    });
  },
});

export const getCurriculumById = query({
  args: { id: v.id("curricula") },
  handler: async (ctx, args) => {
    const curriculum = await ctx.db.get(args.id);
    return curriculum;
  },
});
