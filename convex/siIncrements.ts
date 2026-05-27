import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listSIIncrements = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("siIncrements").collect();
  },
});

export const getSIIncrement = query({
  args: { id: v.id("siIncrements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createSIIncrement = mutation({
  args: {
    requestee: v.string(),
    requestedDate: v.number(),
    shopName: v.string(),
    amount: v.number(),
    approver: v.string(),
    status: v.union(v.literal("Pending"), v.literal("Approved"), v.literal("Rejected")),
    approverComments: v.optional(v.string()),
    dateApproved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("siIncrements", args);
  },
});

export const updateSIIncrement = mutation({
  args: {
    id: v.id("siIncrements"),
    requestee: v.optional(v.string()),
    requestedDate: v.optional(v.number()),
    shopName: v.optional(v.string()),
    amount: v.optional(v.number()),
    approver: v.optional(v.string()),
    status: v.optional(v.union(v.literal("Pending"), v.literal("Approved"), v.literal("Rejected"))),
    approverComments: v.optional(v.string()),
    dateApproved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const deleteSIIncrement = mutation({
  args: { id: v.id("siIncrements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
