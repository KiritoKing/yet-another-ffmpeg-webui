# Services Module Documentation

## Overview

The services module contains business logic and external integrations. Services are stateless utility classes or functions that encapsulate complex operations.

## Service Structure

### FFmpeg Service (`services/ffmpegService.ts`)
**Purpose**: Core FFmpeg.wasm integration

**Key Features**:
- Single/Multi-thread mode support
- CDN provider configuration
- Command execution
- Progress and log callbacks
- File system operations

**Usage**:
```typescript
const service = new FFmpegService({
  mode: 'multi',
  cdnProvider: getBestProvider(),
  onLog: (message) => addLog(message),
  onProgress: (progress, time) => setProgress(progress),
});

await service.load();
const result = await service.executeCommand({
  inputFiles: [{ file, name: 'input.mp4' }],
  outputFileName: 'output.mp4',
  ffmpegArgs: ['-i', 'input.mp4', '-c', 'copy', 'output.mp4'],
});
```

**Important Notes**:
- Must call `load()` before executing commands
- Only one command can execute at a time
- Use `abort()` to cancel (will reload instance)
- Blob URL conversion for output

### CDN Service (`services/cdnService.ts`)
**Purpose**: CDN health checking and URL generation

**Key Features**:
- Health check with timeout (5s)
- Batch health checking
- Version validation
- URL generation for FFmpeg resources
- Custom URL validation

**Usage**:
```typescript
// Check single CDN
const health = await CDNService.checkHealth(provider);

// Check all CDNs
const results = await CDNService.checkAllHealth(providers);

// Generate URLs
const urls = CDNService.generateFFmpegUrls(provider, '0.12.15');

// Validate custom URL
const isValid = CDNService.validateCustomUrl('https://my-cdn.com/@ffmpeg');
```

### FFmpeg Pool (`services/ffmpegPool.ts`)
**Purpose**: Manage multiple FFmpeg instances for concurrent processing

**Key Features**:
- Instance pooling
- Single/Multi-thread provider interfaces
- Instance lifecycle management

**Usage**:
```typescript
// Create pool
const pool = new FFmpegWorkerPool({
  size: 4,
  mode: 'multi',
  cdnProvider: provider,
});

// Get instance
const ffmpeg = await pool.acquire();

// Execute
const result = await ffmpeg.executeCommand(options);

// Release
pool.release(ffmpeg);

// Cleanup
await pool.dispose();
```

### Queue Processor (`services/queueProcessor.ts`)
**Purpose**: Process task queues with concurrency control

**Key Features**:
- Concurrent task execution
- Task lifecycle callbacks
- Queue control (start/stop)
- Error handling per task

**Usage**:
```typescript
const processor = new QueueProcessor({
  pool: ffmpegPool,
  onTaskComplete: (taskId, result) => { /* ... */ },
  onTaskError: (taskId, error) => { /* ... */ },
  onTaskProgress: (taskId, progress) => { /* ... */ },
});

processor.start(tasks, batchSize);
await processor.stop();
```

### Task Database (`services/taskDatabase.ts`)
**Purpose**: IndexedDB persistence for task history

**Key Features**:
- Dexie.js wrapper
- Task persistence
- Query and filtering
- Pagination support

**Usage**:
```typescript
// Add task
await taskDB.tasks.put(task);

// Query tasks
const tasks = await taskDB.tasks
  .where('status').equals('completed')
  .reverse()
  .limit(20)
  .toArray();

// Clear old tasks
await taskDB.tasks.where('completedAt').below(timestamp).delete();
```

## Best Practices

### Creating New Services

1. **Stateless**: Services should not maintain state (use stores)
2. **Single Responsibility**: Each service has one clear purpose
3. **Static Methods**: Use static methods for utility functions
4. **Error Handling**: Always provide meaningful error messages
5. **Type Safety**: Use TypeScript interfaces for all parameters

### Service Dependencies

- Services can depend on other services
- Services should NOT depend on stores (pass data via parameters)
- Services can accept callbacks for events

### Async Operations

- All I/O operations should be async
- Use try/catch for error handling
- Provide timeout mechanisms where appropriate
- Clean up resources in finally blocks

### Testing Services

- Services are pure business logic - easy to test
- Mock external dependencies (FFmpeg, fetch, etc.)
- Test error conditions
- Test resource cleanup

## Common Patterns

### Service with Callbacks
```typescript
class MyService {
  constructor(
    private config: {
      onProgress?: (p: number) => void;
      onComplete?: () => void;
    }
  ) {}
  
  async execute() {
    this.config.onProgress?.(0.5);
    // ... work
    this.config.onComplete?.();
  }
}
```

### Service with Resource Management
```typescript
class ResourceService {
  private resource: Resource | null = null;
  
  async acquire() {
    this.resource = await createResource();
  }
  
  async release() {
    if (this.resource) {
      await this.resource.cleanup();
      this.resource = null;
    }
  }
}
```

### Service with Retry Logic
```typescript
class RetryService {
  static async fetchWithRetry(
    url: string,
    maxRetries = 3
  ): Promise<Response> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetch(url);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await delay(1000 * (i + 1));
      }
    }
    throw new Error('Unreachable');
  }
}
```

## Integration with Hooks

Services are typically consumed through custom hooks:

```typescript
// In hooks/
export function useMyService() {
  const serviceRef = useRef<MyService | null>(null);
  
  const initialize = useCallback(async () => {
    serviceRef.current = new MyService(config);
    await serviceRef.current.initialize();
  }, []);
  
  return { initialize };
}
```

This pattern:
- Keeps service instances stable
- Manages lifecycle properly
- Provides clean API to components
