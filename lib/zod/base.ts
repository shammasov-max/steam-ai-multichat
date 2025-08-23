import { z } from 'zod'

export const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const BaseActionInput = z.object({
  // Common validation patterns can be added here
})

export const SteamId64Schema = z.string().regex(/^\d{17}$/, 'Must be a valid 17-digit Steam ID64')

export const PriceSchema = z.number().min(0, 'Price must be non-negative')

export const ProxyUrlSchema = z.string().regex(
  /^(http|https|socks4|socks5):\/\/.+/,
  'Must be a valid proxy URL (http://user:pass@host:port)'
)

export const ItemNameSchema = z.string().min(1, 'Item name is required').max(200, 'Item name too long')

export const LabelSchema = z.string().min(1).max(50).optional()

export const MessageTextSchema = z.string().min(1).max(1000)

export const DateTimeStringSchema = z.string().datetime().optional()