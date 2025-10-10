**About project**
- AI gamified microlearning **Duolingo inspired** platform

**Repository Commands**
- **Dev**: `npm run dev` — starts Next.js in dev (turbopack).
- **Build**: `npm run build` — production build.

**Code Style**
- **Calling backend**: Don't use next.js backend features (don't add any `route.ts` files), assume there are backend endpoints available at "/api"
- **Colors / Theming**: Don't hardcode colors, instead use shadcn style variables defined in `globals.css`
- **Imports**: Group builtin → external → absolute/alias → relative; keep one import per module and sort.
- **Types**: Prefer explicit types on public APIs; use `unknown` + guards for external inputs.
- **Naming**: PascalCase for React components/types; camelCase for variables/functions; UPPER_SNAKE for constants.
- **Files**: Use `*.tsx` for components with JSX and `*.ts` for helpers/utilities.
- **Error handling**: Surface user-facing messages, use try/catch at boundaries, and avoid silent failures.
- **Async**: Prefer `async/await`; validate external responses before using them.
