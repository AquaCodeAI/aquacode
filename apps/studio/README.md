# AquaCode Studio

AquaCode Studio is the dashboard where you can create, edit, and manage your apps built with AquaCode. 
It provides a **no-code** environment designed to accelerate app creation without compromising flexibility.

Built with:

- **Next.js**
- **TailwindCSS**
- **HeroUI**

---

## What's included

### App Creation & Guidance

- AI-powered chat to create and expand your app.
- Full message history per project.
- Ability to switch between different LLM models.

### Visual Builder

- Real-time preview of the generated application.
- Automatic updates as you interact with the AI assistant.

### Project Tools

- **User Management** — Manage users.
- **Project Content** — Access and edit documents generated from your project’s schemas.
- **Versions & Backups** — Save, restore, and navigate between project backups.
- **Project Info** — General project configuration and metadata.
- **Publish** — Deploy the application to production using supported external providers (currently Vercel).

### Project Overview
- List of all your apps with quick access.
- Recent activity and creation history.

---

## Required Environment Variables

Create a `.env` file inside `/apps/studio` containing:

```env
# Domain where the AquaCode API is running
NEXT_PUBLIC_AQUA_DOMAIN=http://localhost:4003 

# Project ID generated when using the API route /v1/initialization
NEXT_PUBLIC_AQUA_PROJECT_ID=prj_01KADJ8MD4JQTCZ5QSXZYQQVPD
```

---

## How to contribute
- Create branches based on main.
- Suggested format: `{type}/{name}`.
- Types: `feature | fix | chore`.
- Keep PRs small, clear, and focused.

---

## Developer Quickstart

```bash
# Install required dependencies
pnpm install
# Start the development server
pnpm run dev
```

---