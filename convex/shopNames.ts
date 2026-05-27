import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listShopNames = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('shopNames').collect()
  },
})

export const createShop = mutation({
  args: {
    shopName: v.string(),
    shopType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('shopNames', args)
  },
})

export const updateShop = mutation({
  args: {
    id: v.id('shopNames'),
    shopName: v.optional(v.string()),
    shopType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
    return await ctx.db.get(id)
  },
})

export const deleteShop = mutation({
  args: { id: v.id('shopNames') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const importShopNames = mutation({
  args: {
    shops: v.array(
      v.object({
        shopName: v.string(),
        shopType: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const shop of args.shops) {
      await ctx.db.insert('shopNames', shop)
    }
    return true
  },
})
