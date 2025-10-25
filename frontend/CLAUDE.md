# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sool** - An AI gamified microlearning platform inspired by Duolingo. Students complete task sets with MCQ quizzes, while teachers manage lectures, quizzes, and analyze student performance.

## Development Commands

### Running the Application
- **Dev**: `npm run dev` — starts Next.js development server with Turbopack
- **Build**: `npm run build` — creates production build with Turbopack
- **Start**: `npm start` — runs production server

### Environment Setup
- Copy `.env.example` to `.env`
- Required: `NEXT_PUBLIC_TRANSCRIBE_API_BASE` for backend API base URL

## Architecture

### Backend Integration
- **No Next.js API routes**: This is a frontend-only repo. Do NOT create `route.ts` files
- All backend endpoints are accessed via `/api/*` which proxies to `NEXT_PUBLIC_TRANSCRIBE_API_BASE` (configured in `next.config.ts`)
- API calls use relative paths like `/api/room/${roomId}/attempts`

### Authentication System
- **AuthProvider** (`src/components/AuthProvider.tsx`) wraps the entire app
- **Token storage**: Tokens stored in localStorage, automatically injected into fetch requests via monkey-patched `window.fetch`
- **Device flow**: Anonymous users get device-based tokens via `/api/user/device/{deviceId}`
- **Password flow**: Authenticated users login via `login(token)` method
- **Auto-injection**: All same-origin fetch requests automatically include `Authorization: Bearer {token}` header
- Use `useAuth()` hook to access `{ user, token, login, logout, isInitializing }`

### Firebase Integration
- **Firebase Storage** configured in `src/lib/firebase.ts` for file uploads
- Firebase config is committed (public API keys are safe to commit per Firebase docs)

### Routing Structure (Next.js App Router)
- **Landing**: `app/page.tsx` — home/login page
- **Dashboard**: `app/dashboard/page.tsx` — main dashboard after login
- **Room**: `app/room/[id]/page.tsx` — teacher view (lectures/tasks) or student view (attempts)
- **Quiz**: `app/room/[id]/quiz/page.tsx` — quiz listing
- **Quiz Attempt**: `app/room/[id]/quiz/[quiz_id]/page.tsx` — take a quiz
- **Task Set**: `app/task-set/[task_set_id]/page.tsx` — student MCQ quiz interface
- **Analysis**: `app/analysis/[task_set_id]/page.tsx` — teacher analytics for task sets
- **Leaderboard**: `app/leaderboard/[room_id]/page.tsx` — room leaderboards

### Type System
- Core types defined in `app/room/[id]/types.ts`:
  - `TaskSet`: Daily task assignments (MONDAY-FRIDAY)
  - `Lecture`: Individual lecture content
  - `Week`: Groups lectures and task sets by lecture_group_id
  - `Quiz`: Quiz metadata with optional answer sheets and rubrics
  - `StudentSolution`: Student-submitted solutions

### UI Components
- **shadcn/ui components**: Located in `src/components/ui/`
- **Custom components**: `TeacherTasksSection.tsx` in room components
- **Styling**: Tailwind CSS with custom theme variables in `app/globals.css`

## Code Style (from AGENTS.md)

### Styling & Theming
- **Never hardcode colors**: Use CSS variables from `app/globals.css` (e.g., `bg-background`, `text-foreground`, `bg-primary`)
- Theme supports Duolingo-inspired pastel colors with light/dark modes
- Color variables: `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--destructive`, etc.

### Import Organization
- Group imports: builtin → external → absolute/alias (`@/*`) → relative
- Keep one import per module and sort alphabetically
- Example:
  ```typescript
  import { useEffect, useState } from "react";
  import { useRouter } from "next/navigation";
  import { Button } from "@/components/ui/button";
  import { useAuth } from "@/components/AuthProvider";
  import { Week } from "./types";
  ```

### TypeScript Conventions
- Prefer explicit types on public APIs
- Use `unknown` + type guards for external inputs
- PascalCase for React components and types
- camelCase for variables and functions
- UPPER_SNAKE_CASE for constants
- `*.tsx` for components with JSX, `*.ts` for utilities

### Error Handling
- Surface user-facing error messages to the UI
- Use try/catch at component boundaries
- Avoid silent failures — always show feedback to users
- Validate external API responses before using them

### Async Operations
- Prefer `async/await` over raw promises
- Always validate API responses before processing

## Path Aliases
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Example: `import { Button } from "@/components/ui/button"`

## Key Patterns

### Fetching Data in Components
1. Use `useAuth()` to check user role (`user.userRole === "TEACHER"`)
2. Conditional rendering based on role (teacher vs student views)
3. Always handle loading states and errors with user-facing messages
4. Use cleanup functions in `useEffect` to prevent state updates on unmounted components

### Role-Based Views
- **Teacher**: See lectures, task sets, quizzes, can generate tasks, view analytics
- **Student**: See their attempts, scores, complete quizzes and task sets
- Single pages often handle both views (see `app/room/[id]/page.tsx`)

## Notes
- The project uses Next.js 15.5.4 with React 19 and Turbopack
- Motion library (`motion`) is used for animations
- All components are client-side rendered (`"use client"`) for auth/state management
