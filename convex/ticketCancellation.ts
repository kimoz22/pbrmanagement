import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listTicketCancellations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ticketCancellations").collect();
  },
});

export const getTicketCancellation = query({
  args: { id: v.id("ticketCancellations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createTicketCancellation = mutation({
  args: {
    requestee: v.string(),
    requestedDate: v.number(),
    tpmNo: v.string(),
    retailerID: v.string(),
    toCancel: v.string(),
    replacement: v.string(),
    amount: v.number(),
    reason: v.string(),
    customerNo: v.string(),
    approver: v.string(),
    status: v.union(v.literal("Pending"), v.literal("Approved"), v.literal("Rejected")),
    approverComments: v.optional(v.string()),
    dateApproved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ticketCancellations", args);
  },
});

export const updateTicketCancellation = mutation({
  args: {
    id: v.id("ticketCancellations"),
    requestee: v.optional(v.string()),
    requestedDate: v.optional(v.number()),
    tpmNo: v.optional(v.string()),
    retailerID: v.optional(v.string()),
    toCancel: v.optional(v.string()),
    replacement: v.optional(v.string()),
    amount: v.optional(v.number()),
    reason: v.optional(v.string()),
    customerNo: v.optional(v.string()),
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

export const deleteTicketCancellation = mutation({
  args: { id: v.id("ticketCancellations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
