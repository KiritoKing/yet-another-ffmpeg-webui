# Tasks: Refactor Settings to Single Configuration Source

## Overview
Refactor duplicated settings code into a centralized configuration system with reusable components and rendering strategies.

## Phase 1: Create Settings Configuration System (Day 1)

### Task 1.1: Define Settings Configuration Types
**Priority**: High  
**Estimated**: 1 hour  
**Dependencies**: None

- [ ] Create `app/config/settings-config.ts`
- [ ] Define `SettingType` union type: 'select' | 'switch' | 'button' | 'card' | 'stats' | 'custom'
- [ ] Define `SettingConfig` interface with fields:
  - `id: string` (unique identifier)
  - `category: SettingCategory` (general | performance | storage | cdn | about)
  - `type: SettingType`
  - `title: string`
  - `description?: string`
  - `icon?: LucideIcon`
  - Type-specific fields (options, action, variant, etc.)
- [ ] Define `SettingCategory` interface with:
  - `id: string`
  - `label: string`
  - `icon: LucideIcon`
  - `description: string`
  - `settings: SettingConfig[]`
- [ ] Define `StoreBinding` type for connecting settings to Zustand stores
- [ ] Add JSDoc comments explaining the structure

**Validation**:
- [ ] TypeScript compiles without errors
- [ ] Types exported correctly
- [ ] Can import types in test file

---

### Task 1.2: Create Settings Data Configuration
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 1.1

- [ ] In `settings-config.ts`, create `settingsCategories` array
- [ ] Define 5 categories: General, Performance, Storage, CDN, About
- [ ] Add all existing settings from SettingsDialog.tsx:
  - General: Default Load Mode (select), Show Init Dialog (switch)
  - Performance: Batch Size (select), Auto-Start Queue (switch), Performance Tips (card)
  - Storage: Storage Stats (stats), Clear History (button), Reset Presets (button)
  - CDN: CDN Status (card), Open CDN Config (button), CDN Info (card)
  - About: App Logo (custom), GitHub Link (custom), Version (custom), Tech Stack (custom), Features (custom), License (custom)
- [ ] Configure store bindings for each setting:
  - Link to useFFmpegWebStore for savedMode, showInitDialog
  - Link to useTaskStore for queueConfig (batchSize, autoStart)
  - Link to useCDNStore for CDN config
- [ ] Add action handlers for buttons (clearHistory, resetPresets, openCDNSelector)
- [ ] Export `settingsCategories` as default

**Validation**:
- [ ] All 5 categories defined
- [ ] All existing settings migrated
- [ ] Store bindings correct
- [ ] No TypeScript errors

---

## Phase 2: Build Reusable Setting Components (Days 1-2)

### Task 2.1: Create Base Setting Item Component
**Priority**: High  
**Estimated**: 1.5 hours  
**Dependencies**: Task 1.2

- [ ] Create `app/components/settings/SettingItem.tsx`
- [ ] Accept props: `config: SettingConfig`, `mode: 'dialog' | 'page'`
- [ ] Render wrapper with consistent layout (Label, Description, Control)
- [ ] Apply responsive classes based on mode
- [ ] Handle icons if provided
- [ ] Export SettingItem component

**Validation**:
- [ ] Component renders correctly
- [ ] Supports both modes
- [ ] TypeScript props validated
- [ ] Accessible (proper labels, ARIA)

---

### Task 2.2: Create Setting Type Components
**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: Task 2.1

- [ ] Create `app/components/settings/SettingSelect.tsx`
  - Render shadcn Select component
  - Bind to store via config.storeBinding
  - Handle onChange with toast notification
  - Support min-h-11 touch targets
- [ ] Create `app/components/settings/SettingSwitch.tsx`
  - Render shadcn Switch component
  - Bind to store via config.storeBinding
  - Handle onCheckedChange
  - Layout: Label left, Switch right
- [ ] Create `app/components/settings/SettingButton.tsx`
  - Render shadcn Button component
  - Execute config.action on click
  - Support destructive variant
  - Handle loading state
- [ ] Create `app/components/settings/SettingCard.tsx`
  - Render info cards (status, tips, stats)
  - Support different card styles (info, warning, stats)
  - Render badges, icons, custom content
- [ ] Create `app/components/settings/SettingStats.tsx`
  - Render 3-column stats grid
  - Display presets count, categories count, storage size
  - Use Card components
- [ ] Create `app/components/settings/SettingCustom.tsx`
  - Render custom content (About section)
  - Support logo, links, badges, lists

**Validation**:
- [ ] All 6 component types created
- [ ] Store bindings work correctly
- [ ] Toast notifications on changes
- [ ] 44px touch targets
- [ ] TypeScript types correct

---

### Task 2.3: Create Settings Component Index
**Priority**: Low  
**Estimated**: 15 minutes  
**Dependencies**: Task 2.2

- [ ] Create `app/components/settings/index.ts`
- [ ] Export all setting components
- [ ] Export SettingsRenderer (to be created in Task 3.1)
- [ ] Export types from settings-config

**Validation**:
- [ ] All exports work
- [ ] Can import from single entry point
- [ ] No circular dependencies

---

## Phase 3: Build Settings Renderer (Day 2)

### Task 3.1: Create SettingsRenderer Component
**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: Task 2.2

- [ ] Create `app/components/settings/SettingsRenderer.tsx`
- [ ] Accept props:
  - `mode: 'dialog' | 'page'`
  - `categories: SettingCategory[]`
  - `activeCategory?: string` (for dialog mode)
  - `onCategoryChange?: (id: string) => void`
  - `presetsCount: number`
  - `categoriesCount: number`
  - `onResetCommands?: () => void`
- [ ] Implement dialog mode (two-column):
  - Left: Category navigation sidebar
  - Right: Settings content area
  - Switch content based on activeCategory
- [ ] Implement page mode (flat):
  - Single column, all categories stacked
  - Section headers with separators
  - Scrollable container
- [ ] Render settings using appropriate component based on type
- [ ] Pass through store hooks and handlers
- [ ] Handle custom settings (About section)

**Validation**:
- [ ] Dialog mode renders correctly (two-column)
- [ ] Page mode renders correctly (flat)
- [ ] Category switching works (dialog mode)
- [ ] All setting types render
- [ ] Store interactions work
- [ ] Responsive layout correct

---

## Phase 4: Refactor Existing Components (Days 2-3)

### Task 4.1: Refactor SettingsDialog
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 3.1

- [ ] Update `app/components/SettingsDialog.tsx`
- [ ] Remove all inline setting rendering code (~300 lines)
- [ ] Import SettingsRenderer and settingsCategories
- [ ] Replace content with:
  ```tsx
  <SettingsRenderer
    mode="dialog"
    categories={settingsCategories}
    activeCategory={activeCategory}
    onCategoryChange={setActiveCategory}
    presetsCount={presetsCount}
    categoriesCount={categoriesCount}
    onResetCommands={onResetCommands}
  />
  ```
- [ ] Keep Dialog wrapper and header
- [ ] Maintain CDNSelector dialog integration
- [ ] Keep existing props interface unchanged

**Validation**:
- [ ] Settings dialog works identically to before
- [ ] All settings functional
- [ ] Category navigation works
- [ ] File reduced from ~500 lines to ~100 lines
- [ ] No TypeScript errors
- [ ] No visual regressions

---

### Task 4.2: Refactor Mobile Settings Route
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 3.1

- [ ] Update `app/routes/settings.tsx`
- [ ] Remove all inline setting rendering code (~500 lines)
- [ ] Import SettingsRenderer and settingsCategories
- [ ] Replace content with:
  ```tsx
  <SettingsRenderer
    mode="page"
    categories={settingsCategories}
    presetsCount={presets.length}
    categoriesCount={categoriesCount}
    onResetCommands={handleResetCommands}
  />
  ```
- [ ] Keep page header with back button
- [ ] Maintain store hooks (pass to SettingsRenderer context)
- [ ] Keep CDNSelector dialog integration

**Validation**:
- [ ] Mobile settings page works identically to before
- [ ] All settings functional
- [ ] Flat layout renders correctly
- [ ] File reduced from ~610 lines to ~150 lines
- [ ] No TypeScript errors
- [ ] No visual regressions

---

## Phase 5: Testing and Validation (Day 3)

### Task 5.1: Functional Testing
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 4.2

- [ ] Test SettingsDialog (desktop):
  - Change default mode → verify saved
  - Toggle init dialog → verify persisted
  - Change batch size → verify queue config updated
  - Toggle auto-start → verify queue config updated
  - Click clear history → verify confirmation and execution
  - Click reset presets → verify double confirmation
  - Open CDN selector → verify dialog opens
  - Switch categories → verify content updates
- [ ] Test Settings route (mobile):
  - All above scenarios
  - Scroll performance with long content
  - Back button navigation
  - Touch targets meet 44px
- [ ] Test consistency:
  - Change setting in dialog → verify reflected in route
  - Change setting in route → verify reflected in dialog
  - Verify store state synced

**Validation**:
- [ ] All settings work in both modes
- [ ] Store changes sync correctly
- [ ] Confirmations work
- [ ] Toast notifications appear
- [ ] No console errors

---

### Task 5.2: Type Safety and Lint Check
**Priority**: High  
**Estimated**: 30 minutes  
**Dependencies**: Task 5.1

- [ ] Run `pnpm typecheck` → zero errors
- [ ] Run `pnpm lint` → zero critical issues
- [ ] Check all imports resolve correctly
- [ ] Verify store bindings type-safe
- [ ] Check component prop types

**Validation**:
- [ ] TypeScript check passes
- [ ] Biome lint passes
- [ ] All types correct
- [ ] No unused imports

---

### Task 5.3: Performance Check
**Priority**: Medium  
**Estimated**: 30 minutes  
**Dependencies**: Task 5.2

- [ ] Measure bundle size change
- [ ] Test dialog open/close performance
- [ ] Test settings route navigation performance
- [ ] Test scroll performance (mobile)
- [ ] Check for memory leaks

**Validation**:
- [ ] Bundle size increase < 5KB (consolidation should reduce size)
- [ ] Dialog responsive (< 100ms)
- [ ] Route navigation smooth
- [ ] 60fps scrolling
- [ ] No memory leaks

---

### Task 5.4: Code Quality Check
**Priority**: Medium  
**Estimated**: 30 minutes  
**Dependencies**: Task 5.3

- [ ] Verify no files exceed 500 lines
  - SettingsDialog: ~100 lines (was ~500)
  - settings.tsx: ~150 lines (was ~610)
  - settings-config.ts: ~300 lines (new)
  - SettingsRenderer.tsx: ~200 lines (new)
  - Setting components: ~50-100 lines each
- [ ] Add JSDoc comments to public APIs
- [ ] Ensure consistent code style
- [ ] Remove any unused code

**Validation**:
- [ ] All files under 500 lines
- [ ] Well-documented
- [ ] Clean and maintainable
- [ ] No dead code

---

## Phase 6: Documentation (Day 3)

### Task 6.1: Update Component Documentation
**Priority**: Medium  
**Estimated**: 1 hour  
**Dependencies**: Task 5.4

- [ ] Update `app/components/AGENTS.md`
- [ ] Document settings configuration system
- [ ] Document SettingsRenderer usage
- [ ] Add examples for adding new settings
- [ ] Document store binding patterns

**Validation**:
- [ ] Documentation clear
- [ ] Examples work
- [ ] No broken links

---

### Task 6.2: Update Root AGENTS.md
**Priority**: Low  
**Estimated**: 30 minutes  
**Dependencies**: Task 6.1

- [ ] Update `AGENTS.md` project structure
- [ ] Add `app/config/settings-config.ts`
- [ ] Add `app/components/settings/` directory
- [ ] Update architecture section
- [ ] Add to update log

**Validation**:
- [ ] Structure accurate
- [ ] Changelog updated
- [ ] Clear for future AI agents

---

## Summary

**Total Estimated Time**: 3 days (24 hours)

**Critical Path**:
1. Config types → Config data → Setting components
2. SettingsRenderer → Dialog refactor → Route refactor
3. Testing → Documentation

**Benefits**:
- ✅ Single source of truth (settings-config.ts)
- ✅ 80% code reduction (1110 lines → ~220 lines in consuming files)
- ✅ DRY principle respected
- ✅ Type-safe configuration
- ✅ Easy to add new settings
- ✅ Consistent behavior across desktop/mobile
- ✅ Better maintainability

**Migration Risk**: LOW
- No user-facing changes
- Existing settings continue working
- Can test incrementally
- Easy to rollback
