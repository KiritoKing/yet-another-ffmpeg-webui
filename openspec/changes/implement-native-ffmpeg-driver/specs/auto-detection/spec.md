# Auto-Detection Specification

**Capability**: Auto-Detection  
**Version**: 1.0.0  
**Status**: Proposed  
**Related**: driver-abstraction, native-execution

---

## Overview

This specification defines how the application automatically selects the optimal FFmpeg driver based on environment, availability, and user preferences. The goal is to provide the best user experience without requiring manual configuration.

---

## ADDED Requirements

### Requirement: Environment Detection

The system MUST accurately detect the runtime environment to determine which drivers are available.

#### Scenario: Tauri Desktop Environment

**Given** the application is running in a Tauri desktop application

**When** environment detection executes

**Then**
- `__TAURI_INTERNALS__` global variable MUST be detected
- Environment type MUST be identified as 'desktop'
- Native driver MUST be considered as candidate
- WASM driver MUST still be available as fallback

**Implementation Example**:
```typescript
function detectEnvironment(): 'browser' | 'desktop' {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return 'desktop';
  }
  return 'browser';
}

// Usage
const env = detectEnvironment();
if (env === 'desktop') {
  // Native driver is an option
} else {
  // WASM driver only
}
```

---

#### Scenario: Browser Environment

**Given** the application is running in a standard web browser

**When** environment detection executes

**Then**
- `__TAURI_INTERNALS__` global variable MUST NOT be present
- Environment type MUST be identified as 'browser'
- Only WASM driver MUST be available
- Native driver selection MUST be skipped

---

### Requirement: Driver Selection Algorithm

The system MUST select the optimal driver based on a prioritized decision tree considering environment, availability, and preferences.

#### Scenario: Automatic Selection in Desktop Environment

**Given** the application is running in desktop mode

**And** user preference is "automatic" (default)

**When** driver selection executes

**Then**
- Native driver availability MUST be checked first
- If native FFmpeg is available, native driver MUST be selected
- If native FFmpeg is not available, WASM driver MUST be selected
- Selection decision MUST be logged for transparency

**Implementation Example**:
```typescript
class FFmpegDriverManager {
  async selectDriver(preference: DriverPreference): Promise<IFFmpegDriver> {
    const env = detectEnvironment();
    
    // Browser: WASM only
    if (env === 'browser') {
      this.log('Browser environment detected, using WASM driver');
      return this.createWasmDriver();
    }
    
    // Desktop: check preferences
    if (preference === 'wasm') {
      this.log('User prefers WASM driver');
      return this.createWasmDriver();
    }
    
    if (preference === 'native' || preference === 'auto') {
      try {
        // Check if native FFmpeg is available
        const available = await invoke<boolean>('ffmpeg_check_availability');
        if (available) {
          this.log('Native FFmpeg detected, using native driver');
          return this.createNativeDriver();
        } else {
          this.log('Native FFmpeg not found, falling back to WASM');
          return this.createWasmDriver();
        }
      } catch (error) {
        this.log(`Native driver check failed: ${error}, using WASM`);
        return this.createWasmDriver();
      }
    }
    
    // Default fallback
    return this.createWasmDriver();
  }
}
```

---

#### Scenario: User Prefers WASM Driver

**Given** the application is running in desktop mode

**And** user preference is explicitly set to "wasm"

**When** driver selection executes

**Then**
- Native driver availability check MUST be skipped
- WASM driver MUST be selected immediately
- Selection reason MUST be logged as "user preference"

---

#### Scenario: User Prefers Native Driver (Not Available)

**Given** the application is running in desktop mode

**And** user preference is set to "native"

**And** native FFmpeg is not installed

**When** driver selection executes

**Then**
- Native driver availability check MUST run
- Check MUST fail (FFmpeg not found)
- WASM driver MUST be selected as fallback
- User SHOULD be notified with installation instructions
- Selection reason MUST be logged as "native unavailable, fallback to WASM"

**Implementation Example**:
```typescript
async selectDriver(preference: DriverPreference): Promise<IFFmpegDriver> {
  if (preference === 'native') {
    try {
      const available = await invoke<boolean>('ffmpeg_check_availability');
      if (available) {
        return this.createNativeDriver();
      } else {
        this.notifyUser({
          type: 'warning',
          title: 'Native FFmpeg Not Found',
          message: 'Install FFmpeg to use native driver. Falling back to WASM.',
          action: {
            label: 'Installation Guide',
            onClick: () => window.open('/docs/install-ffmpeg')
          }
        });
        return this.createWasmDriver();
      }
    } catch (error) {
      this.log(`Native driver initialization failed: ${error}`);
      return this.createWasmDriver();
    }
  }
  // ... other cases
}
```

---

### Requirement: Driver Initialization

The system MUST initialize the selected driver and handle initialization failures gracefully.

#### Scenario: Successful Driver Initialization

**Given** a driver has been selected

**When** initialization is requested

**Then**
- The driver's `load()` method MUST be called
- Initialization MUST complete or fail within 30 seconds
- On success, driver MUST be marked as active
- Application state MUST be updated with driver info

**Implementation Example**:
```typescript
async initialize(preferences?: DriverPreferences): Promise<void> {
  const driver = await this.selectDriver(preferences?.prefer || 'auto');
  
  try {
    await driver.load();
    this.activeDriver = driver;
    this.updateState({
      type: driver.getType(),
      capabilities: driver.getCapabilities(),
      status: 'ready'
    });
    this.log(`Driver initialized: ${driver.getType()}`);
  } catch (error) {
    throw new Error(`Failed to initialize ${driver.getType()} driver: ${error}`);
  }
}
```

---

#### Scenario: Driver Initialization Failure with Fallback

**Given** native driver is selected

**And** native driver initialization fails

**When** initialization is attempted

**Then**
- Native driver `load()` MUST throw an error
- Error MUST be caught and logged
- WASM driver MUST be selected as fallback
- WASM driver MUST be initialized
- User MUST be notified of fallback

**Implementation Example**:
```typescript
async initialize(preferences?: DriverPreferences): Promise<void> {
  let driver = await this.selectDriver(preferences?.prefer || 'auto');
  
  try {
    await driver.load();
    this.activeDriver = driver;
  } catch (error) {
    this.log(`Driver initialization failed: ${error}`);
    
    // If native failed, try WASM
    if (driver.getType() === 'native') {
      this.log('Falling back to WASM driver');
      driver = this.createWasmDriver();
      await driver.load(); // May throw if WASM also fails
      this.activeDriver = driver;
      
      this.notifyUser({
        type: 'info',
        title: 'Using WASM Driver',
        message: 'Native driver failed to initialize. Using browser-based processing.'
      });
    } else {
      // WASM failed, no more fallbacks
      throw error;
    }
  }
}
```

---

### Requirement: Runtime Driver Switching

The system MUST support switching between drivers at runtime without reloading the application.

#### Scenario: User Switches Driver via Settings

**Given** the application is running with WASM driver active

**And** user changes preference to "native" in settings

**When** the preference change is applied

**Then**
- Current driver MUST be terminated cleanly
- New driver MUST be selected based on new preference
- New driver MUST be initialized
- Active tasks MUST NOT be interrupted (wait for completion)
- UI MUST reflect the new driver

**Implementation Example**:
```typescript
async switchDriver(newPreference: DriverPreference): Promise<void> {
  // Wait for any active executions to complete
  await this.waitForIdle();
  
  // Terminate current driver
  if (this.activeDriver) {
    await this.activeDriver.terminate();
    this.log(`Terminated ${this.activeDriver.getType()} driver`);
  }
  
  // Initialize new driver
  await this.initialize({ prefer: newPreference });
  
  this.log(`Switched to ${this.activeDriver?.getType()} driver`);
}
```

---

#### Scenario: Driver Switch During Active Execution

**Given** a task is currently executing

**And** user attempts to switch driver

**When** switch is requested

**Then**
- Switch request MUST be queued
- Current task MUST complete
- After completion, driver switch MUST proceed
- User MUST be informed about the delay

---

### Requirement: Capability-Based Feature Availability

The application MUST adjust available features based on active driver's capabilities.

#### Scenario: Feature Availability with WASM Driver

**Given** WASM driver is active

**When** user attempts to process a large file (>500MB)

**Then**
- Application MUST check `capabilities.maxFileSize`
- File size validation MUST fail
- User MUST see error: "File too large for WASM driver (max 500MB)"
- User MUST be prompted to switch to native driver (if in desktop)

**Implementation Example**:
```typescript
async validateFile(file: File): Promise<void> {
  const capabilities = this.getDriver().getCapabilities();
  
  if (capabilities.maxFileSize !== 'unlimited') {
    if (file.size > capabilities.maxFileSize) {
      throw new Error(
        `File too large (${formatBytes(file.size)}). ` +
        `Maximum size: ${formatBytes(capabilities.maxFileSize)}. ` +
        (detectEnvironment() === 'desktop' 
          ? 'Try switching to native driver for unlimited file sizes.'
          : 'This limitation is due to browser memory constraints.')
      );
    }
  }
}
```

---

#### Scenario: Hardware Acceleration Indicator

**Given** native driver is active with GPU support

**When** user views driver status

**Then**
- UI MUST display hardware acceleration badge
- Available hardware encoders MUST be listed
- Estimated performance improvement MUST be shown

---

### Requirement: Preference Persistence

User's driver preference MUST be persisted across sessions and respected on next startup.

#### Scenario: Preference Persistence

**Given** user sets driver preference to "native"

**When** application is closed and reopened

**Then**
- Saved preference MUST be loaded from storage
- Driver selection MUST use saved preference
- If preference cannot be satisfied, fallback rules MUST apply

**Implementation Example**:
```typescript
// Using Zustand persist middleware
const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      preference: 'auto',
      setPreference: (pref) => set({ preference: pref }),
    }),
    {
      name: 'driver-preferences',
      version: 1,
    }
  )
);

// On app initialization
const storedPreference = useDriverStore.getState().preference;
await driverManager.initialize({ prefer: storedPreference });
```

---

## MODIFIED Requirements

None. This is a new capability.

---

## REMOVED Requirements

None. This is a new capability.

---

## Non-Functional Requirements

### Performance
- Environment detection MUST complete in <10ms
- Driver selection MUST complete in <500ms (including availability check)
- Driver switching MUST complete in <2 seconds

### User Experience
- Driver selection MUST be transparent (no user action required)
- Fallback scenarios MUST provide clear explanations
- Settings UI MUST clearly show active driver and capabilities

### Reliability
- Fallback logic MUST always provide a working driver
- Driver initialization failures MUST NOT crash the application
- Preference persistence MUST be resilient to corruption

---

## Dependencies

This specification depends on:
- **Internal**: driver-abstraction (IFFmpegDriver), native-execution (availability check)
- **External**: Zustand for state management, localStorage for persistence

This specification is depended on by:
- **Application**: All components using FFmpeg functionality

---

## Decision Tree

```
Start
  │
  ├─ Is environment desktop?
  │   ├─ No → Use WASM driver
  │   │
  │   └─ Yes → Check user preference
  │       ├─ Preference = "wasm" → Use WASM driver
  │       │
  │       ├─ Preference = "native" → Check availability
  │       │   ├─ Available → Use native driver
  │       │   └─ Not available → Use WASM + notify user
  │       │
  │       └─ Preference = "auto" → Check availability
  │           ├─ Available → Use native driver
  │           └─ Not available → Use WASM
  │
  └─ Load selected driver
      ├─ Success → Ready to execute
      └─ Failure → Try fallback or error
```

---

## Testing Requirements

### Unit Tests
- [ ] Test environment detection (browser vs desktop)
- [ ] Test driver selection logic for all preference combinations
- [ ] Test fallback scenarios
- [ ] Test preference persistence

### Integration Tests
- [ ] Test driver switching while idle
- [ ] Test driver switching during execution
- [ ] Test initialization with various FFmpeg installations
- [ ] Test capability-based validation

### User Acceptance Tests
- [ ] User can use app without changing any settings (automatic works)
- [ ] User can manually select driver in settings
- [ ] User sees clear feedback when native driver unavailable
- [ ] Performance improvements are noticeable with native driver

---

## UI Requirements

### Settings Page - Driver Section

```typescript
<div className="driver-settings">
  <h3>FFmpeg Driver</h3>
  
  <RadioGroup value={preference} onChange={setPreference}>
    <Radio value="auto">
      Automatic (Recommended)
      <p className="help-text">
        Uses native driver when available, falls back to WASM
      </p>
    </Radio>
    
    <Radio value="native">
      Prefer Native
      <p className="help-text">
        Faster, unlimited file size, hardware acceleration
      </p>
    </Radio>
    
    <Radio value="wasm">
      Prefer WASM
      <p className="help-text">
        Works everywhere, no installation required
      </p>
    </Radio>
  </RadioGroup>
  
  <div className="driver-status">
    <Badge variant={driverType === 'native' ? 'success' : 'default'}>
      Active: {driverType.toUpperCase()}
      {hardwareAcceleration && ' + GPU'}
    </Badge>
    
    <dl>
      <dt>Max File Size:</dt>
      <dd>{maxFileSize === 'unlimited' ? 'Unlimited' : formatBytes(maxFileSize)}</dd>
      
      <dt>Hardware Acceleration:</dt>
      <dd>{hardwareAcceleration ? 'Available' : 'Not available'}</dd>
      
      <dt>Available Encoders:</dt>
      <dd>
        <Collapsible>
          {availableEncoders.join(', ')}
        </Collapsible>
      </dd>
    </dl>
  </div>
</div>
```

---

## Error Messages

### Native Driver Not Available
```
Title: Native FFmpeg Not Found
Message: The native driver requires FFmpeg to be installed on your system.
Actions:
  - [View Installation Guide]
  - [Use WASM Driver]
```

### File Too Large for Current Driver
```
Title: File Too Large
Message: The selected file (1.2 GB) exceeds the maximum size for WASM driver (500 MB).
Actions:
  - [Switch to Native Driver] (if desktop)
  - [Select Smaller File]
```

### Driver Initialization Failed
```
Title: Driver Initialization Failed
Message: Failed to initialize {driver_type} driver. Falling back to WASM.
Error: {detailed_error_message}
Actions:
  - [Retry]
  - [View Troubleshooting Guide]
```

---

## Open Issues

1. **Concurrent Driver Support**: Should we allow both drivers to be loaded simultaneously?
2. **Health Checks**: Should we periodically re-check native FFmpeg availability?
3. **Capability Changes**: How to handle when FFmpeg is installed/updated while app is running?

---

## References

- [driver-abstraction](./driver-abstraction/spec.md) - Driver interface definition
- [native-execution](./native-execution/spec.md) - Native driver implementation
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand#persist-middleware)
