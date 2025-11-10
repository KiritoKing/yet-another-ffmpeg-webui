# queue-processor Specification

## Purpose
TBD - created by archiving change add-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Concurrent Queue Processing
The system SHALL process a list of tasks with a configurable concurrency (batch size) using the FFmpeg instance pool.

#### Scenario: Start processing
- **WHEN** `start(tasks, concurrency)` is invoked with M tasks and concurrency K
- **THEN** up to K tasks SHALL execute in parallel using pooled instances
- **AND** remaining tasks SHALL be scheduled as running tasks complete

### Requirement: Task Lifecycle Callbacks
For each task, the processor MUST invoke lifecycle callbacks: `onTaskProgress`, `onTaskComplete`, `onTaskError`, and `onTaskStart` (where applicable).

#### Scenario: Progress propagation
- **WHEN** FFmpeg execution emits progress
- **THEN** `onTaskProgress(taskId, percent, time)` SHALL be called with task identifiers

### Requirement: Stop Processing
The processor SHALL provide an async `stop()` method to abort in-flight tasks and halt scheduling.

#### Scenario: Graceful stop
- **WHEN** `stop()` is called during processing
- **THEN** in-flight FFmpeg tasks SHALL be aborted via the underlying service
- **AND** no new tasks SHALL start after stop is requested

