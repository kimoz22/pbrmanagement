import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})

export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    status: v.union(v.literal('Active'), v.literal('Inactive')),
    role: v.union(v.literal('Admin'), v.literal('Manager'), v.literal('Staff')),
    allowedComponents: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('users', args)
  },
})

export const updateUser = mutation({
  args: {
    id: v.id('users'),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    status: v.optional(v.union(v.literal('Active'), v.literal('Inactive'))),
    role: v.optional(v.union(v.literal('Admin'), v.literal('Manager'), v.literal('Staff'))),
    allowedComponents: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
    return await ctx.db.get(id)
  },
})

export const deleteUser = mutation({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const authenticateUser = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const normalizePassword = (pwd: string) => {
      if (!pwd) return pwd
      return pwd[0].toLowerCase() + pwd.slice(1)
    }
    
    const all = await ctx.db.query('users').collect()
    const inputPasswordNorm = normalizePassword(args.password)
    const user = all.find(
      (u: any) => u.username === args.username && normalizePassword(u.password) === inputPasswordNorm && u.status === 'Active',
    )
    if (!user) return null
    // return user without password
    const { password, ...rest } = user as any
    return rest
  },
})
