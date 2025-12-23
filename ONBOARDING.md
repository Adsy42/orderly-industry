# 🚀 New Developer Onboarding

Welcome! This guide will get you set up and productive quickly.

## ⏱️ Quick Setup (15 minutes)

### 1. Prerequisites

Ensure you have installed:

```bash
node --version   # >= 20.0.0
pnpm --version   # >= 9.0.0
python --version # >= 3.11
```

If not:

- Node.js: [nodejs.org](https://nodejs.org/) or use `nvm`
- pnpm: `npm install -g pnpm@9`
- Python: [python.org](https://python.org/) or use `pyenv`

### 2. Clone & Install

```bash
git clone https://github.com/Adsy42/orderly-industry.git
cd orderly-industry

# Frontend dependencies
pnpm install

# Agent dependencies
cd apps/agent
pip install -e ".[dev]"
cd ../..
```

### 3. Configure Environment

```bash
# Create env files from examples
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/agent/.env.example apps/agent/.env
```

Edit both files with your credentials:

**`apps/frontend/.env.local`** - Get Supabase credentials from project admin or Supabase dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

**`apps/agent/.env`** - Use your own API keys:

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (same as frontend)
- `ANTHROPIC_API_KEY` - [Get from Anthropic](https://console.anthropic.com/)
- `TAVILY_API_KEY` - [Get from Tavily](https://tavily.com/)
- `LANGSMITH_API_KEY` - [Get from LangSmith](https://smith.langchain.com/)

### 4. Run Everything

```bash
pnpm dev:all
```

- Frontend: http://localhost:3000
- Agent API: http://localhost:2024

---

## 📚 Key Documentation

| Document                                                           | What You'll Learn                             |
| ------------------------------------------------------------------ | --------------------------------------------- |
| [README.md](README.md)                                             | Architecture, deployment, full setup          |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                 | Development workflow, conventions, PR process |
| [.specify/memory/constitution.md](.specify/memory/constitution.md) | Core principles, coding standards             |
| [.cursor/rules/](.cursor/rules/)                                   | Database & SQL coding rules                   |

---

## 🎯 Development Workflow (Spec-Driven Development)

We use **Spec-Driven Development**. Every feature follows this flow:

```
Feature Request → Specification → Plan → Tasks → Implementation → PR
```

### Using SpecKit Commands in Cursor

These slash commands guide you through the workflow:

| Command              | Purpose                        |
| -------------------- | ------------------------------ |
| `/speckit.specify`   | Create a feature specification |
| `/speckit.clarify`   | Clarify ambiguous requirements |
| `/speckit.plan`      | Create technical plan          |
| `/speckit.tasks`     | Break plan into tasks          |
| `/speckit.implement` | Execute implementation         |
| `/speckit.checklist` | Generate quality checklist     |

**Example workflow:**

```
1. /speckit.specify Add user profile with avatar upload
2. /speckit.plan
3. /speckit.tasks
4. /speckit.implement
5. Open PR
```

---

## 🗂️ Project Structure

```
.
├── apps/
│   ├── frontend/          # Next.js chat UI
│   └── agent/             # Python LangGraph agent
├── supabase/
│   └── migrations/        # Database migrations
├── specs/                 # Feature specifications
├── .cursor/
│   ├── commands/          # SpecKit slash commands
│   └── rules/             # Cursor coding rules
└── .specify/
    ├── memory/            # Constitution & project memory
    ├── specs/             # Architecture specs
    └── templates/         # Spec templates
```

---

## ✅ Commit Conventions

Format: `<type>(<scope>): <subject>`

```bash
# Examples
feat(frontend): add user profile avatar upload
fix(agent): handle timeout in tavily search
docs(db): add comments to profiles table
```

**Types:** feat, fix, docs, style, refactor, perf, test, chore, ci

**Scopes:** frontend, agent, db, auth, api, ui, deps

---

## 🔐 Access You'll Need

Ask the project admin for access to:

- [ ] GitHub repository (collaborator)
- [ ] Supabase project (team member)
- [ ] LangSmith workspace (member)
- [ ] Vercel team (if deploying)

Get your own API keys:

- [ ] Anthropic API key
- [ ] Tavily API key
- [ ] LangSmith API key

---

## 🆘 Getting Help

- **Stuck on conventions?** → Check `.specify/memory/constitution.md`
- **Database questions?** → Check `.cursor/rules/`
- **Workflow questions?** → Check `CONTRIBUTING.md`
- **Architecture questions?** → Check `.specify/specs/`

---

## 🎉 Ready to Go!

1. Pick a task or create a new feature with `/speckit.specify`
2. Follow the SDD workflow
3. Open a PR when done
4. Get it reviewed and merged

Happy coding! 🚀
