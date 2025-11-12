# Driver Abstraction Specification

**Capability**: Driver Abstraction  
**Version**: 1.0.0  
**Status**: Proposed  
**Related**: native-execution, auto-detection

---

## Overview

This specification defines the driver abstraction layer that allows FFmpeg Easy to support multiple execution backends (WASM, native) through a unified interface. The abstraction ensures that application code can work with any driver implementation without knowing implementation details.

---

## ADDED Requirements

### Requirement: Driver Interface Contract

All FFmpeg driver implementations MUST conform to the `IFFmpegDriver` interface, providing consistent lifecycle, execution, and capability APIs.

#### Scenario: Driver Lifecycle Management

**Given** a driver instance is created with configuration

**When** the application calls lifecycle methods in sequence

**Then**
- `load()` MUST initialize the driver and prepare for execution
- `isLoaded()` MUST return `false` before load, `true` after successful load
- Multiple calls to `load()` when already loaded MUST throw error
- `terminate()` MUST clean up resources and reset loaded state
- `isLoaded()` MUST return `false` after terminate

**Implementation Example**:
```typescript
const driver: IFFmpegDriver = new SomeDriver(config);

expect(driver.isLoaded()).toBe(false);

await driver.load();
expect(driver.isLoaded()).toBe(true);

// Attempting to load again should throw
await expect(driver.load()).rejects.toThrow();

await driver.terminate();
expect(driver.isLoaded()).toBe(false);
```

---

#### Scenario: Command Execution Contract

**Given** a driver is loaded

**When** `executeCommand(options)` is called with valid input

**Then**
- The driver MUST accept input files as File objects
- The driver MUST execute FFmpeg with provided arguments
- The driver MUST return a Blob containing output data
- The driver MUST invoke `onProgress` callback during execution
- The driver MUST throw meaningful errors on failure

**Implementation Example**:
```typescript
const driver: IFFmpegDriver = new SomeDriver(config);
await driver.load();

const result = await driver.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'output.mp4',
  ffmpegArgs: ['-i', 'input.mp4', '-c', 'copy', 'output.mp4'],
  onProgress: (progress, time) => {
    console.log(`Progress: ${progress}%, Time: ${time}s`);
  }
});

expect(result).toBeInstanceOf(Blob);
expect(result.size).toBeGreaterThan(0);
```

---

#### Scenario: Execution Abortion

**Given** a driver is currently executing a command

**When** `abort()` is called

**Then**
- The driver MUST stop FFmpeg execution immediately
- The driver MUST clean up temporary resources
- The `executeCommand()` Promise MUST reject with AbortError
- The driver MUST remain in loaded state (ready for next command)
- Subsequent `executeCommand()` calls MUST work normally

**Implementation Example**:
```typescript
const driver: IFFmpegDriver = new SomeDriver(config);
await driver.load();

const executionPromise = driver.executeCommand({
  inputFiles: [{ file: largeFile, name: 'input.mp4' }],
  outputFileName: 'output.mp4',
  ffmpegArgs: ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4']
});

// Abort after some time
setTimeout(() => driver.abort(), 1000);

await expect(executionPromise).rejects.toThrow('abort');
expect(driver.isLoaded()).toBe(true);

// Should be able to execute again
const result = await driver.executeCommand({...});
expect(result).toBeDefined();
```

---

### Requirement: Driver Capabilities Reporting

Drivers MUST accurately report their capabilities to allow the application to make informed decisions and provide appropriate user feedback.

#### Scenario: Capability Query

**Given** a driver instance (loaded or not loaded)

**When** `getCapabilities()` is called

**Then**
- The driver MUST return a `DriverCapabilities` object
- `maxFileSize` MUST be a number (in bytes) or 'unlimited'
- `hardwareAcceleration` MUST be a boolean indicating GPU support
- `availableEncoders` MUST be an array of encoder names
- `supportedFormats` MUST be an array of output format extensions

**Implementation Example**:
```typescript
const wasmDriver = new WasmDriver(config);
const capabilities = wasmDriver.getCapabilities();

expect(capabilities.maxFileSize).toBe(500 * 1024 * 1024); // 500MB
expect(capabilities.hardwareAcceleration).toBe(false);
expect(capabilities.availableEncoders).toContain('libx264');
expect(capabilities.supportedFormats).toContain('mp4');

const nativeDriver = new NativeDriver(config);
const nativeCapabilities = nativeDriver.getCapabilities();

expect(nativeCapabilities.maxFileSize).toBe('unlimited');
expect(nativeCapabilities.hardwareAcceleration).toBe(true); // If GPU available
expect(nativeCapabilities.availableEncoders).toContain('h264_nvenc');
```

---

#### Scenario: Driver Type Identification

**Given** any driver instance

**When** `getType()` is called

**Then**
- WasmDriver MUST return 'wasm'
- NativeDriver MUST return 'native'
- The return type MUST be literal 'wasm' | 'native'

**Implementation Example**:
```typescript
const wasmDriver = new WasmDriver(config);
expect(wasmDriver.getType()).toBe('wasm');

const nativeDriver = new NativeDriver(config);
expect(nativeDriver.getType()).toBe('native');
```

---

### Requirement: Error Handling Consistency

All drivers MUST provide consistent error handling with meaningful messages across different failure scenarios.

#### Scenario: Load Failure

**Given** a driver that cannot be loaded (environment not supported, resources missing)

**When** `load()` is called

**Then**
- The Promise MUST reject with a descriptive error
- The error message MUST indicate the specific reason
- The driver MUST remain in unloaded state
- Subsequent `load()` attempts MUST be allowed

**Implementation Example**:
```typescript
const driver = new WasmDriver({ mode: 'multi' });

// Simulate environment without SharedArrayBuffer
Object.defineProperty(window, 'SharedArrayBuffer', { value: undefined });

await expect(driver.load()).rejects.toThrow('multi-thread not supported');
expect(driver.isLoaded()).toBe(false);

// Can try again with different config
driver.configure({ mode: 'single' });
await driver.load(); // Should succeed
```

---

#### Scenario: Execution Error

**Given** a loaded driver

**When** `executeCommand()` is called with arguments that cause FFmpeg to fail

**Then**
- The Promise MUST reject with an error
- The error message MUST include FFmpeg's error output
- The error SHOULD be parsed for common issues (codec not found, invalid params)
- The driver MUST remain in loaded state for retry

**Implementation Example**:
```typescript
const driver = new SomeDriver(config);
await driver.load();

await expect(driver.executeCommand({
  inputFiles: [{ file: videoFile, name: 'input.mp4' }],
  outputFileName: 'output.mp4',
  ffmpegArgs: ['-i', 'input.mp4', '-c:v', 'invalid_codec', 'output.mp4']
})).rejects.toThrow(/codec.*not found|unknown encoder/i);

expect(driver.isLoaded()).toBe(true);
```

---

### Requirement: Configuration Support

Drivers MUST support runtime configuration updates for logging, progress tracking, and mode changes.

#### Scenario: Runtime Configuration Update

**Given** a driver instance (loaded or unloaded)

**When** `configure(config)` is called with new configuration

**Then**
- The driver MUST accept the new configuration
- Logging callbacks MUST be updated
- Progress callbacks MUST be updated
- Configuration changes MAY require reload for some settings

**Implementation Example**:
```typescript
const driver = new WasmDriver({ mode: 'single' });

let logMessages: string[] = [];
driver.configure({
  onLog: (msg) => logMessages.push(msg),
  onProgress: (progress) => console.log(progress)
});

await driver.load();
// Logs should be captured in logMessages array
expect(logMessages.length).toBeGreaterThan(0);
```

---

### Requirement: Resource Cleanup

Drivers MUST properly clean up resources (memory, files, processes) to prevent leaks and ensure reliable operation.

#### Scenario: Termination Cleanup

**Given** a driver that has executed commands

**When** `terminate()` is called

**Then**
- All temporary files MUST be deleted
- Memory allocations MUST be freed
- Background processes MUST be stopped
- The driver MUST be ready for garbage collection

**Implementation Example**:
```typescript
const driver = new SomeDriver(config);
await driver.load();

await driver.executeCommand({...});
await driver.executeCommand({...});
await driver.executeCommand({...});

const initialMemory = performance.memory?.usedJSHeapSize ?? 0;
await driver.terminate();
const finalMemory = performance.memory?.usedJSHeapSize ?? 0;

// Memory should be freed (with some tolerance)
expect(finalMemory).toBeLessThanOrEqual(initialMemory);
```

---

#### Scenario: Abort Cleanup

**Given** a driver is executing a command

**When** `abort()` is called

**Then**
- Temporary input files MUST be deleted
- Partial output files MUST be deleted
- Worker processes MUST be terminated
- The driver MUST be ready for next command

---

## MODIFIED Requirements

None. This is a new capability.

---

## REMOVED Requirements

None. This is a new capability.

---

## Non-Functional Requirements

### Performance
- Driver method calls (except `executeCommand`) MUST complete within 100ms
- Driver switching MUST complete within 2 seconds
- Resource cleanup MUST complete within 5 seconds

### Compatibility
- Interface MUST work in both browser and Tauri environments
- Drivers MUST be interchangeable without application code changes
- Interface MUST support future driver implementations (WebCodecs, Cloud, etc.)

### Type Safety
- All interface methods MUST have complete TypeScript definitions
- No use of `any` type in public API
- Generic types MUST be used for extensibility

### Testability
- Each interface method MUST be independently testable
- Mock implementations MUST be easy to create for testing
- Interface MUST support dependency injection patterns

---

## Dependencies

This specification depends on:
- **External**: TypeScript 5.x for interface definitions
- **Internal**: Existing `ExecuteCommandOptions` type from `ffmpegService.ts`

This specification is depended on by:
- **native-execution**: Native driver implementation
- **auto-detection**: Driver selection logic

---

## Implementation Notes

### WasmDriver Implementation

The `WasmDriver` serves as a wrapper around the existing `FFmpegService`:

```typescript
export class WasmDriver implements IFFmpegDriver {
  private service: FFmpegService;
  private config: DriverConfig;
  
  constructor(config: DriverConfig) {
    this.config = config;
    this.service = new FFmpegService(
      {
        mode: config.mode || 'multi',
        onLog: config.onLog,
        onProgress: config.onProgress,
        cdnProvider: config.cdnProvider,
        ffmpegVersion: config.ffmpegVersion
      },
      config.instanceId
    );
  }
  
  async load(): Promise<void> {
    return this.service.load();
  }
  
  isLoaded(): boolean {
    return this.service.isLoaded();
  }
  
  async executeCommand(options: ExecuteCommandOptions): Promise<Blob> {
    return this.service.executeCommand(options);
  }
  
  async abort(): Promise<void> {
    return this.service.abort();
  }
  
  async terminate(): Promise<void> {
    return this.service.terminate();
  }
  
  getCapabilities(): DriverCapabilities {
    return {
      maxFileSize: 500 * 1024 * 1024, // 500MB
      hardwareAcceleration: false,
      availableEncoders: [
        'libx264', 'libx265', 'libvpx', 'libvpx-vp9',
        'aac', 'libmp3lame', 'libopus', 'libvorbis'
      ],
      supportedFormats: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv']
    };
  }
  
  getType(): 'wasm' {
    return 'wasm';
  }
  
  configure(config: Partial<DriverConfig>): void {
    Object.assign(this.config, config);
    // Update service config if needed
  }
}
```

### Interface Definition

Complete TypeScript interface definition:

```typescript
export interface IFFmpegDriver {
  // Lifecycle
  load(): Promise<void>;
  isLoaded(): boolean;
  terminate(): Promise<void>;
  
  // Execution
  executeCommand(options: ExecuteCommandOptions): Promise<Blob>;
  abort(): Promise<void>;
  
  // Capabilities
  getCapabilities(): DriverCapabilities;
  getType(): DriverType;
  
  // Configuration
  configure(config: Partial<DriverConfig>): void;
}

export type DriverType = 'wasm' | 'native';

export interface DriverCapabilities {
  maxFileSize: number | 'unlimited';
  hardwareAcceleration: boolean;
  availableEncoders: string[];
  supportedFormats: string[];
}

export interface DriverConfig {
  mode?: 'single' | 'multi'; // WASM-specific
  onLog?: (message: string, instanceId?: string) => void;
  onProgress?: (progress: number, time: number) => void;
  onModeChange?: (newMode: 'single' | 'multi') => void;
  cdnProvider?: CDNProvider;
  ffmpegVersion?: string;
  instanceId?: string;
}
```

---

## Testing Requirements

### Unit Tests

Each driver implementation MUST have unit tests covering:
1. All interface methods
2. Error scenarios
3. Capability reporting
4. Configuration updates
5. Resource cleanup

### Integration Tests

Driver abstraction MUST be tested in:
1. FFmpegPool (multiple driver instances)
2. QueueProcessor (driver execution)
3. useFFmpegWeb hook (React integration)

### Acceptance Criteria

- [ ] WasmDriver passes all interface tests
- [ ] Mock driver for testing can be created easily
- [ ] Switching drivers mid-execution works correctly
- [ ] Memory leaks are detected and prevented

---

## Migration Guide

### For Existing Code Using FFmpegService

**Before** (direct FFmpegService usage):
```typescript
const service = new FFmpegService({ mode: 'multi', onLog, onProgress });
await service.load();
const result = await service.executeCommand({...});
```

**After** (using driver abstraction):
```typescript
const driver = new WasmDriver({ mode: 'multi', onLog, onProgress });
await driver.load();
const result = await driver.executeCommand({...});
```

**Or** (using driver manager):
```typescript
const manager = FFmpegDriverManager.getInstance();
await manager.initialize({ preferNative: false });
const driver = manager.getDriver();
const result = await driver.executeCommand({...});
```

---

## Open Issues

1. **Streaming Support**: Future requirement for streaming large file processing
2. **WebCodecs Integration**: Potential third driver type for browser-native encoding
3. **Progress Normalization**: Different drivers report progress differently
4. **Capability Discovery**: How to handle drivers with dynamic capabilities

---

## References

- [FFmpegService Implementation](../../app/services/ffmpegService.ts)
- [ExecuteCommandOptions Type](../../app/services/ffmpegService.ts#L23)
- [Design Patterns: Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
