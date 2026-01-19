# TaskFlow

**TaskFlow** is a powerful, open-source workflow automation platform built with Next.js. Create complex, visual workflows to automate tasks, connect APIs, and leverage AI capabilities.

## ✨ Key Features

- **Visual Workflow Editor**: Intuitive drag-and-drop interface powered by [React Flow](https://reactflow.dev/) to design execution logic.
- **AI-Powered Nodes**: Native integration with leading AI models:
  - **OpenAI** (GPT-4o, etc.)
  - **Anthropic** (Claude 3.5 Sonnet, etc.)
  - **Google** (Gemini 1.5 Pro/Flash)
- **Robust Execution Engine**: Reliable, durable workflow orchestration using [Inngest](https://www.inngest.com/).
- **Secure Authentication**: Complete user management system powered by [Better Auth](https://better-auth.com/).
- **Real-time Updates**: Live execution status tracking and feedback.
- **Modern Tech Stack**: Built with the latest Next.js 16 features, Server Actions, and Tailwind CSS v4.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **State Management**: [Jotai](https://jotai.org/), [React Query](https://tanstack.com/query/latest)
- **Backend API**: [tRPC](https://trpc.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/)), [Drizzle ORM](https://orm.drizzle.team/)
- **Workflow Engine**: [Inngest](https://www.inngest.com/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Billing**: [Polar.sh](https://polar.sh/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- PostgreSQL database (or a Neon project)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/taskflow.git
    cd taskflow
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Environment Setup:**
    Create a `.env` file in the root directory and add the necessary environment variables:

    ```env
    # Database
    DATABASE_URL=postgresql://...

    # Authentication (Better Auth)
    BETTER_AUTH_SECRET=...
    BETTER_AUTH_URL=http://localhost:3000

    # Inngest
    INNGEST_EVENT_KEY=...
    INNGEST_SIGNING_KEY=...

    # AI Providers (Optional, based on usage)
    OPENAI_API_KEY=...
    ANTHROPIC_API_KEY=...
    GOOGLE_GENERATIVE_AI_API_KEY=...

    # Other Services
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    NGROK_URL=... # For local webhook testing
    ```

4. **Database Migration:**
    Push the schema to your database:

    ```bash
    pnpm dlx drizzle-kit push
    ```

### Running the Application

To start the full development environment (Next.js + Inngest + Ngrok) using `mprocs`:

```bash
pnpm dev:all
```

Alternatively, you can run services individually:

```bash
# Start Next.js dev server
pnpm dev

# Start Inngest dev server
pnpm inngest:dev
```

## 📂 Project Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Shared UI components
├── db/                   # Database schema and Drizzle configuration
├── features/             # Feature-based architecture
│   ├── auth/             # Authentication components and logic
│   ├── editor/           # Workflow editor (React Flow)
│   ├── executions/       # Workflow execution logic
│   ├── triggers/         # Trigger nodes (Webhooks, etc.)
│   └── workflows/        # Workflow management
├── inngest/              # Inngest functions and configuration
├── lib/                  # Shared utilities and libraries
└── trpc/                 # tRPC router and setup
```

