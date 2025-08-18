// ============= Bots Slice =============
export { 
  botSlice, 
  type Bot, 
  BotSchema 
} from './bots';

// ============= Tasks Slice =============
export { 
  taskSlice, 
  type Task, 
  TaskSchema 
} from './tasks';

// ============= Core Types =============
export { 
  type BotStatus, 
  type TaskStatus,
  BotId,
  TaskId,
  ChatId,
  SteamID64 
} from '../events/core';

// ============= Chats Slice =============
export { 
  chatSlice, 
  type Chat, 
  type ChatMsg,
  type ChatMsgFrom,
  ChatSchema,
  ChatMsgSchema
} from './chats';

// ============= System Slice =============
export { 
  systemSlice, 
  type System,
  type RoundRobinState,
  type RateLimitEntry,
  SystemSchema,
  RoundRobinSchema,
  RateLimitEntrySchema
} from './system';

// ============= Proxies Slice =============
export { 
  proxySlice, 
  type Proxy, 
  type ProxyStatus, 
  ProxySchema 
} from './proxies';

// ============= MaFiles Slice =============
export { 
  maFileSlice, 
  type MaFile, 
  MaFileSchema 
} from './maFiles';

// ============= Re-export all slices for convenient store setup =============

import { botSlice } from './bots';
import { taskSlice } from './tasks';
import { chatSlice } from './chats';
import { systemSlice } from './system';
import { proxySlice } from './proxies';
import { maFileSlice } from './maFiles';

/**
 * All slice reducers ready to be mounted in the store
 * Keys are pluralized as per createEntitySlice convention
 */
export const sliceReducers = {
  bots: botSlice.reducer,
  tasks: taskSlice.reducer,
  chats: chatSlice.reducer,
  systems: systemSlice.reducer, // Note: 'systems' plural even though it's singleton
  proxies: proxySlice.reducer,
  maFiles: maFileSlice.reducer
} as const;

/**
 * All slice actions for convenient access
 */
export const sliceActions = {
  bots: botSlice.actions,
  tasks: taskSlice.actions,
  chats: chatSlice.actions,
  systems: systemSlice.actions,
  proxies: proxySlice.actions,
  maFiles: maFileSlice.actions
} as const;

/**
 * All slice selectors for convenient access
 */
export const sliceSelectors = {
  bots: {
    selectEntity: botSlice.selectEntity,
    selectAllEntities: botSlice.selectAllEntities,
    selectEntityIds: botSlice.selectEntityIds
  },
  tasks: {
    selectEntity: taskSlice.selectEntity,
    selectAllEntities: taskSlice.selectAllEntities,
    selectEntityIds: taskSlice.selectEntityIds
  },
  chats: {
    selectEntity: chatSlice.selectEntity,
    selectAllEntities: chatSlice.selectAllEntities,
    selectEntityIds: chatSlice.selectEntityIds
  },
  systems: {
    selectEntity: systemSlice.selectEntity,
    selectAllEntities: systemSlice.selectAllEntities,
    selectEntityIds: systemSlice.selectEntityIds,
    // Helper selector for the singleton system entity
    selectSystem: (state: ReturnType<typeof systemSlice.reducer>) => 
      systemSlice.selectEntity(state, 'system')
  },
  proxies: {
    selectEntity: proxySlice.selectEntity,
    selectAllEntities: proxySlice.selectAllEntities,
    selectEntityIds: proxySlice.selectEntityIds
  },
  maFiles: {
    selectEntity: maFileSlice.selectEntity,
    selectAllEntities: maFileSlice.selectAllEntities,
    selectEntityIds: maFileSlice.selectEntityIds
  }
} as const;

// ============= Type exports for store setup =============

export type RootState = {
  bots: ReturnType<typeof botSlice.reducer>;
  tasks: ReturnType<typeof taskSlice.reducer>;
  chats: ReturnType<typeof chatSlice.reducer>;
  systems: ReturnType<typeof systemSlice.reducer>;
  proxies: ReturnType<typeof proxySlice.reducer>;
  maFiles: ReturnType<typeof maFileSlice.reducer>;
};
