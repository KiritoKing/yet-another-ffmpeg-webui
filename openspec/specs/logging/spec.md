# logging Specification

## Purpose
TBD - created by archiving change add-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Real-time Log Collection
The system SHALL collect log messages from FFmpeg execution and UI operations with timestamps and levels.

#### Scenario: Stream logs
- **WHEN** FFmpeg emits log lines
- **THEN** they SHALL be appended to the log store with timestamp and level (info/warn/error)

### Requirement: Search and Filter
The system SHALL support client-side search (debounced) and level-based filtering in the log viewer.

#### Scenario: Debounced search
- **WHEN** a user types in the search box
- **THEN** the viewer SHALL debounce input (≈300ms) and filter visible log rows accordingly

### Requirement: Intelligent Auto-Scroll
The system SHALL auto-scroll to the bottom only when the user is already at the bottom and no active filters are applied.

#### Scenario: Preserve scroll position
- **WHEN** the user scrolls up
- **THEN** auto-scroll SHALL pause to avoid disrupting reading historical logs

