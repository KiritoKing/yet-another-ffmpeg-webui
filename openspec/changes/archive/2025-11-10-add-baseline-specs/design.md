# Baseline Design Context

## Context
The application is a browser-based FFmpeg.wasm interface with command presets, dynamic form generation, task queue execution (concurrent), CDN selection, and logging. Architecture separates concerns into services (pure logic), stores (Zustand state), and components (UI via shadcn/ui). No formal specs existed; behaviors were inferred from code and AGENTS docs.

## Goals / Non-Goals
- Goals: Capture current architecture & data flows; enable future spec diffs; clarify lifecycle boundaries (load, execute, abort, queue, persist).
- Non-Goals: Introduce new features, change execution semantics, refactor modules.

## Capability Boundaries
| Capability | Primary Files | Store(s) | Component(s) |
|------------|---------------|----------|--------------|
| ffmpeg-service | ffmpegService.ts | ffmpegWeb store (mode state) | ExecutionPanel / Toolbar |
| ffmpeg-pool | ffmpegPool.ts | task store (pool sizing indirectly) | QueueControlPanel |
| queue-processor | queueProcessor.ts | task store | QueueControlPanel |
| task-database | taskDatabase.ts | task store (history retrieval) | TaskHistoryViewer |
| cdn-config | cdnService.ts | cdn store | CDNSelector / SettingsDialog |
| command-presets | command store | command store | CommandEditor / CommandList / CommandPanel |
| dynamic-forms | DynamicForm.tsx templates.ts validators.ts | ffmpegWeb store (formValues) | DynamicForm / FormSchemaEditor |
| logging | log store, ffmpegService callbacks | log store | ProgressLogViewer |

## Data Flow Highlights
1. User selects a preset (command store) → form schema drives DynamicForm → form values expand template → ffmpegArgs prepared.
2. ExecutionPanel triggers FFmpegService.executeCommand: writes input files, runs, streams progress & logs to stores.
3. Batch upload creates Task objects → QueueProcessor pulls tasks → acquires instance from FFmpegPool → executes via FFmpegService → updates task store & persists history in taskDatabase → results mapped to Blob URLs.
4. CDNSelector evaluates providers (cdnService health checks) → updates cdn store → influences FFmpegService resource URLs on (re)load.

## Key Decisions
- Separation of service logic from UI/state for testability.
- Abort triggers terminate + immediate reload ensuring readiness for next execution.
- Filename sanitization + mapping to avoid WASM FS issues (errorHandling.ts utilities).
- Pool manages concurrent instances up to configured size; queue concurrency parameter controls parallel tasks.
- Only minimal persistence (preset definitions, user mode preference, CDN choice) while logs remain ephemeral for performance.

## Risks / Trade-offs
- Multi-thread mode depends on headers; misconfiguration breaks pool performance. Mitigated by headers plugin + check page.
- Large batch tasks can exhaust memory; guidelines recommend file size limits and copy codec to minimize transcoding.
- Absence of formal spec previously risked divergence; this baseline mitigates future drift.

## Migration Plan
No runtime changes. After acceptance, these specs represent current truth. Future changes will MODIFIED/ADDED against them.

## Open Questions
- Should task history retention be formalized (e.g., max entries or TTL)?
- Should dynamic form schema support conditional fields (not yet implemented)?
- Do we require integrity/hash verification for CDN resources in future?
