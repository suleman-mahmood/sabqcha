**About project**
- AI gamified microlearning **Duolingo inspired** platform
**Repository Commands**
- **Dev**: `npm run dev` — starts Next.js in dev (turbopack).
- **Build**: `npm run build` — production build.
- **Start**: `npm run start` — serves built app.
- **Lint**: Not configured. Recommended: `npx eslint 'src/**/*.{ts,tsx}' --fix` then add `npm run lint`.
- **Test**: Not configured. Recommended: add `vitest` or `jest` and `npm run test`.
- **Single Test (Jest)**: `npx jest path/to/file.test.ts -t 'test name'`
- **Single Test (Vitest)**: `npx vitest run path/to/file.test.ts -t 'test name'`
**Code Style**
- **Formatting**: Use `prettier` conventions; run `npx prettier --write` before commits.
- **Imports**: Group builtin → external → absolute/alias → relative; keep one import per module and sort.
- **Types**: Prefer explicit types on public APIs; use `unknown` + guards for external inputs.
- **Naming**: PascalCase for React components/types; camelCase for variables/functions; UPPER_SNAKE for constants.
- **Files**: Use `*.tsx` for components with JSX and `*.ts` for helpers/utilities.
- **Error handling**: Surface user-facing messages, use try/catch at boundaries, and avoid silent failures.
- **Async**: Prefer `async/await`; validate external responses before using them.
- **Tests**: Keep tests small and deterministic; mock network/DB at boundaries.
- **Cursor/Copilot**: No `.cursor` rules or `.github/copilot-instructions.md` found in this repo.
- **CI**: Add `npm run lint` + `npm test` to CI; keep commits focused and atomic.
