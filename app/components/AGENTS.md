# Components Module Documentation

## Overview

The components module contains reusable React components. All components use TypeScript, shadcn/ui, and follow React 19 best practices.

## Component Structure

### UI Components (`components/ui/`)
shadcn/ui components based on Radix UI primitives. Do not modify these directly - regenerate using shadcn CLI if updates needed.

### Feature Components

#### Command Management
- **CommandEditor**: Visual editor for FFmpeg command presets
- **CommandList**: Display and manage command presets
- **CommandFilter**: Category-based filtering
- **CommandPanel**: Integrated filter + list (reduces props)

#### Execution
- **ExecutionPanel**: Main execution interface (minimal props via hooks)
- **DynamicForm**: JSON schema-driven form generator
- **ArgsEditor**: FFmpeg arguments editor
- **FormSchemaEditor**: Visual form field configurator

#### Progress & Logging
- **ProgressLogViewer**: Virtualized log viewer with search/filter
- **TaskHistoryViewer**: Historical task browser with pagination

#### Queue & Tasks
- **QueueControlPanel**: Queue management UI

#### Dialogs (Dialog Components)

所有对话框组件均为独立文件，直接导入使用：

- **EditorDialog.tsx**: 
  - 命令预设编辑器对话框
  - 支持新建/编辑/CLI导入完善
  - 使用 CommandEditor 组件

- **CLIImportDialog.tsx**: 
  - CLI 命令导入对话框
  - 多行文本输入，命令解析
  - 简洁的导入界面

- **SettingsDialog.tsx**: 
  - 应用设置对话框（Notion 风格布局）
  - 使用 SettingsRenderer 组件 (dialog mode)
  - 2列布局：左侧分类导航 + 右侧内容区
  - 5大分类：通用、性能、存储、CDN、关于
  - 集成 CDNSelector 组件
  - **重构后**: 从 611 行减少到 104 行 (83%)

#### Settings System (`components/settings/`)

**Settings Configuration** (`config/settings-config.ts`):
- 单一数据源：所有设置的配置定义
- 类型定义：`SettingType`, `SettingConfig`, `SettingCategory`, `StoreBinding`
- 与 Zustand stores 集成：ffmpegWeb, task, cdn, command

**Reusable Components**:
- **SettingItem**: 基础包装组件（标签、描述、布局）
- **SettingSelect**: 下拉选择（带 store 绑定）
- **SettingSwitch**: 开关切换（带 store 绑定）
- **SettingButton**: 操作按钮
- **SettingCard**: 信息/状态卡片
- **SettingStats**: 存储统计网格
- **SettingCustom**: 自定义内容（About 部分）
- **SettingsRenderer**: 主渲染器（策略模式）
  - `mode="dialog"`: 桌面双列布局
  - `mode="page"`: 移动端平铺布局

**Usage Pattern**:
```typescript
<SettingsRenderer
  mode="dialog" // or "page"
  categories={settingsCategories}
  activeCategory={activeCategory}
  onCategoryChange={setActiveCategory}
  context={{
    presetsCount,
    categoriesCount,
    storageSize,
    onResetCommands,
    onClearHistory,
    onOpenCDNSelector,
    isClearing,
  }}
/>
```

**Adding New Settings**:
只需在 `settings-config.ts` 中添加配置：
```typescript
{
  id: 'my-setting',
  type: 'switch', // select | switch | button | card | stats | custom
  title: '设置标题',
  description: '设置描述',
  storeBinding: {
    store: 'ffmpegWeb',
    key: 'myProperty',
    setter: 'setMyProperty',
  },
}
```

- **ResetConfirmDialog.tsx**: 
  - 重置命令预设确认对话框
  - AlertDialog 样式
  - 二次确认防误操作

- **CDNSelector.tsx**: 
  - CDN 提供商选择和配置
  - 自动选择最快 CDN
  - 健康状态检查
  - 自定义 URL 支持

- **InitializationDialog.tsx**: 
  - FFmpeg 加载模式选择
  - 居中对话框
  - 记住选择功能
- **BatchFileUpload**: Multi-file upload component

#### Settings & Dialogs
- **FFmpegToolbar**: Top toolbar with actions
- **EditorDialog**: Command preset editor dialog
- **CLIImportDialog**: CLI command import dialog
- **SettingsDialog**: Application settings (Notion-style layout)
- **ResetConfirmDialog**: Reset confirmation dialog
- **InitializationDialog**: Mode selection on first load
- **CDNSelector**: CDN configuration dialog

## Design Principles

### Props vs Hooks
**Use Props For**:
- Callbacks that trigger parent actions
- Component-specific configuration
- Event handlers

**Use Hooks/Stores For**:
- Global state (commands, tasks, logs)
- Form values
- UI state (dialogs, selections)

### Example: ExecutionPanel
❌ **Before** (17 props):
```typescript
<ExecutionPanel
  selectedPreset={preset}
  formValues={values}
  copiedCommand={copied}
  onFormChange={setValues}
  queue={queue}
  executingTasks={executing}
  // ... 11 more props
/>
```

✅ **After** (4 props):
```typescript
<ExecutionPanel
  onCopyCommand={handleCopy}
  onExecute={execute}
  onStartQueue={start}
  onStopQueue={stop}
/>
```
*Component consumes state via hooks internally*

## Component Patterns

### Focused Hooks
Create hooks for specific functionality:
```typescript
// hooks/execution/useCommandExecution.ts
export function useCommandExecution() {
  const selectedPreset = useFFmpegWebStore(s => s.selectedPreset);
  const formValues = useFFmpegWebStore(s => s.formValues);
  // ... return consolidated state
}
```

### Compound Components
Group related components:
```typescript
<Card>
  <CollapsibleTrigger />
  <CollapsibleContent />
</Card>
```

### Render Props Pattern
For customization:
```typescript
<TaskHistory
  renderItem={(task) => <CustomTaskCard task={task} />}
/>
```

## Styling Guidelines

### Use Tailwind CSS
- Utility-first approach
- shadcn/ui tokens for consistency
- `cn()` utility for conditional classes

```typescript
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)}>
```

### Color Semantics
- `primary` - Main actions
- `secondary` - Alternative actions
- `destructive` - Delete/dangerous actions
- `muted` - Less important content
- `accent` - Highlights

### Responsive Design
```typescript
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
```

## Component Best Practices

### 1. TypeScript Props Interface
Always define props interface:
```typescript
interface MyComponentProps {
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}

export function MyComponent({ value, onChange, optional }: MyComponentProps) {
  // ...
}
```

### 2. Use Hooks for State
```typescript
const [state, setState] = useState(initial);
const value = useStore(s => s.value);
```

### 3. Memoization
Use when needed:
```typescript
const expensiveValue = useMemo(() => compute(input), [input]);
const callback = useCallback(() => action(), [deps]);
```

### 4. Accessibility
- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- shadcn/ui handles most of this

### 5. Error Boundaries
Wrap risky components:
```typescript
<ErrorBoundary fallback={<Error />}>
  <RiskyComponent />
</ErrorBoundary>
```

## Form Components

### DynamicForm
Generates forms from JSON schema:
```typescript
<DynamicForm
  schema={[
    { name: 'width', type: 'number', label: 'Width', min: 0 },
    { name: 'height', type: 'number', label: 'Height', min: 0 },
  ]}
  values={values}
  onChange={setValues}
/>
```

**Supported Field Types**:
- text, number, checkbox
- select, slider
- file-input, file-output

### Form Validation
Use react-hook-form or manual validation:
```typescript
const validate = (values: FormValues) => {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.required) errors.required = 'Required';
  return errors;
};
```

## List Components

### Virtualization
Use @tanstack/react-virtual for large lists:
```typescript
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
});
```

### Pagination
Implement cursor or offset-based:
```typescript
<TaskHistoryViewer
  page={page}
  perPage={20}
  onPageChange={setPage}
/>
```

## Dialog Components

### Pattern
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Nested Dialogs
Use separate state for each:
```typescript
const [showMain, setShowMain] = useState(false);
const [showNested, setShowNested] = useState(false);
```

## Performance Optimization

### React.memo
For expensive renders:
```typescript
export const ExpensiveComponent = React.memo(({ data }) => {
  // ...
});
```

### Code Splitting
Lazy load heavy components:
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Debouncing
For search inputs:
```typescript
const { run: debouncedSearch } = useDebounceFn(
  (value) => setQuery(value),
  { wait: 300 }
);
```

## Testing Components

### Unit Tests
Test component logic:
```typescript
test('button click calls handler', () => {
  const handler = vi.fn();
  render(<Button onClick={handler}>Click</Button>);
  fireEvent.click(screen.getByText('Click'));
  expect(handler).toHaveBeenCalled();
});
```

### Integration Tests
Test with real stores:
```typescript
test('form submission updates store', () => {
  render(<FormComponent />);
  // ... interact
  expect(useStore.getState().value).toBe(expected);
});
```

## Common Issues

### Props Drilling
❌ Passing store values through props
✅ Consume stores directly with hooks

### Over-Rendering
❌ Subscribing to entire store
✅ Use selectors: `useStore(s => s.value)`

### Stale Closures
❌ Referencing outdated values
✅ Use refs or functional updates

### Memory Leaks
❌ Forgetting cleanup
✅ Return cleanup from useEffect
