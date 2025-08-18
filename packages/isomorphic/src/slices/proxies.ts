import { Schema } from '@effect/schema';
import { Draft } from '@reduxjs/toolkit';
import { createEntitySlice, type EntityActionPayload } from '../base/createEntitySlice';

// ============= Types =============

export type ProxyStatus = 'available' | 'in_use' | 'failed' | 'banned';

export interface Proxy {
  readonly proxyId: string;
  readonly host: string;
  readonly port: number;
  readonly username?: string;
  readonly password?: string;
  readonly protocol: 'http' | 'https' | 'socks4' | 'socks5';
  readonly status: ProxyStatus;
  readonly assignedBotId?: string | undefined;
  readonly lastUsed?: number;
  readonly failureCount: number;
}

// ============= Schema =============

export const ProxySchema = Schema.Struct({
  proxyId: Schema.String,
  host: Schema.String,
  port: Schema.Number,
  username: Schema.optional(Schema.String),
  password: Schema.optional(Schema.String),
  protocol: Schema.Union(
    Schema.Literal('http'),
    Schema.Literal('https'),
    Schema.Literal('socks4'),
    Schema.Literal('socks5')
  ),
  status: Schema.Union(
    Schema.Literal('available'),
    Schema.Literal('in_use'),
    Schema.Literal('failed'),
    Schema.Literal('banned')
  ),
  assignedBotId: Schema.optional(Schema.String),
  lastUsed: Schema.optional(Schema.Number),
  failureCount: Schema.Number
});

// ============= Create Slice =============

export const proxySlice = createEntitySlice({
  name: 'proxy',
  initialEntities: [] as Draft<Proxy>[],
  entityReducers: {
    // Event: proxy.assigned - payload comes from PayloadSchemas["proxy.assigned"]
    assigned: (proxy: Draft<Proxy>, payload: EntityActionPayload<'proxy', { botId: string }>) => {
      proxy.status = 'in_use';
      proxy.assignedBotId = payload.botId;
      proxy.lastUsed = Date.now();
    },
    
    // Event: proxy.released - payload comes from PayloadSchemas["proxy.released"] 
    released: (proxy: Draft<Proxy>) => {
      proxy.status = 'available';
      proxy.assignedBotId = undefined;
      proxy.lastUsed = Date.now();
    },
    
    // Event: proxy.failed - payload comes from PayloadSchemas["proxy.failed"]
    failed: (proxy: Draft<Proxy>, payload: EntityActionPayload<'proxy', { reason?: string }>) => {
      proxy.status = 'failed';
      proxy.failureCount = proxy.failureCount + 1;
      proxy.assignedBotId = undefined;
      proxy.lastUsed = Date.now();
    },
    
    // Event: proxy.banned - payload comes from PayloadSchemas["proxy.banned"]
    banned: (proxy: Draft<Proxy>, payload: EntityActionPayload<'proxy', { reason?: string }>) => {
      proxy.status = 'banned';
      proxy.assignedBotId = undefined;
      proxy.lastUsed = Date.now();
    },
    
    // Event: proxy.restored - payload comes from PayloadSchemas["proxy.restored"]
    restored: (proxy: Draft<Proxy>) => {
      proxy.status = 'available';
      proxy.failureCount = 0;
      proxy.assignedBotId = undefined;
      proxy.lastUsed = Date.now();
    }
  }
  
  // entitySchema: ProxySchema, // TODO: Fix schema type compatibility
});

// ============= Exports =============

export default proxySlice;