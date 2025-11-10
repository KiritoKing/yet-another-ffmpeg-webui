# ffmpeg-pool Specification

## Purpose
TBD - created by archiving change add-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Instance Pooling
The system SHALL provide a pool of FFmpeg instances to enable concurrent task execution up to a configured size.

#### Scenario: Acquire and release
- **WHEN** a worker is acquired via `pool.acquire()`
- **THEN** an initialized FFmpeg service instance SHALL be returned
- **AND** after use, `pool.release(instance)` SHALL make it available for subsequent tasks

### Requirement: Pool Sizing
The pool size MUST be configurable at initialization time.

#### Scenario: Respect configured size
- **WHEN** the pool is created with size N
- **THEN** at most N instances SHALL be created and active
- **AND** additional acquisitions SHALL wait until an instance is released

### Requirement: Disposal
The pool SHALL provide `dispose()` to terminate all instances and free resources.

#### Scenario: Clean shutdown
- **WHEN** `dispose()` is called
- **THEN** all instances SHALL be terminated and internal state reset

