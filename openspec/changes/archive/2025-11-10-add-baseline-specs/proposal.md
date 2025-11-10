# Change: Add baseline specs for FFmpeg Web UI

## Why
The project has mature modules (services, stores, components) but no canonical OpenSpec specs. We need a baseline specification that reflects current behavior to enable spec-driven changes and validation going forward.

## What Changes
- Add baseline capability specs that capture current implemented behavior:
  - ffmpeg-service
  - ffmpeg-pool
  - queue-processor
  - task-database
  - cdn-config
  - command-presets
  - dynamic-forms
  - logging
- Provide cross-cutting design context
- Provide an implementation tasks checklist

## Impact
- Affected specs: New capabilities listed above
- Affected code: None (documentation-only). References:
  - app/services/: ffmpegService.ts, ffmpegPool.ts, queueProcessor.ts, taskDatabase.ts, cdnService.ts
  - app/store/: command/, ffmpegWeb/, task/, log/, cdn/
  - app/components/: ExecutionPanel.tsx, QueueControlPanel.tsx, TaskHistoryViewer.tsx, DynamicForm.tsx, CDNSelector.tsx, ProgressLogViewer.tsx
  - docs/dev-guide/: API.md, TASK_SYSTEM_v4.md, DEPLOYMENT.md
