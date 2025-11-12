# Changelog

This directory contains detailed changelogs for major features and updates.

## Recent Updates

- [**Tauri Desktop Integration (v6.0)** 🚀](./CHANGELOG_TAURI_INTEGRATION.md) - Desktop application support with Rust backend
- [Theme and Mobile UI (v5.1)](./CHANGELOG_THEME_AND_MOBILE.md) - Dark mode and mobile-responsive design
- [CDN Refactor (v5.0)](./CHANGELOG_CDN_REFACTOR.md) - Multi-CDN support and optimization
- [Task System Abort Fix](./CHANGELOG_ABORT_FIX.md) - Fix for task abortion and reload issues
- [Task System Abort](./CHANGELOG_ABORT.md) - Initial abort implementation
- [Task System v3](./CHANGELOG_TASK_SYSTEM_v3.md) - Task system v3 improvements

## Viewing Changelogs

Each changelog file contains:
- **Date**: When the change was made
- **Version**: Version number if applicable
- **Changes**: Detailed list of modifications
- **Issues Fixed**: Related bug fixes
- **Breaking Changes**: Any breaking changes

## Format

Changelogs follow this general structure:

```markdown
# Feature Name - Version

## Date: YYYY-MM-DD

### Changes
- Added X
- Fixed Y
- Improved Z

### Breaking Changes
- Changed API for ABC
- Removed deprecated DEF

### Migration Guide
Steps to migrate from previous version...
```

## Contributing

When making significant changes, consider adding a changelog entry:

1. Create a new markdown file with descriptive name
2. Follow the format above
3. Include code examples if helpful
4. Link to related issues/PRs
5. Update this README with the new entry
