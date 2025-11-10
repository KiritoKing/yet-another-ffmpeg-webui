## ADDED Requirements

### Requirement: JSON Schema-Driven Forms
The system SHALL generate input forms from a JSON-like schema supporting field types: text, number, checkbox, select, slider, file-input, file-output.

#### Scenario: Render schema
- **WHEN** a preset includes a form schema
- **THEN** the DynamicForm component SHALL render corresponding inputs with labels and constraints

### Requirement: Default Values & State Binding
The system SHALL populate defaults and bind changes to a form state used for template substitution.

#### Scenario: Change propagation
- **WHEN** a user updates a form field
- **THEN** the bound values SHALL update and the previewed command text SHALL reflect substitutions in real-time

### Requirement: Validation Feedback
The form system SHALL provide inline validation feedback for required fields and numeric ranges to prevent invalid submissions.

#### Scenario: Numeric min/max
- **WHEN** a number field specifies `min=0`
- **THEN** entering a negative value SHALL produce a validation error and prevent submission
