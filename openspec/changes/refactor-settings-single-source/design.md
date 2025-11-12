# Design: Settings Configuration System

## Context

Currently, settings are implemented in two separate locations:
1. **SettingsDialog.tsx** (~500 lines): Desktop dialog with categorized navigation
2. **app/routes/settings.tsx** (~610 lines): Mobile route with flat layout

Both implementations:
- Duplicate setting rendering logic
- Duplicate store binding code
- Duplicate validation and handlers
- Risk inconsistency when adding/modifying settings

This violates DRY principles and makes maintenance difficult.

**Constraints**:
- Must maintain existing functionality (no user-facing changes)
- Must support both desktop dialog and mobile route layouts
- Must remain type-safe with TypeScript
- Store integrations must work identically (Zustand: ffmpegWeb, task, CDN, command)
- Must follow existing code style (shadcn/ui, TailwindCSS v4)

**Stakeholders**: Developers maintaining settings, users expecting consistent behavior

## Goals / Non-Goals

### Goals
- ✅ Single configuration source for all settings
- ✅ Reusable components for setting types (select, switch, button, card)
- ✅ Support two rendering strategies: dialog (categorized) and page (flat)
- ✅ Type-safe configuration with TypeScript
- ✅ Reduce code duplication by ~80% (1110 lines → ~220 lines)
- ✅ Make adding new settings trivial (one place, works everywhere)

### Non-Goals
- ❌ Change existing settings functionality or UX
- ❌ Add new settings in this refactor
- ❌ Modify store implementations
- ❌ Change mobile/desktop responsive behavior
- ❌ Create settings validation framework (use existing store logic)

## Decisions

### Decision 1: Centralized Configuration File
**What**: Create `app/config/settings-config.ts` as single source of truth

**Why**: 
- All settings metadata in one place
- Easy to add/modify/remove settings
- Type-safe configuration
- Clear contract between config and rendering

**Structure**:
```typescript
// Types
type SettingType = 'select' | 'switch' | 'button' | 'card' | 'stats' | 'custom';

interface SettingConfig {
  id: string;                    // Unique identifier
  category: SettingCategory;     // Which category
  type: SettingType;             // Component type
  title: string;                 // Display title
  description?: string;          // Help text
  icon?: LucideIcon;             // Optional icon
  
  // Type-specific config
  options?: SelectOption[];      // For select
  action?: () => void;           // For button
  variant?: ButtonVariant;       // For button
  storeBinding?: StoreBinding;   // Store connection
  
  // Custom render function for complex cases
  render?: (mode: 'dialog' | 'page') => React.ReactNode;
}

interface SettingCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  settings: SettingConfig[];
}

// Data
export const settingsCategories: SettingCategory[] = [
  {
    id: 'general',
    label: '通用',
    icon: Settings2,
    description: '基本设置和默认行为',
    settings: [
      {
        id: 'default-mode',
        type: 'select',
        title: '默认加载模式',
        description: '选择 FFmpeg 的默认运行模式',
        storeBinding: {
          store: 'ffmpegWeb',
          key: 'savedMode',
          setter: 'setSavedMode',
        },
        options: [
          { value: 'ask', label: '每次询问（推荐）' },
          { value: 'multi-thread', label: '多线程（性能最佳）' },
          { value: 'single-thread', label: '单线程（兼容性最好）' },
        ],
      },
      // ... more settings
    ],
  },
  // ... more categories
];
```

**Alternatives Considered**:
- JSON configuration: ❌ Not type-safe, no JSX support
- Component props drilling: ❌ Too verbose, hard to maintain
- Context API: ❌ Overkill, adds complexity

### Decision 2: Reusable Setting Components
**What**: Create component library in `app/components/settings/`

**Why**:
- Each setting type has consistent UI
- Easy to test and maintain
- Can be reused in other contexts (future settings pages)
- Encapsulate store binding logic

**Components**:
```
settings/
├── SettingItem.tsx          # Base wrapper (label, description, layout)
├── SettingSelect.tsx        # Select dropdown
├── SettingSwitch.tsx        # Toggle switch
├── SettingButton.tsx        # Action button
├── SettingCard.tsx          # Info/status cards
├── SettingStats.tsx         # Stats grid (storage section)
├── SettingCustom.tsx        # Custom content (About section)
├── SettingsRenderer.tsx     # Main renderer (strategy pattern)
└── index.ts                 # Unified exports
```

Each component:
- Accepts `config: SettingConfig`
- Accepts `mode: 'dialog' | 'page'`
- Handles store binding internally
- Shows toast notifications on changes
- Maintains 44px touch targets

**Alternatives Considered**:
- Single monolithic component: ❌ Too complex, hard to test
- Inline functions: ❌ No reusability, no type safety
- HOC pattern: ❌ Over-engineered for this use case

### Decision 3: Strategy Pattern for Rendering
**What**: `SettingsRenderer` component with mode prop

**Why**:
- Single component handles both layouts
- Logic shared, only presentation differs
- Easy to add new modes in future (e.g., 'compact')

**Implementation**:
```tsx
interface SettingsRendererProps {
  mode: 'dialog' | 'page';
  categories: SettingCategory[];
  activeCategory?: string;          // Dialog only
  onCategoryChange?: (id: string) => void;  // Dialog only
  presetsCount: number;
  categoriesCount: number;
  onResetCommands?: () => void;
}

export function SettingsRenderer({ mode, ...props }: SettingsRendererProps) {
  if (mode === 'dialog') {
    return (
      <div className="flex h-full">
        {/* Left sidebar: categories */}
        <CategoryNav {...props} />
        {/* Right content: active category settings */}
        <SettingsContent {...props} />
      </div>
    );
  }
  
  if (mode === 'page') {
    return (
      <div className="space-y-8">
        {/* Flat layout: all categories stacked */}
        {categories.map(category => (
          <CategorySection key={category.id} category={category} {...props} />
        ))}
      </div>
    );
  }
}
```

**Alternatives Considered**:
- Separate components for each mode: ❌ More code duplication
- Render props pattern: ❌ Harder to understand
- Hooks-based: ❌ Can't abstract layout differences well

### Decision 4: Store Binding Pattern
**What**: Declarative store binding in config

**Why**:
- Type-safe store access
- Consistent binding pattern
- Easy to audit which settings use which stores

**Pattern**:
```typescript
interface StoreBinding {
  store: 'ffmpegWeb' | 'task' | 'cdn' | 'command';
  key: string;              // State key to read
  setter?: string;          // Action name to call
  transform?: (value: any) => any;  // Value transformation
}

// In component
function SettingSelect({ config }: { config: SettingConfig }) {
  const store = useStore(config.storeBinding.store);
  const value = store[config.storeBinding.key];
  const onChange = store[config.storeBinding.setter];
  
  return (
    <Select value={value} onValueChange={(v) => {
      onChange?.(config.transform?.(v) ?? v);
      toast.success('已保存');
    }}>
      {/* ... */}
    </Select>
  );
}
```

**Alternatives Considered**:
- Direct store imports: ❌ Couples components to specific stores
- Custom hooks per setting: ❌ Too many hooks
- Context providers: ❌ Overkill, adds nesting

## Risks / Trade-offs

### Risk 1: Config file becomes too large
**Mitigation**: 
- Limit to ~300 lines (estimated 25 settings × 12 lines each)
- If exceeds 500 lines, split into category files:
  ```
  config/settings/
  ├── index.ts          # Main export
  ├── general.ts        # General settings
  ├── performance.ts    # Performance settings
  └── ...
  ```

### Risk 2: Complex custom settings don't fit config model
**Mitigation**:
- Support `render` function in config for custom cases
- Fall back to inline rendering if needed
- Document when to use `SettingCustom` vs inline

### Risk 3: Breaking changes during refactor
**Mitigation**:
- Keep existing components untouched until SettingsRenderer ready
- Test incrementally (Dialog first, then Route)
- Easy rollback (just revert file changes)
- No schema or store changes

### Trade-off: Abstraction vs Flexibility
**Decision**: Favor abstraction
- **Pro**: Easier to maintain, consistent behavior
- **Con**: Harder to add one-off custom settings
- **Rationale**: Most settings fit standard types; custom cases rare

### Trade-off: Type Safety vs Dynamic Config
**Decision**: Favor type safety
- **Pro**: Catch errors at compile time, better DX
- **Con**: Can't load settings from API/JSON
- **Rationale**: Settings are app config, not user data; compile-time is fine

## Migration Plan

### Phase 1: Build New System (Non-Breaking)
1. Create `settings-config.ts` with all current settings
2. Build setting components in `settings/` directory
3. Build `SettingsRenderer`
4. Validate with storybook/visual tests

### Phase 2: Migrate SettingsDialog
1. Update `SettingsDialog.tsx` to use SettingsRenderer
2. Remove old rendering code (~300 lines)
3. Test all settings still work
4. Visual regression testing

### Phase 3: Migrate Settings Route
1. Update `app/routes/settings.tsx` to use SettingsRenderer
2. Remove old rendering code (~500 lines)
3. Test all settings still work
4. Test mobile-specific scenarios

### Phase 4: Cleanup
1. Remove any unused utility functions
2. Update documentation
3. Run lint and type checks
4. Performance testing

### Rollback Plan
If critical issues found:
1. Revert file changes (git revert)
2. No database or store schema changes, so safe
3. Document issue for future retry

## Open Questions

1. **Q**: Should we support settings plugins/extensions?
   **A**: No, out of scope. Keep simple for v1.

2. **Q**: Should settings config be hot-reloadable in dev?
   **A**: Nice-to-have but not required. HMR already works.

3. **Q**: Should we validate config at build time?
   **A**: TypeScript provides validation. Runtime validation unnecessary.

4. **Q**: How to handle settings that need async actions (e.g., fetch data)?
   **A**: Use store actions. Config just declares binding, store handles logic.

## Success Metrics

- ✅ SettingsDialog.tsx: 500 lines → ~100 lines (80% reduction)
- ✅ settings.tsx: 610 lines → ~150 lines (75% reduction)
- ✅ Zero type errors after refactor
- ✅ Zero visual regressions
- ✅ All settings functional in both modes
- ✅ Bundle size increase < 5KB (net reduction expected)
- ✅ No performance regressions
- ✅ Can add new setting in < 20 lines of config
