## ADDED Requirements

### Requirement: CDN Provider Configuration
The system SHALL allow selecting a CDN provider (e.g., unpkg, jsDelivr, local) and version for FFmpeg resources.

#### Scenario: Versioned URL generation
- **WHEN** a provider and version are selected
- **THEN** URLs for `@ffmpeg/ffmpeg`, `@ffmpeg/core`, and `@ffmpeg/core-mt` SHALL be generated according to the provider template

### Requirement: Health Checks
The system SHALL perform health checks with a 5s timeout to evaluate CDN availability and latency.

#### Scenario: Auto-select best provider
- **WHEN** a health check runs across multiple providers
- **THEN** the provider with successful response and lowest latency SHALL be recommended as best

### Requirement: Custom URL Validation
The system SHALL validate custom CDN base URLs for structural correctness before use.

#### Scenario: Reject invalid URL
- **WHEN** a malformed custom URL is entered
- **THEN** validation SHALL fail with a user-visible reason, and the URL SHALL NOT be applied
