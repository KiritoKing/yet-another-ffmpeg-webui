# Project Context

## Purpose
`ffmpeg-easy` aims to make FFmpeg.wasm usage in the browser low-friction and highly controllable. It helps users to:
1. Load FFmpeg quickly and switch between single-thread and multi-thread (SharedArrayBuffer) modes.
2. Generate FFmpeg commands via visual presets, dynamic forms, and template variables to reduce the learning curve.
3. Run batch processing with a managed queue (concurrency, progress, result preview, and history).
4. Auto-select the best source among multiple CDNs (unpkg/jsDelivr/local) to improve reliability and load speed.
5. Offer an extensible architecture across components, services, and state management for easy iteration.
6. Use OpenSpec for spec-driven development so capabilities and documentation evolve together.

Core goals: simplify the FFmpeg workflow, increase execution transparency (logs/progress/error parsing), respect browser memory/performance boundaries, and keep code and specs consistent.

## Tech Stack
Primary technologies and libraries:
| Layer | Technology | Notes |
|------|------------|-------|
| Language | TypeScript 5.x | Type safety and maintainability |
| Framework | React 19 + React Router v7 | Components + filesystem routing + SSR/CSR |
| Build | Vite 7 | Fast dev and production builds |
| Styles | TailwindCSS v4 | Atomic CSS with customizable theme |
| UI | shadcn/ui (Radix UI) | Accessible component system |
| State | Zustand v5 | Lightweight, modular stores (command/log/task/cdn/ffmpegWeb) |
| Forms/Validation | react-hook-form + zod | Dynamic forms with template variables |
| FFmpeg | @ffmpeg/ffmpeg + @ffmpeg/core(-mt) + @ffmpeg/util | WebAssembly with multi-thread support |
| Storage | IndexedDB (Dexie) | Task and history persistence |
| Virtualization | @tanstack/react-virtual | Efficient large log rendering |
| Hooks | ahooks | Debounce and other handy hooks |
| Onboarding | driver.js | Product tours and guidance |
| Events | mitt | Lightweight event bus |
| Misc | lucide-react, class-variance-authority, tailwind-merge | UI and style ergonomics |

Scripts: `pnpm dev` / `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm start`.

## Project Conventions

### Code Style
Use Biome (`pnpm lint` / `biome check .`) for formatting and diagnostics. All new code must be TypeScript; avoid `any`.
File size: keep each file ≤ 500 lines; split into focused modules and re-export via `index.ts` when needed.
Naming:
- Component files use PascalCase (e.g., `CommandEditor.tsx`).
- Props interface: `<ComponentName>Props`.
- Store directories follow `types.ts` + `index.ts` + `default-values.ts`.
- OpenSpec change IDs: kebab-case with verb prefix (`add-` / `update-` / `remove-` / `refactor-`).
- Variables/functions: clear semantics; avoid ambiguous abbreviations; utilities are single-purpose.
Paths: prefer Vite + TS path aliases to keep imports tidy.
Avoid: unused code, duplicated logic, and untyped dynamic objects.
Logging: route logs through the log store (typed with timestamp), with standardized callbacks from FFmpeg services.

### Architecture Patterns
Layering and responsibilities:
1. UI Components (`app/components`): pure view/interaction; no heavy business logic.
2. Hooks (`app/hooks`): page/business logic (e.g., `useFFmpegWeb`, `useTaskManager`) covering command execution, queue control, and mode initialization.
3. Services (`app/services`): FFmpegService (load/execute/abort), FFmpegPool (multi-instance), QueueProcessor (logical queue), CdnService (health checks and URL building), TaskDatabase (IndexedDB persistence).
4. State (`app/store`): modular Zustand stores (command/cdn/task/log/ffmpegWeb).
5. Utilities (`app/utils`): functional modules (parsers/validators/templates/fileHelpers/errorHandling) to avoid god files.
6. OpenSpec (`openspec/`): spec-driven capability evolution via change proposals and delta specs.

Key patterns:
- Separate data/logic/view (avoid large monolithic components).
- FFmpeg call flow: service → callbacks/events → store updates → UI re-render.
- Multi-thread mode requires COOP/COEP headers (injected early via a custom Vite plugin).
- Batch execution: sanitize filenames → enqueue → run with limited concurrency (1–4) → aggregate progress → manage Blob URLs and preview.
- CDN selection: latency test (5s timeout), fallback on failure, local resources as final fallback.
- Template vars: apply `replaceTemplateVariables` with dynamic form values before execution.
- Error normalization: `parseFFmpegError` / `formatErrorMessage` to reduce raw log noise.

### Testing Strategy
Current approach favors lightweight rigor via type safety and scenario checks:
1. Type checks: `pnpm typecheck` (react-router typegen + `tsc`) as the baseline compile-time gate.
2. Static quality: Biome strict diagnostics (`pnpm lint`), enforced by husky + lint-staged pre-commit.
3. Scenario validation: manual runs guided by OpenSpec Requirements/Scenarios (load FFmpeg, switch modes, run presets, queue concurrency, abort/recover, CDN fallback).
4. Regression passes: after major refactors (e.g., v3.0 layering, v4.0 queue), run broad manual checks and monitor browser memory (Chrome Performance).
5. Edge/error cases: filename sanitization, reject >500MB files, re-run immediately after mode switch, reuse instance after abort.
6. Future: introduce Vitest for utils and service pure functions; extend to queue and error parsing tests.

Acceptance: zero type errors, no Biome critical diagnostics, key scenarios behave as expected, resources freed properly, and multi-threading operates correctly.

### Git Workflow
Trunk-based development (`main` stays stable). Short-lived branches:
- `feat/<short-topic>` for new features (create an OpenSpec proposal when required).
- `fix/<issue-or-root-cause>` for behavior fixes (proposal usually not required unless specs change).
- `refactor/<scope>` for architecture/performance refactors.

Commit style (Conventional Commits flavor):
- `feat: add batching queue processor` / `fix: abort reload ffmpeg instance` / `refactor: split command utils modules`.
- If tied to OpenSpec: reference the Change-ID in the body (`Change-ID: add-cdn-selector`).

Process:
1. If the work is a new capability/architecture change/breaking/performance-impacting → create an OpenSpec proposal (`changes/<id>/`).
2. Validate: run `openspec validate <id> --strict` and fix issues before implementing.
3. Implement per `tasks.md`, and mark all items checked when done.
4. Merge: reference the change-id in PR; ensure CI (`pnpm ci:check`) is green.
5. After deployment: `openspec archive <id> --yes` and ensure `specs/` are updated where required.

## Domain Context
Running FFmpeg in the browser faces constraints: memory limits, thread isolation (COOP/COEP), heavy I/O, and complex codec parameters. Key considerations:
1. Multi-threading requires a `crossOriginIsolated` environment; otherwise, fall back to single-thread core.
2. For batch tasks, avoid many simultaneous re-encodes; default to `-c copy` when possible to cap CPU/memory.
3. Sanitize filenames (remove special chars/CJK) to reduce issues with the wasm virtual FS.
4. CDN load latency directly affects time-to-first-FFmpeg; latency probing must include timeouts and fallbacks.
5. Template variables + dynamic forms enable reusable, editable complex presets.
6. IndexedDB stores history and metadata; large outputs are only held as Blob URLs (avoid heavy persistence).
7. Error classes: OOM, missing codecs, invalid params, and file access errors—translate them into readable messages.
8. Logs and progress must be real-time; use virtualization to prevent UI jank when volume is high.

## Important Constraints
Technical constraints and guardrails:
- Browser memory and WASM limits: recommend inputs < 500MB; avoid frequent full re-encodes.
- Multi-thread mode depends on correct COOP/COEP headers across dev/preview/prod.
- Hard cap: ≤ 500 lines per file; new capabilities must be modularized.
- No breaking/architectural changes without an approved OpenSpec proposal.
- Keep the CDN fallback chain: custom → unpkg → jsDelivr → local assets.
- Concurrency limits (default 2, max 4) to balance throughput vs resources.
- Clean up virtual FS temp files after each task to prevent leaks.
- Avoid introducing heavy/duplicate dependencies; prefer existing toolchain.
- Document all new public APIs in `docs/dev-guide` or corresponding specs.

## External Dependencies
Key external dependencies and resources:
- CDNs: unpkg, jsDelivr, optional custom sources, and local-bundled cores—for fetching FFmpeg wasm and multi-thread cores.
- Web platform APIs: SharedArrayBuffer (multi-thread), IndexedDB (via Dexie), Blob/URL.createObjectURL (previews), and Performance APIs.
- FFmpeg wasm cores: `@ffmpeg/core` / `@ffmpeg/core-mt`, fetched via the above CDNs/local.
- Security headers: `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` / `Cross-Origin-Resource-Policy` for isolation.
- Libraries: React Router, Zustand, react-hook-form, zod, ahooks, driver.js, @tanstack/react-virtual, Radix UI, mitt.
- Tooling: Vite, Biome, Husky + lint-staged, TailwindCSS plugins.
- UI Icons/Components: lucide-react, shadcn/ui.

Risk and mitigations:
- CDN unreachable → fallback chain.
- SharedArrayBuffer unavailable → auto fallback to single-thread core.
- IndexedDB failures → warn and continue in-memory.
- FFmpeg load timeouts → retry and fallback to older version or local bundle.

(When adding external APIs or remote services, capture rationale and impact via an OpenSpec proposal.)
