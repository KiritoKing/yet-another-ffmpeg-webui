# Settings Components Specification

## ADDED Requirements

### Requirement: Reusable Setting Components
The system SHALL provide reusable components for rendering individual settings based on their type configuration.

#### Scenario: Component type selection
- **WHEN** a setting configuration is provided
- **THEN** the appropriate component is selected based on type field
- **AND** the component renders with consistent layout and styling

#### Scenario: Store binding integration
- **WHEN** a setting component is rendered with store binding
- **THEN** it reads current value from the specified store and key
- **AND** updates store via the specified setter on user interaction
- **AND** displays success toast notification after successful update

#### Scenario: Touch-friendly rendering
- **WHEN** interactive setting components are rendered
- **THEN** all tap targets meet minimum 44x44px size
- **AND** proper spacing exists between adjacent interactive elements

---

### Requirement: Settings Renderer with Strategy Pattern
The system SHALL provide a SettingsRenderer component supporting multiple layout strategies through a mode parameter.

#### Scenario: Dialog mode rendering
- **WHEN** SettingsRenderer is used with mode="dialog"
- **THEN** it renders a two-column layout with category navigation sidebar
- **AND** displays only the active category's settings in the content area
- **AND** provides category switching functionality

#### Scenario: Page mode rendering
- **WHEN** SettingsRenderer is used with mode="page"
- **THEN** it renders a single-column flat layout
- **AND** displays all categories stacked vertically with section headers
- **AND** provides a scrollable container for all settings

#### Scenario: Consistent behavior across modes
- **WHEN** the same setting is rendered in different modes
- **THEN** it maintains identical functionality and store interactions
- **AND** only layout and presentation differ

---

### Requirement: Setting Item Base Component
The system SHALL provide a base SettingItem component with consistent layout structure for all setting types.

#### Scenario: Standard setting layout
- **WHEN** a setting is rendered
- **THEN** it displays label, optional description, and control in consistent layout
- **AND** applies responsive classes based on rendering mode
- **AND** includes optional icon if configured

#### Scenario: Accessible labeling
- **WHEN** a setting control is rendered
- **THEN** it has proper label association via htmlFor attribute
- **AND** includes ARIA attributes for screen reader support

---

### Requirement: Type-Specific Setting Components
The system SHALL provide specialized components for each setting type with appropriate UI controls.

#### Scenario: SettingSelect component
- **WHEN** a select-type setting is rendered
- **THEN** it displays shadcn Select component with configured options
- **AND** current value from store is preselected
- **AND** onChange handler updates store and shows toast

#### Scenario: SettingSwitch component
- **WHEN** a switch-type setting is rendered
- **THEN** it displays shadcn Switch component
- **AND** layout positions label on left and switch on right
- **AND** onCheckedChange handler updates store

#### Scenario: SettingButton component
- **WHEN** a button-type setting is rendered
- **THEN** it displays shadcn Button with configured variant
- **AND** onClick executes the configured action handler
- **AND** supports loading state during async operations

#### Scenario: SettingCard component
- **WHEN** a card-type setting is rendered
- **THEN** it displays shadcn Card with custom content
- **AND** supports different styles (info, warning, stats)
- **AND** renders icons, badges, and formatted text

#### Scenario: SettingStats component
- **WHEN** a stats-type setting is rendered
- **THEN** it displays a 3-column grid of stat cards
- **AND** each card shows label, icon, and dynamic value
- **AND** values update reactively from stores

#### Scenario: SettingCustom component
- **WHEN** a custom-type setting is rendered
- **THEN** it executes the configured render function
- **AND** passes rendering mode as parameter
- **AND** renders returned JSX in place
