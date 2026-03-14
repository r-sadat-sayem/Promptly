# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 App Router project. UI routes live in `app/`, including the landing page in `app/page.tsx`, the main workbench in `app/app/page.tsx`, and API handlers under `app/api/**/route.ts`. Shared React components are in `components/`, and server/client utilities such as SQLite access, AI gateway calls, and token counting live in `lib/`. Static assets belong in `public/`. Local SQLite files are stored in `data/`; treat that directory as runtime data, not source.

## Build, Test, and Development Commands
- `npm install`: install project dependencies.
- `npm run dev`: start the local development server on `http://localhost:3000`.
- `npm run build`: create a production build and surface type or route issues.
- `npm run start`: serve the production build locally.
- `node node_modules/typescript/bin/tsc --noEmit`: run the TypeScript check called out in `README.md`.

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation and semicolons, matching the existing codebase. Export React components and route handlers with PascalCase component names and framework-standard names such as `POST` for API methods. Use camelCase for variables and functions, and keep shared types in `lib/` when they are consumed across features. Prefer the `@/` import alias from `tsconfig.json` over long relative paths.

## Testing Guidelines
There is no committed automated test suite yet. For every change, at minimum run `npm run build` and `node node_modules/typescript/bin/tsc --noEmit`. If you add tests, place them beside the feature or in a dedicated `__tests__/` folder, and name them `*.test.ts` or `*.test.tsx`. Prioritize API route behavior, token-count calculations, and any SQLite-backed logic.

## Commit & Pull Request Guidelines
The current history starts with a short imperative subject (`Initial commit from Create Next App`). Follow that pattern: concise, present-tense commit titles such as `Add savings config validation`. Keep commits focused and avoid bundling unrelated UI and API changes. Pull requests should include a brief summary, affected routes or components, setup or env changes, and screenshots or short recordings for UI updates.

## Security & Configuration Tips
Keep secrets in `.env.local`, especially `RAKUTEN_AI_GATEWAY_KEY` and optional `MODEL_ID`; never commit them. Do not check in generated database state from `data/*.db*` unless the change explicitly requires fixture data.
