import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  siIncrements: defineTable({
    requestee: v.string(),
    requestedDate: v.number(),
    shopName: v.string(),
    amount: v.number(),
    approver: v.string(),
    status: v.union(v.literal("Pending"), v.literal("Approved"), v.literal("Rejected")),
    approverComments: v.optional(v.string()),
    dateApproved: v.optional(v.number()),
  }).index("by_status", ["status"]),

  ticketCancellations: defineTable({
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
  }).index("by_status", ["status"]),

  shopNames: defineTable({
    shopName: v.string(),
    shopType: v.string(),
  }),

  users: defineTable({
    username: v.string(),
    password: v.string(),
    status: v.union(v.literal('Active'), v.literal('Inactive')),
    role: v.union(v.literal('Admin'), v.literal('Manager'), v.literal('Staff')),
    allowedComponents: v.optional(v.array(v.string())),
  }),
});
