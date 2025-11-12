# Change: Refactor Settings to Single Configuration Source

## Why
Currently, settings logic is duplicated across `SettingsDialog.tsx` (desktop) and `settings.tsx` (mobile route), requiring maintenance in two places and risking inconsistency. This violates DRY principles and makes adding new settings error-prone.

## What Changes
- Create centralized settings configuration in `app/config/settings-config.ts` defining all settings metadata (type, title, description, store bindings, options)
- Build reusable setting component library in `app/components/settings/` (SettingSelect, SettingSwitch, SettingButton, SettingCard)
- Implement `SettingsRenderer` component supporting two layout strategies: `dialog` (categorized navigation) and `page` (flat scrollable)
- Refactor `SettingsDialog.tsx` to use SettingsRenderer with dialog mode
- Refactor `app/routes/settings.tsx` to use SettingsRenderer with page mode
- **BREAKING**: Settings components now require centralized config; custom settings must be added to `settings-config.ts`

## Impact
- **Affected specs**: 
  - New: `settings-config` (centralized configuration)
  - New: `settings-components` (reusable UI components)
  - Modified: `responsive-layout` (both desktop and mobile now use same renderer)
- **Affected code**:
  - `app/config/settings-config.ts` (new)
  - `app/components/settings/` (new directory with 7 components)
  - `app/components/SettingsDialog.tsx` (refactored to use SettingsRenderer)
  - `app/routes/settings.tsx` (refactored to use SettingsRenderer)
- **Benefits**:
  - Single source of truth for settings
  - Add new settings once, works everywhere
  - Consistent behavior across desktop/mobile
  - Type-safe configuration
  - Easier to test and maintain
- **Migration**: Existing settings continue working; no user-facing changes
