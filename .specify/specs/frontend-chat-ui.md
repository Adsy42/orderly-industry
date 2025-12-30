# Frontend Chat UI Specification

## Overview

The frontend is a Next.js 15 application providing a chat interface for interacting with the LangGraph deep research agent. It handles authentication, thread management, message rendering, and artifact display.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Next.js Application                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                              App Router                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   /auth/*   │  │ /protected  │  │   /api/*    │  │      /      │    │ │
│  │  │  (public)   │  │  (private)  │  │  (proxy)    │  │   (root)    │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                             Providers                                   │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │ │
│  │  │  ThreadProvider │  │  StreamProvider │  │  SupabaseClient │         │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                            Components                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Thread  │  │ Messages │  │ Artifact │  │  Forms   │  │    UI    │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/frontend/src/
├── app/
│   ├── api/[..._path]/          # API passthrough to LangGraph
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   ├── update-password/
│   │   ├── confirm/              # Email verification handler
│   │   └── error/
│   ├── protected/                # Main authenticated area
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing/redirect page
│   └── globals.css               # Global styles
├── components/
│   ├── thread/                   # Chat thread components
│   │   ├── index.tsx             # Main thread component
│   │   ├── messages/             # Message renderers
│   │   ├── agent-inbox/          # Interrupt handling
│   │   ├── history/              # Thread history sidebar
│   │   ├── artifact.tsx          # Artifact panel
│   │   └── markdown-text.tsx     # Markdown rendering
│   ├── ui/                       # Shared UI components (shadcn)
│   └── [auth forms]              # Authentication form components
├── hooks/
│   ├── use-file-upload.tsx
│   └── useMediaQuery.tsx
├── lib/
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware utilities
│   └── utils.ts                  # General utilities
├── providers/
│   ├── Thread.tsx                # Thread state management
│   ├── Stream.tsx                # LangGraph streaming
│   └── client.ts                 # LangGraph client factory
└── middleware.ts                 # Route protection
```

## Core Components

### Thread Component

**Location:** `apps/frontend/src/components/thread/index.tsx`

**Purpose:** Main chat interface combining message list, input, and artifact panel.

**Structure:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Thread Component                                │
├──────────────────────────────────────────────────┬──────────────────────────┤
│                                                  │                          │
│  ┌────────────────────────────────────────────┐  │  ┌────────────────────┐  │
│  │              Message List                  │  │  │                    │  │
│  │  ┌──────────────────────────────────────┐  │  │  │                    │  │
│  │  │          Human Message               │  │  │  │                    │  │
│  │  └──────────────────────────────────────┘  │  │  │   Artifact Panel   │  │
│  │  ┌──────────────────────────────────────┐  │  │  │                    │  │
│  │  │           AI Message                 │  │  │  │   (Collapsible)    │  │
│  │  │      └── Tool Calls                  │  │  │  │                    │  │
│  │  └──────────────────────────────────────┘  │  │  │                    │  │
│  │  ┌──────────────────────────────────────┐  │  │  │                    │  │
│  │  │          Streaming...                │  │  │  │                    │  │
│  │  └──────────────────────────────────────┘  │  │  └────────────────────┘  │
│  └────────────────────────────────────────────┘  │                          │
│                                                  │                          │
│  ┌────────────────────────────────────────────┐  │                          │
│  │              Input Area                    │  │                          │
│  │  [                                    ]    │  │                          │
│  │  [Attachments]              [Send] ▶       │  │                          │
│  └────────────────────────────────────────────┘  │                          │
│                                                  │                          │
├──────────────────────────────────────────────────┴──────────────────────────┤
│                           Thread History (Sidebar)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Message Components

**Location:** `apps/frontend/src/components/thread/messages/`

| Component               | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `ai.tsx`                | AI response messages with markdown rendering |
| `human.tsx`             | User input messages                          |
| `tool-calls.tsx`        | Tool invocation and result display           |
| `generic-interrupt.tsx` | Agent interrupt/pause handling               |
| `shared.tsx`            | Common message utilities                     |

### Agent Inbox

**Location:** `apps/frontend/src/components/thread/agent-inbox/`

**Purpose:** Handle agent interrupts requiring user input.

**Components:**

- `inbox-item-input.tsx` - Input for responding to interrupts
- `state-view.tsx` - Display agent state
- `thread-actions-view.tsx` - Thread action buttons
- `tool-call-table.tsx` - Display pending tool calls

### Artifact Panel

**Location:** `apps/frontend/src/components/thread/artifact.tsx`

**Purpose:** Display research artifacts in a side panel.

**Features:**

- Collapsible panel
- Context-aware rendering
- Support for reports, code, and structured data

## Providers

### ThreadProvider

**Location:** `apps/frontend/src/providers/Thread.tsx`

**Purpose:** Manage thread state and history.

**State:**

```typescript
interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}
```

**Usage:**

```typescript
const { threads, getThreads, threadsLoading } = useThreads();
```

### StreamProvider

**Location:** `apps/frontend/src/providers/Stream.tsx`

**Purpose:** Manage LangGraph streaming connection.

**Features:**

- Real-time message streaming
- Automatic reconnection
- State synchronization

## UI Components (shadcn/ui)

**Location:** `apps/frontend/src/components/ui/`

Pre-built components:

- `button.tsx` - Button variants
- `card.tsx` - Card containers
- `input.tsx` - Text inputs
- `textarea.tsx` - Multi-line inputs
- `avatar.tsx` - User avatars
- `skeleton.tsx` - Loading states
- `tooltip.tsx` - Hover tooltips
- `sheet.tsx` - Slide-out panels
- `switch.tsx` - Toggle switches
- `separator.tsx` - Dividers
- `sonner.tsx` - Toast notifications

## Styling

### Tailwind Configuration

**Location:** `apps/frontend/tailwind.config.js`

**Theme Extensions:**

- Custom color palette
- Typography scale
- Animation utilities

### Global Styles

**Location:** `apps/frontend/src/app/globals.css`

- CSS variables for theming
- Base reset styles
- Utility classes

### Markdown Styles

**Location:** `apps/frontend/src/components/thread/markdown-styles.css`

- Code block styling
- Table formatting
- List styles
- Heading hierarchy

## State Management

### URL State (nuqs)

Query parameters for shareable state:

- `apiUrl` - LangGraph API endpoint
- `assistantId` - Assistant/graph ID
- `threadId` - Current thread ID

### Local State

- Message list (streaming updates)
- Input value
- Artifact panel state
- Thread selection

### Server State

- Thread history (fetched via LangGraph SDK)
- User session (Supabase cookies)

## API Integration

### LangGraph Client

**Location:** `apps/frontend/src/providers/client.ts`

```typescript
import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey?: string) {
  return new Client({
    apiUrl,
    apiKey,
  });
}
```

### API Passthrough

**Location:** `apps/frontend/src/app/api/[..._path]/route.ts`

Proxies requests to LangGraph server:

1. Receives client request
2. Adds authentication headers
3. Forwards to `LANGGRAPH_API_URL`
4. Streams response back

## Authentication Integration

### Protected Routes

Middleware redirects unauthenticated users to `/auth/login`.

### Session Access

Server components:

```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

Client components:

```typescript
const supabase = createClient();
const {
  data: { session },
} = await supabase.auth.getSession();
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=

# LangGraph
NEXT_PUBLIC_API_URL=           # Client-side API URL (/api for passthrough)
NEXT_PUBLIC_ASSISTANT_ID=      # Agent ID (deep_research)
LANGGRAPH_API_URL=             # Server-side LangGraph URL
LANGSMITH_API_KEY=             # API key for server-side requests
```

## Responsive Design

| Breakpoint     | Layout                                |
| -------------- | ------------------------------------- |
| < 768px        | Single column, stacked panels         |
| 768px - 1024px | Two columns, collapsible sidebar      |
| > 1024px       | Three columns with persistent sidebar |

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for modals/panels
- Screen reader friendly message announcements

## Performance Considerations

1. **Streaming responses** - Real-time display without blocking
2. **Message virtualization** - Long thread optimization (planned)
3. **Optimistic updates** - Immediate UI feedback
4. **Code splitting** - Route-based lazy loading
5. **Image optimization** - Next.js Image component for avatars

## Extension Points

### Adding Custom Message Types

1. Create component in `components/thread/messages/`
2. Add type detection in message renderer
3. Export from messages index

### Adding Artifact Types

1. Define renderer in `artifact.tsx`
2. Add type to artifact context
3. Update type detection logic

### Adding Theme Variants

1. Define CSS variables in `globals.css`
2. Add theme switcher component
3. Persist preference to `user_preferences` table



