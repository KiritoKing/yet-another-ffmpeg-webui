# command-presets Specification

## Purpose
TBD - created by archiving change add-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Preset CRUD
The system SHALL support creating, reading, updating, and deleting FFmpeg command presets with categories and descriptions.

#### Scenario: Create preset
- **WHEN** a user saves a new preset via the editor dialog
- **THEN** it SHALL appear in the command list grouped by category

### Requirement: Import/Export JSON
The system SHALL allow exporting all presets to JSON and importing valid JSON to merge or replace presets.

#### Scenario: Import valid JSON
- **WHEN** a user imports a JSON file with preset definitions
- **THEN** new presets SHALL be added (or updated if matching IDs/names) and become immediately selectable

### Requirement: Template Variable Expansion
The system SHALL support template variables (`{{varName}}`) replaced by form values before execution.

#### Scenario: Template substitution
- **WHEN** a preset contains `{{width}}` and form value `width=1280`
- **THEN** the final ffmpegArgs SHALL include `1280` in place of `{{width}}`

### Requirement: Validation
The system MUST validate preset structure (required fields, ffmpegArgs array, unique identifier) before acceptance.

#### Scenario: Reject invalid preset
- **WHEN** a preset JSON lacks required fields (e.g., missing ffmpegArgs)
- **THEN** import SHALL fail with a descriptive error

