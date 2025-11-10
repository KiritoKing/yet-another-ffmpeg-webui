# ffmpeg-service Specification

## Purpose
TBD - created by archiving change add-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: FFmpeg Service Lifecycle
The system SHALL provide a client-side FFmpeg service with explicit lifecycle methods: `load()`, `executeCommand(options)`, `abort()`, and `cleanup()`.

#### Scenario: Load before execute
- **WHEN** `load()` is called in a browser context
- **THEN** FFmpeg core resources SHALL be fetched from the configured CDN/provider
- **AND** the service SHALL be ready to execute commands

#### Scenario: Abort reloads instance
- **WHEN** `abort()` is invoked during execution
- **THEN** the current FFmpeg instance SHALL be terminated
- **AND** the service SHALL immediately reload a fresh instance to remain ready for subsequent executions

### Requirement: Execution Semantics
The service SHALL accept a single command execution at a time and stream progress and logs via callbacks.

#### Scenario: Single-flight execution
- **WHEN** `executeCommand` is called while idle
- **THEN** it SHALL accept the call and begin execution
- **AND** concurrent calls during execution SHALL be rejected or queued by higher-level orchestration (not by the service)

#### Scenario: Progress and log callbacks
- **WHEN** a command executes
- **THEN** the service SHALL invoke `onProgress(percent, time)` and `onLog(message, level)` callbacks in near real-time

### Requirement: File System Handling
The service MUST write provided input files into the FFmpeg WASM FS and read output artifacts upon completion.

#### Scenario: Output blob URL
- **WHEN** execution completes successfully with an output file name
- **THEN** the service SHALL return a `Uint8Array` or Blob-like data that can be converted to a Blob URL for preview/download

### Requirement: Single vs Multi-thread Modes
The service SHALL support single-thread and multi-thread modes and resolve to the correct `@ffmpeg/core` build based on configuration.

#### Scenario: Multi-thread requires headers
- **WHEN** mode is `multi`
- **THEN** the environment MUST provide COOP/COEP headers enabling SharedArrayBuffer
- **AND** the service SHALL log a meaningful error if headers are missing

