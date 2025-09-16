import { test, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import {
  createEntitySlice,
  addEntity,
  removeEntity,
  updateEntity,
  isEntityWithId,
  type EntityState,
  type EntityWithId,
} from '../src/base/createEntitySlice';

// ============= Types used in tests =============

type User = {
  readonly userId: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: number; // Store as epoch milliseconds to maintain Redux serialization
};

type Product = {
  readonly productId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
};

// ============= Tests =============

test('createEntitySlice: initializes state and selectors work', async () => {
  const userSlice = createEntitySlice({
    name: 'user',
    initialEntities: [
      {
        userId: 'user-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'admin',
        createdAt: new Date('2024-01-01').getTime(),
      },
      {
        userId: 'user-2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'user',
        createdAt: new Date('2024-01-15').getTime(),
      },
    ],
    entityReducers: {
      updateName: (user, payload: { userId: string; name: string }) => {
        user.name = payload.name;
      },
      changeRole: (user, payload: { userId: string; role: User['role'] }) => {
        user.role = payload.role;
      },
    },
  });

  expect(userSlice.name).toBe('users');

  const store = configureStore({
    reducer: {
      users: userSlice.reducer,
    },
  });

  // Initial state assertions
  let state = store.getState();
  expect(userSlice.selectors.selectEntityIds(state.users)).toEqual(['user-1', 'user-2']);
  expect(userSlice.selectors.selectEntity(state.users, 'user-1')?.name).toBe('Alice Johnson');
  expect(userSlice.selectors.selectAllEntities(state.users)).toHaveLength(2);

  // Updates via reducers
  store.dispatch(userSlice.actions.updateName({ userId: 'user-1', name: 'Alice Williams' }));
  store.dispatch(userSlice.actions.changeRole({ userId: 'user-2', role: 'admin' }));

  state = store.getState();
  expect(userSlice.selectors.selectEntity(state.users, 'user-1')?.name).toBe('Alice Williams');
  expect(userSlice.selectors.selectEntity(state.users, 'user-2')?.role).toBe('admin');
});


test('createEntitySlice: warns and does nothing when entity is not found', async () => {
  const productSlice = createEntitySlice({
    name: 'product' as const,
    entityReducers: {
      updatePrice: (product: any, payload: { productId: string; price: number }) => {
        product.price = payload.price;
      },
      adjustStock: (product: any, payload: { productId: string; delta: number }) => {
        product.stock = Math.max(0, product.stock + payload.delta);
      },
    },
  });

  const store = configureStore({
    reducer: {
      products: productSlice.reducer,
    },
  });

  const originalLog = console.log;
  let logCalled = 0;
  let lastLogMsg = '';
  console.log = (msg?: unknown, ..._rest: unknown[]) => {
    logCalled += 1;
    lastLogMsg = String(msg);
  };

  try {
    store.dispatch(productSlice.actions.updatePrice({ productId: 'prod-123', price: 29.99 }));
  } finally {
    console.log = originalLog;
  }

  const state = store.getState();
  expect(logCalled).toBe(1);
  
  // Parse the JSON log to check the content
  const logEntry = JSON.parse(lastLogMsg);
  expect(logEntry.level).toBe('WARN');
  expect(logEntry.message).toBe('Entity not found');
  expect(logEntry.entityId).toBe('prod-123');
  expect(productSlice.selectors.selectEntity(state.products, 'prod-123')).toBeUndefined();
});


test('createEntitySlice: respects custom pluralize function', async () => {
  const categorySlice = createEntitySlice({
    name: 'category',
    entityReducers: {
      rename: (category, payload: { categoryId: string; name: string }) => {
        (category as any).name = payload.name;
      },
    },
    pluralizeFn: (singular) => (singular === 'category' ? 'categories' : singular + 's'),
  });

  expect(categorySlice.name).toBe('categories');
});


test('utilities: addEntity, updateEntity, removeEntity, isEntityWithId', async () => {
  type UserAttrs = { name: string };
  const state: EntityState<EntityWithId<'user', UserAttrs>> = {
    entities: {},
    ids: [],
  };

  const user1: EntityWithId<'user', UserAttrs> = { userId: 'user-1', name: 'A' };

  // addEntity adds new entity and id
  addEntity(state, user1, 'user');
  expect(state.ids).toEqual(['user-1']);
  expect(state.entities['user-1']).toEqual(user1);

  // addEntity is idempotent for existing id
  addEntity(state, user1, 'user');
  expect(state.ids).toEqual(['user-1']);

  // updateEntity merges fields
  updateEntity(state, 'user-1', { name: 'B' });
  expect((state.entities['user-1'] as EntityWithId<'user', UserAttrs>).name).toBe('B');

  // isEntityWithId type guard
  expect(isEntityWithId<'user', UserAttrs>(user1, 'user')).toBe(true);
  expect(isEntityWithId<'user', UserAttrs>({ id: 'x' } as any, 'user')).toBe(false);

  // removeEntity deletes and updates ids
  removeEntity(state, 'user-1');
  expect(state.ids).toEqual([]);
  expect(state.entities['user-1']).toBeUndefined();
});
