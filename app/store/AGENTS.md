# Store Module Documentation

## Overview

The store module manages application state using Zustand. Each store is organized into subdirectories with separated concerns:
- `types.ts` - TypeScript interfaces and type definitions
- `index.ts` - Zustand store implementation with actions
- `default-values.ts` - Default configurations and initial values (where applicable)

## Store Structure

### Command Store (`store/command/`)
**Purpose**: Manages FFmpeg command presets

**Key Features**:
- Preset CRUD operations
- Category management
- Import/Export functionality
- Batch operations
- LocalStorage persistence

**Default Presets**:
- All presets are WASM-compatible
- Parameterized for flexibility
- Optimized for memory usage

### FFmpeg Web Store (`store/ffmpegWeb/`)
**Purpose**: Manages FFmpeg Web page UI state

**Key States**:
- Client/loading states
- Multi-thread mode preferences
- Selected presets and form values
- Dialog visibility states
- Execution progress

**Persistence**: Only saves user mode preference

### Log Store (`store/log/`)
**Purpose**: Manages application logs

**Features**:
- Log entry storage with timestamps
- Instance ID tracking
- Log clearing functionality

**Note**: Logs are not persisted

### Task Store (`store/task/`)
**Purpose**: Manages task queue and execution

**Key Features**:
- Task queue management
- Executing tasks tracking
- Recent completed tasks (in-memory)
- Task result Blob URLs
- IndexedDB persistence

**Important**: Blob URLs are cleared on page unload

### CDN Store (`store/cdn/`)
**Purpose**: Manages CDN configuration and health

**Key Features**:
- CDN provider management
- Health status tracking
- Auto-select best CDN
- Custom URL support
- Configuration persistence

## Best Practices

### When Creating a New Store

1. **Structure**: Create subdirectory with types/index/default-values (if needed)
2. **Types**: Define clear interfaces in `types.ts`
3. **Persistence**: Use Zustand persist middleware only for user preferences
4. **Actions**: Keep actions focused and single-purpose
5. **Normalization**: Normalize data (e.g., category names)

### When Consuming Stores

1. **Selective Subscription**: Only subscribe to needed state
   ```ts
   const value = useStore((state) => state.value);
   ```
2. **Avoid Unnecessary Re-renders**: Use selectors wisely
3. **Direct Store Access**: Components can consume stores directly via hooks
4. **Prop Drilling**: Avoid passing store values through props unnecessarily

### Migration and Versioning

- Use `version` field in persist config
- Provide `migrate` function for breaking changes
- Use `onRehydrateStorage` for initialization

## Common Patterns

### Adding a New Action
```typescript
// In types.ts
export interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

// In index.ts
export const useMyStore = create<MyStore>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

### Computed Values
Use selectors or helper functions:
```typescript
const getBestItem = (state: MyState) => {
  return state.items.find(item => item.score > 10);
};
```

### Batch Updates
Combine multiple set calls:
```typescript
set((state) => ({
  value1: newValue1,
  value2: newValue2,
  value3: newValue3,
}));
```

## Testing Considerations

- Stores are pure functions and easy to test
- Use `getState()` to inspect state in tests
- Reset stores between tests if needed
- Mock persistence layer for unit tests
