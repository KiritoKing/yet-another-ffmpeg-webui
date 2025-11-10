## ADDED Requirements

### Requirement: Task Persistence
The system SHALL persist completed and failed task metadata to IndexedDB.

#### Scenario: Store result metadata
- **WHEN** a task completes or fails
- **THEN** a record with task id, status, timestamps, and summary details SHALL be written to IndexedDB

### Requirement: Query and Pagination
The system SHALL support querying task history with filters and pagination.

#### Scenario: Paginated retrieval
- **WHEN** the UI requests the latest N tasks with a filter (e.g., status = completed)
- **THEN** the database wrapper SHALL return results ordered by completion time, limited to N

### Requirement: Cleanup Operations
The system SHALL support deletion of old records based on time or count thresholds.

#### Scenario: Delete old tasks
- **WHEN** a cleanup routine runs with a cutoff timestamp
- **THEN** tasks with `completedAt` before the cutoff SHALL be deleted
