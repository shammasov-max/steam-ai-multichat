import { configureStore } from '@reduxjs/toolkit';
import { Schema } from '@effect/schema';
import { createEntitySlice } from '../createEntitySlice';

// ============= Define Entity Types =============

/**
 * User entity
 */
type User = {
  readonly userId: string;  // This follows the {TName}Id pattern
  readonly name: string;
  readonly email: string;
  readonly role: 'admin' | 'user' | 'guest';
  readonly createdAt: Date;
};

/**
 * Product entity
 */
type Product = {
  readonly productId: string;  // This follows the {TName}Id pattern
  readonly name: string;
  readonly price: number;
  readonly stock: number;
  readonly category: string;
};

// ============= Define Schemas (optional) =============

const UserSchema = Schema.Struct({
  userId: Schema.String,
  name: Schema.String,
  email: Schema.String,
  role: Schema.Union(
    Schema.Literal('admin'),
    Schema.Literal('user'),
    Schema.Literal('guest')
  ),
  createdAt: Schema.Date
});

const ProductSchema = Schema.Struct({
  productId: Schema.String,
  name: Schema.String,
  price: Schema.Number,
  stock: Schema.Number,
  category: Schema.String
});

// ============= Create User Slice =============

const userSlice = createEntitySlice({
  name: 'user',  // Singular name, will be pluralized to 'users'
  
  initialEntities: [
    {
      userId: 'user-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-01')
    },
    {
      userId: 'user-2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'user',
      createdAt: new Date('2024-01-15')
    }
  ],
  
  entityReducers: {
    // Reducer with additional payload
    updateName: (user, payload: { userId: string; name: string }) => {
      user.name = payload.name;
    },
    
    // Reducer with complex payload
    updateEmail: (user, payload: { userId: string; email: string; verified?: boolean }) => {
      user.email = payload.email;
    },
    
    // Reducer that changes role
    changeRole: (user, payload: { userId: string; role: User['role'] }) => {
      user.role = payload.role;
    },
    
    // Reducer with only entityId (no additional payload)
    promoteToAdmin: (user, payload: { userId: string }) => {
      user.role = 'admin';
    }
  },
  

});

// ============= Create Product Slice =============

const productSlice = createEntitySlice({
  name: 'product',  // Will be pluralized to 'products'
  
  entityReducers: {
    updatePrice: (product, payload: { productId: string; price: number }) => {
      product.price = payload.price;
    },
    
    adjustStock: (product, payload: { productId: string; delta: number }) => {
      product.stock = Math.max(0, product.stock + payload.delta);
    },
    
    changeCategory: (product, payload: { productId: string; category: string }) => {
      product.category = payload.category;
    },
    
    applyDiscount: (product, payload: { productId: string; percentage: number }) => {
      product.price = product.price * (1 - payload.percentage / 100);
    }
  },
  
  entitySchema: ProductSchema
});

// ============= Configure Store =============

const store = configureStore({
  reducer: {
    users: userSlice.reducer,     // Note: slice name is 'users' (plural)
    products: productSlice.reducer // Note: slice name is 'products' (plural)
  }
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// ============= Usage Examples =============

// Example 1: Dispatch actions with entity ID
store.dispatch(userSlice.actions.updateName({ 
  userId: 'user-1',  // Required entity ID
  name: 'Alice Williams' 
}));

store.dispatch(userSlice.actions.changeRole({ 
  userId: 'user-2', 
  role: 'admin' 
}));

store.dispatch(productSlice.actions.updatePrice({ 
  productId: 'prod-123', 
  price: 29.99 
}));

// Example 2: Use selectors
const state = store.getState();

// Get specific user
const user1 = userSlice.selectEntity(state.users, 'user-1');
console.log('User 1:', user1);

// Get all users
const allUsers = userSlice.selectAllEntities(state.users);
console.log('All users:', allUsers);

// Get user IDs
const userIds = userSlice.selectEntityIds(state.users);
console.log('User IDs:', userIds);

// ============= Advanced Usage =============

// Example 3: Custom pluralization
const categorySlice = createEntitySlice({
  name: 'category',
  entityReducers: {
    rename: (category, payload: { categoryId: string; name: string }) => {
      (category as any).name = payload.name;
    }
  },
  pluralizeFn: (singular) => singular === 'category' ? 'categories' : singular + 's'
});

// Example 4: Type-safe action creators
type UserActions = typeof userSlice.actions;
type UpdateNameAction = ReturnType<UserActions['updateName']>;

// The action payload is fully typed
const updateAction: UpdateNameAction = userSlice.actions.updateName({
  userId: 'user-3',
  name: 'Charlie Brown'
});

// Example 5: Working with normalized state
function addNewUser(user: User) {
  // The state structure is normalized
  const currentState = store.getState().users;
  console.log('Entities map:', currentState.entities);
  console.log('IDs array:', currentState.ids);
  
  // You would typically handle this through additional reducers
  // This is just to demonstrate the state structure
}

// ============= Type Safety Examples =============

// This will cause TypeScript error - missing userId
// store.dispatch(userSlice.actions.updateName({ 
//   name: 'Invalid' 
// }));

// This will cause TypeScript error - wrong property name
// store.dispatch(userSlice.actions.updateName({ 
//   id: 'user-1',  // Should be userId
//   name: 'Invalid' 
// }));

// This will cause TypeScript error - invalid role value
// store.dispatch(userSlice.actions.changeRole({ 
//   userId: 'user-1',
//   role: 'superuser'  // Not a valid role
// }));

export { store, userSlice, productSlice, type RootState, type AppDispatch };
