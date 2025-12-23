# Deep Research Agent - Frontend

Next.js 15 chat interface for the Deep Research Agent with Supabase authentication. Includes **Matters & Document Management** for organizing legal work with AI-powered document analysis.

## Quick Start

```bash
# From repo root
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable                                       | Description                                    | Required              |
| ---------------------------------------------- | ---------------------------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase project URL                           | Yes                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anon key                              | Yes                   |
| `NEXT_PUBLIC_API_URL`                          | Agent API URL (local: `http://localhost:2024`) | Yes                   |
| `NEXT_PUBLIC_ASSISTANT_ID`                     | Graph ID (default: `deep_research`)            | Yes                   |
| `LANGGRAPH_API_URL`                            | LangSmith deployment URL                       | Production            |
| `LANGSMITH_API_KEY`                            | LangSmith API key                              | Production            |
| `ISAACUS_API_KEY`                              | Isaacus API key for legal AI                   | For document analysis |

## Features

### Matters & Document Management

Organize legal work into **Matters** (cases/projects) with full document management:

- **Create Matters**: Organize legal cases with auto-generated matter numbers (e.g., `MAT-2024-00001`)
- **Upload Documents**: Drag-and-drop PDF, DOCX, and TXT files with Supabase Storage
- **AI Document Processing**: Automatic text extraction and semantic embedding generation
- **Semantic Search**: Find relevant documents using natural language queries via Isaacus
- **Participant Management**: Invite counsel, clients, and observers with role-based access
- **Document Analysis**: Extract key terms, classify clauses, and get AI-powered answers

### Keyboard Shortcuts

| Shortcut            | Action            |
| ------------------- | ----------------- |
| `⌘/Ctrl + N`        | Create new matter |
| `⌘/Ctrl + K` or `/` | Focus search      |
| `Escape`            | Close dialogs     |

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (embed proxy, etc.)
│   ├── auth/          # Auth pages (login, signup, etc.)
│   └── protected/
│       └── matters/   # Matters management pages
├── components/
│   ├── documents/     # Document upload, list, search components
│   ├── matters/       # Matter management components
│   ├── thread/        # Chat thread components
│   └── ui/            # Shadcn UI components
├── hooks/
│   ├── use-matters.ts     # Matter CRUD operations
│   ├── use-documents.ts   # Document management
│   ├── use-participants.ts # Participant management
│   └── use-supabase-upload.ts # File upload hook
├── lib/
│   └── supabase/      # Supabase client (browser/server)
├── middleware.ts      # Auth protection middleware
└── providers/         # Context providers
```

## Authentication

Uses Supabase Auth with:

- Email/password login and signup
- Email confirmation flow
- Password reset
- Cookie-based sessions
- Middleware route protection

All protected routes require authentication. The auth flow is:

1. User logs in → Supabase returns JWT (stored in cookies)
2. Frontend sends JWT to agent via Authorization header
3. Agent validates JWT against Supabase
4. All data is scoped to authenticated user

### Row Level Security (RLS)

All database tables have RLS policies enforcing access control:

- **Matters**: Users can only see matters they created or are participants in
- **Documents**: Access follows matter permissions
- **Participants**: Counsel can manage participants in their matters

## Document Processing Pipeline

1. User uploads file via Dropzone component
2. File stored in Supabase Storage at `matters/{matter_id}/{filename}`
3. Database record created with status `processing`
4. Edge Function triggered to:
   - Download file from storage
   - Extract text (PDF/DOCX/TXT)
   - Generate semantic embeddings via Isaacus API
   - Store embeddings in pgvector for search
5. Document status updated to `ready`

## Development

```bash
# Run frontend only
pnpm dev

# Run frontend + agent
pnpm dev:all  # from repo root

# Lint
pnpm lint

# Build for production
pnpm build
```

## Deployment

Deploy to Vercel:

1. Import repository in Vercel
2. Set **Root Directory** to `apps/frontend`
3. Add all environment variables
4. Deploy

### Supabase Setup

Ensure these are configured in your Supabase project:

1. **Storage Bucket**: Create `documents` bucket with RLS policies
2. **Edge Function**: Deploy `process-document` function
3. **Database Webhook**: Trigger edge function on document insert
4. **pgvector Extension**: Enable for semantic search

See `specs/004-matters-documents/quickstart.md` for detailed setup.

See main `README.md` for full deployment guide.
