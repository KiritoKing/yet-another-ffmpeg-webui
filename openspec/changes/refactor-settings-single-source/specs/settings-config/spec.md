# Settings Configuration Specification

## ADDED Requirements

### Requirement: Centralized Settings Configuration
The system SHALL provide a centralized configuration file defining all application settings with their metadata, rendering instructions, and store bindings.

#### Scenario: Settings definition
- **WHEN** a developer wants to add a new setting
- **THEN** they define it once in `settings-config.ts` with type, title, description, and store binding
- **AND** the setting appears in both desktop dialog and mobile page automatically

#### Scenario: Type-safe configuration
- **WHEN** settings configuration is modified
- **THEN** TypeScript validates all fields at compile time
- **AND** invalid configurations are caught before runtime

#### Scenario: Store binding declaration
- **WHEN** a setting needs to read/write store state
- **THEN** the configuration declares store name, key, and setter method
- **AND** setting components handle binding automatically

---

### Requirement: Setting Type System
The system SHALL support multiple setting types with consistent rendering and behavior patterns.

#### Scenario: Select type setting
- **WHEN** a setting is type "select"
- **THEN** it renders a dropdown with configured options
- **AND** updates the bound store on change
- **AND** shows a success toast notification

#### Scenario: Switch type setting
- **WHEN** a setting is type "switch"
- **THEN** it renders a toggle switch
- **AND** updates the bound store on toggle
- **AND** maintains accessible label association

#### Scenario: Button type setting
- **WHEN** a setting is type "button"
- **THEN** it renders an action button with configured handler
- **AND** supports destructive variant for dangerous actions
- **AND** shows loading state during async operations

#### Scenario: Card type setting
- **WHEN** a setting is type "card"
- **THEN** it renders an informational card with custom content
- **AND** supports different card styles (info, warning, stats)

#### Scenario: Stats type setting
- **WHEN** a setting is type "stats"
- **THEN** it renders a grid of statistical cards
- **AND** displays dynamic values from stores or computed functions

#### Scenario: Custom type setting
- **WHEN** a setting is type "custom"
- **THEN** it executes a custom render function
- **AND** receives mode ('dialog' or 'page') as parameter

---

### Requirement: Category Organization
The system SHALL organize settings into logical categories with icons and descriptions.

#### Scenario: Category definition
- **WHEN** settings are grouped by category
- **THEN** each category has a unique ID, label, icon, and description
- **AND** contains an array of setting configurations

#### Scenario: Category rendering
- **WHEN** categories are rendered in dialog mode
- **THEN** they appear as navigation items in the sidebar
- **AND** clicking a category displays its settings

#### Scenario: Flat category rendering
- **WHEN** categories are rendered in page mode
- **THEN** they appear as stacked sections with headers
- **AND** all categories are visible in a single scrollable view
