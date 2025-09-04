# @packages/frontend

React-based single-page application for the Effect-Redux Steam Multichat System, providing real-time monitoring and control of AI-powered dialogs.

## Features

- 🎮 **Steam-Themed UI** - Dark theme optimized for gaming operations
- 📊 **Real-Time Updates** - Server-Sent Events (SSE) for instant state synchronization
- 🤖 **AI Dialog Management** - Monitor and control AI-powered conversations
- 📈 **Assessment Dashboard** - Visual scoring factors and trend analysis
- 🚨 **Operator Alerts** - Prominent display of dialogs needing attention
- 🌐 **Multi-Language Support** - UI adapts to dialog languages (zh, ja, ko, en, es)
- 📱 **Responsive Design** - Works on desktop and tablet devices

## Tech Stack

- **React 18** - UI framework with concurrent features
- **TypeScript** - Full type safety
- **Redux Toolkit** - State management (isomorphic with backend)
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tooling
- **React Router** - Client-side routing
- **Recharts** - Data visualization for metrics
- **React Hook Form** - Form management
- **Zod** - Runtime validation

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout/        # Page layout components
│   │   ├── Header/        # Navigation header
│   │   ├── Sidebar/       # Navigation sidebar
│   │   ├── Modal/         # Modal system
│   │   └── common/        # Shared components
│   ├── pages/             # Route pages
│   │   ├── AccountsPage/  # Account management
│   │   ├── DialogsPage/   # Dialog monitoring
│   │   ├── MultichatPage/ # Multichat interface
│   │   └── SystemPage/    # System status
│   ├── features/          # Feature modules
│   │   ├── accounts/      # Account slice and hooks
│   │   ├── dialogs/       # Dialog slice and hooks
│   │   └── system/        # System slice and hooks
│   ├── services/          # API and SSE services
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── styles/            # Global styles
│   └── types/             # TypeScript types
├── public/                # Static assets
├── index.html            # HTML entry point
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite configuration
└── tailwind.config.js    # Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager
- Backend server running (see packages/server)

### Installation

```bash
# From project root
yarn workspace @packages/frontend install

# Or from frontend directory
cd packages/frontend
yarn install
```

### Development

```bash
# Start development server
yarn dev

# The app will be available at http://localhost:5173
```

### Environment Variables

Create `.env.local` in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_SSE_URL=http://localhost:3000/api/event-stream

# Feature Flags (optional)
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_MODE=false
```

## Available Scripts

```bash
# Development
yarn dev              # Start dev server
yarn build           # Build for production
yarn preview         # Preview production build
yarn typecheck       # Run TypeScript checks

# Testing
yarn test            # Run tests
yarn test:ui         # Run tests with UI
yarn test:coverage   # Generate coverage report

# Code Quality
yarn lint            # Run ESLint
yarn lint:fix        # Fix linting issues
yarn format          # Format with Prettier
```

## Key Components

### Layout Components

#### AppLayout
Main application layout with header, sidebar, and content area:

```tsx
import { AppLayout } from '@/components/Layout'

function App() {
    return (
        <AppLayout>
            <YourContent />
        </AppLayout>
    )
}
```

#### Header
Navigation header with connection status and user info:

```tsx
import { Header } from '@/components/Header'

<Header 
    connectionStatus="connected"
    userName="operator@steam"
/>
```

### Feature Components

#### AccountList
Display and manage Steam accounts:

```tsx
import { AccountList } from '@/features/accounts'

<AccountList 
    onAdd={handleAddAccount}
    onRemove={handleRemoveAccount}
/>
```

#### DialogMonitor
Real-time dialog monitoring with assessment:

```tsx
import { DialogMonitor } from '@/features/dialogs'

<DialogMonitor 
    dialogId={selectedDialogId}
    onTakeControl={handleTakeControl}
/>
```

#### MultichatView
Multi-conversation management interface:

```tsx
import { MultichatView } from '@/features/multichat'

<MultichatView 
    onSendMessage={handleSendMessage}
    onToggleAgent={handleToggleAgent}
/>
```

## State Management

### Redux Store Structure

```typescript
{
    accounts: {
        entities: { [id: string]: Account }
        ids: string[]
        status: 'idle' | 'loading' | 'succeeded' | 'failed'
    },
    dialogs: {
        entities: { [id: string]: Dialog }
        ids: string[]
        activeDialogId: string | null
    },
    system: {
        sseStatus: 'connecting' | 'connected' | 'disconnected'
        roundRobin: { pointer: number, eligibleAccountIds: string[] }
        alerts: Alert[]
    }
}
```

### Using Hooks

```typescript
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { selectAccountById, connectAccount } from '@/features/accounts'

function AccountDetail({ accountId }: Props) {
    const dispatch = useAppDispatch()
    const account = useAppSelector(state => selectAccountById(state, accountId))
    
    const handleConnect = () => {
        dispatch(connectAccount(accountId))
    }
    
    return (
        <div>
            <h2>{account.label}</h2>
            <p>Status: {account.status}</p>
            <button onClick={handleConnect}>Connect</button>
        </div>
    )
}
```

## Server-Sent Events (SSE)

### SSE Connection Management

```typescript
import { useSSE } from '@/hooks/useSSE'

function App() {
    const { status, error } = useSSE({
        url: import.meta.env.VITE_SSE_URL,
        onSnapshot: (snapshot) => {
            // Handle initial state snapshot
            dispatch(replaceState(snapshot))
        },
        onBatch: (events) => {
            // Handle event batch
            events.forEach(event => dispatch(event))
        }
    })
    
    if (status === 'connecting') return <LoadingScreen />
    if (error) return <ErrorScreen error={error} />
    
    return <MainApp />
}
```

## Styling

### Tailwind Classes

The project uses custom Tailwind configuration for Steam-themed styling:

```tsx
// Primary button
<button className="btn-primary">
    Connect Account
</button>

// Alert styles
<div className="alert alert-warning">
    Dialog score below threshold
</div>

// Card component
<div className="card">
    <div className="card-header">
        <h3 className="card-title">Account Status</h3>
    </div>
    <div className="card-body">
        {/* Content */}
    </div>
</div>
```

### Theme Configuration

```javascript
// tailwind.config.js
module.exports = {
    theme: {
        extend: {
            colors: {
                steam: {
                    dark: '#171a21',
                    blue: '#66c0f4',
                    green: '#5c7e10',
                    gray: '#2a475e'
                }
            }
        }
    }
}
```

## Performance Optimization

### Code Splitting

Routes are lazy-loaded for optimal bundle size:

```typescript
import { lazy, Suspense } from 'react'

const AccountsPage = lazy(() => import('./pages/AccountsPage'))
const DialogsPage = lazy(() => import('./pages/DialogsPage'))

function Routes() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/dialogs" element={<DialogsPage />} />
        </Suspense>
    )
}
```

### Memoization

Components use React.memo and useMemo for performance:

```typescript
import { memo, useMemo } from 'react'

export const DialogList = memo(({ dialogs, filter }: Props) => {
    const filteredDialogs = useMemo(
        () => dialogs.filter(d => matchesFilter(d, filter)),
        [dialogs, filter]
    )
    
    return (
        <div>
            {filteredDialogs.map(dialog => (
                <DialogItem key={dialog.id} dialog={dialog} />
            ))}
        </div>
    )
})
```

## Building for Production

```bash
# Build the application
yarn build

# Output will be in dist/ directory
# Deploy contents of dist/ to your web server

# Preview production build locally
yarn preview
```

### Build Optimization

Vite automatically:
- Minifies JavaScript and CSS
- Splits vendor chunks
- Generates source maps
- Optimizes images
- Tree-shakes unused code

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { AccountList } from './AccountList'

describe('AccountList', () => {
    it('should display accounts', () => {
        const accounts = [
            { id: 'acc_1', label: 'Account 1', status: 'connected' }
        ]
        
        render(<AccountList accounts={accounts} />)
        
        expect(screen.getByText('Account 1')).toBeInTheDocument()
        expect(screen.getByText('connected')).toBeInTheDocument()
    })
})
```

### Integration Tests

```typescript
import { renderWithProviders } from '@/test/utils'
import { MultichatPage } from '@/pages/MultichatPage'

it('should handle message sending', async () => {
    const { user } = renderWithProviders(<MultichatPage />)
    
    const input = screen.getByPlaceholderText('Type a message...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(input, 'Hello, player!')
    await user.click(sendButton)
    
    expect(screen.getByText('Hello, player!')).toBeInTheDocument()
})
```

## Common Issues & Solutions

### SSE Connection Issues

If SSE fails to connect:
1. Check backend is running
2. Verify VITE_SSE_URL in .env.local
3. Check for CORS issues
4. Ensure no proxy is blocking SSE

### State Synchronization

If state gets out of sync:
1. Check Redux DevTools for action flow
2. Verify SSE events are being received
3. Look for errors in browser console
4. Try refreshing to get new snapshot

### Build Errors

Common build issues:
- Clear node_modules and reinstall
- Check for TypeScript errors with `yarn typecheck`
- Ensure all imports are correct
- Verify environment variables are set

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Frontend-Specific Guidelines

1. **Component Structure**: Use functional components with hooks
2. **State Management**: Keep local state minimal, use Redux for shared state
3. **Styling**: Use Tailwind classes, avoid inline styles
4. **Type Safety**: Always define TypeScript interfaces for props
5. **Testing**: Write tests for new components and features
6. **Performance**: Use React.memo for expensive components
7. **Accessibility**: Include ARIA labels and keyboard navigation

## License

Part of the Effect-Redux project. See root LICENSE file.