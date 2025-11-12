# Proposal: Implement Native FFmpeg Driver

**Change-ID**: `implement-native-ffmpeg-driver`  
**Status**: Proposed  
**Created**: 2025-01-13  
**Depends On**: `add-tauri-desktop-support`  
**Author**: AI Agent with chlorinec

---

## Why: Problem and Motivation

### Current Limitations of WASM-Only Approach

The application currently relies exclusively on FFmpeg.wasm for video processing, which introduces fundamental performance and capability constraints:

1. **Performance Bottleneck** (~3-10x slower than native):
   - WebAssembly execution overhead compared to native binaries
   - No SIMD optimizations in many browsers
   - Memory bandwidth limitations
   - Slower file I/O through virtual filesystem

2. **Memory Constraints**:
   - Practical ~2GB limit in browsers
   - Cannot process large video files (>500MB recommended limit)
   - Frequent out-of-memory errors with high-resolution content
   - No streaming processing capability

3. **Missing Hardware Acceleration**:
   - No GPU-accelerated encoding (NVENC, QuickSync, VideoToolbox, AMF)
   - No specialized media hardware support
   - CPU-only encoding significantly slower (5-20x for H.264/H.265)

4. **Limited Codec Support**:
   - Restricted to codecs compiled into WASM build
   - Cannot leverage system-installed codec libraries
   - No access to proprietary codecs available natively

5. **Network Dependency**:
   - Requires CDN access to download WASM cores (~30-40MB)
   - First-load delay waiting for download
   - Offline usage limited

### Opportunity with Desktop Integration

With Phase 1 (Tauri integration) complete, we can now:

- Execute system-installed FFmpeg binaries at native speeds
- Access hardware-accelerated encoding capabilities  
- Process files of any size without browser memory limits
- Leverage full system resources (CPU cores, GPU)
- Work offline with pre-installed FFmpeg
- Maintain WASM fallback for browser deployment

### User Impact

**Current State** (WASM only):
- 4K video H.264 encoding: ~10-15 minutes for 1-minute clip
- Memory errors on files >500MB
- CPU-only processing, fans spin up constantly

**Future State** (Native driver):
- Same 4K encoding: ~1-2 minutes with NVENC/QuickSync
- Files up to tens of GB supported
- GPU acceleration, lower CPU usage and heat

---

## What: Proposed Solution

### High-Level Approach

Create a **driver abstraction layer** that allows the application to seamlessly use either WASM-based or native FFmpeg execution, selected automatically based on environment and availability.

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Components, Hooks, Store)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      FFmpegDriverManager                │
│  - Auto-detection                       │
│  - Driver selection                     │
│  - Fallback logic                       │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌─────▼──────┐
│ WasmDriver │   │NativeDriver│
│ (Browser)  │   │ (Desktop)  │
└──────┬─────┘   └─────┬──────┘
       │                │
   ┌───▼────┐      ┌────▼────┐
   │FFmpeg  │      │ Tauri   │
   │.wasm   │      │ Command │
   └────────┘      └─────┬───┘
                         │
                    ┌────▼────┐
                    │ Rust    │
                    │ FFmpeg  │
                    │ Wrapper │
                    └─────────┘
```

### Core Components

#### 1. Driver Interface (`IFFmpegDriver`)

Define a common interface that both WASM and native implementations adhere to:

```typescript
interface IFFmpegDriver {
  // Lifecycle
  load(): Promise<void>;
  isLoaded(): boolean;
  terminate(): Promise<void>;
  
  // Execution
  executeCommand(options: ExecuteCommandOptions): Promise<Blob>;
  abort(): Promise<void>;
  
  // Capabilities
  getCapabilities(): DriverCapabilities;
  getType(): 'wasm' | 'native';
  
  // Configuration
  configure(config: DriverConfig): void;
}

interface DriverCapabilities {
  maxFileSize: number | 'unlimited';
  hardwareAcceleration: boolean;
  availableEncoders: string[];
  supportedFormats: string[];
}
```

#### 2. WasmDriver (Wrapper)

Wraps the existing `FFmpegService` to conform to `IFFmpegDriver`:

```typescript
class WasmDriver implements IFFmpegDriver {
  private service: FFmpegService;
  
  constructor(config: FFmpegConfig) {
    this.service = new FFmpegService(config);
  }
  
  async load(): Promise<void> {
    return this.service.load();
  }
  
  async executeCommand(options: ExecuteCommandOptions): Promise<Blob> {
    return this.service.executeCommand(options);
  }
  
  getCapabilities(): DriverCapabilities {
    return {
      maxFileSize: 500 * 1024 * 1024, // 500MB
      hardwareAcceleration: false,
      availableEncoders: ['libx264', 'libx265', 'libvpx', ...],
      supportedFormats: ['mp4', 'webm', 'mkv', ...]
    };
  }
  
  getType(): 'wasm' {
    return 'wasm';
  }
}
```

#### 3. NativeDriver (Tauri Integration)

Executes FFmpeg through Rust backend via Tauri commands:

```typescript
class NativeDriver implements IFFmpegDriver {
  private config: DriverConfig;
  private executing = false;
  
  async load(): Promise<void> {
    // Check if FFmpeg is available on system
    const available = await invoke<boolean>('ffmpeg_check_availability');
    if (!available) {
      throw new Error('Native FFmpeg not found');
    }
  }
  
  async executeCommand(options: ExecuteCommandOptions): Promise<Blob> {
    // 1. Write input files to temp directory via Tauri
    const tempDir = await invoke<string>('ffmpeg_create_temp_workspace');
    
    for (const {file, name} of options.inputFiles) {
      const arrayBuffer = await file.arrayBuffer();
      await invoke('ffmpeg_write_file', {
        path: `${tempDir}/${name}`,
        data: Array.from(new Uint8Array(arrayBuffer))
      });
    }
    
    // 2. Execute FFmpeg command via Rust
    const result = await invoke<ExecutionResult>('ffmpeg_execute', {
      workDir: tempDir,
      args: options.ffmpegArgs,
      onProgress: (progress) => options.onProgress?.(progress, 0)
    });
    
    // 3. Read output file
    const outputData = await invoke<number[]>('ffmpeg_read_file', {
      path: `${tempDir}/${options.outputFileName}`
    });
    
    // 4. Cleanup temp directory
    await invoke('ffmpeg_cleanup_workspace', { path: tempDir });
    
    // 5. Convert to Blob
    return new Blob([new Uint8Array(outputData)]);
  }
  
  getCapabilities(): DriverCapabilities {
    return {
      maxFileSize: 'unlimited',
      hardwareAcceleration: true, // Detected via probe
      availableEncoders: [...], // Queried from FFmpeg
      supportedFormats: [...] // Queried from FFmpeg
    };
  }
  
  getType(): 'native' {
    return 'native';
  }
}
```

#### 4. Driver Manager (Auto-Selection)

Manages driver instantiation and automatic selection:

```typescript
class FFmpegDriverManager {
  private static instance: FFmpegDriverManager;
  private driver: IFFmpegDriver | null = null;
  
  static getInstance(): FFmpegDriverManager {
    if (!this.instance) {
      this.instance = new FFmpegDriverManager();
    }
    return this.instance;
  }
  
  async initialize(preferences?: DriverPreferences): Promise<void> {
    // Auto-detect best available driver
    const driver = await this.selectDriver(preferences);
    await driver.load();
    this.driver = driver;
  }
  
  private async selectDriver(prefs?: DriverPreferences): Promise<IFFmpegDriver> {
    // 1. Check if in Tauri environment
    const isTauri = "__TAURI_INTERNALS__" in window;
    
    // 2. If native preferred and available, use native
    if (prefs?.preferNative && isTauri) {
      try {
        const native = new NativeDriver();
        await native.load(); // Test availability
        return native;
      } catch {
        // Fall through to WASM
      }
    }
    
    // 3. Default to WASM
    return new WasmDriver({ mode: 'multi', ... });
  }
  
  getDriver(): IFFmpegDriver {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }
    return this.driver;
  }
}
```

#### 5. Rust Backend (Tauri Commands)

Implement FFmpeg execution in Rust:

```rust
// src-tauri/src/ffmpeg_native.rs

use std::process::{Command, Stdio};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[tauri::command]
pub fn ffmpeg_check_availability() -> bool {
    Command::new("ffmpeg")
        .arg("-version")
        .output()
        .is_ok()
}

#[tauri::command]
pub fn ffmpeg_create_temp_workspace() -> Result<String, String> {
    let temp_dir = std::env::temp_dir()
        .join(format!("ffmpeg_easy_{}", uuid::Uuid::new_v4()));
    
    fs::create_dir_all(&temp_dir)
        .map_err(|e| e.to_string())?;
    
    Ok(temp_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn ffmpeg_write_file(path: String, data: Vec<u8>) -> Result<(), String> {
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ffmpeg_execute(
    work_dir: String,
    args: Vec<String>,
    app: AppHandle,
) -> Result<ExecutionResult, String> {
    let mut child = Command::new("ffmpeg")
        .args(&args)
        .current_dir(&work_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;
    
    // TODO: Parse stderr for progress updates
    // TODO: Emit progress events to frontend
    
    let output = child.wait_with_output()
        .map_err(|e| e.to_string())?;
    
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    
    Ok(ExecutionResult {
        exit_code: 0,
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
pub fn ffmpeg_read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ffmpeg_cleanup_workspace(path: String) -> Result<(), String> {
    fs::remove_dir_all(&path).map_err(|e| e.to_string())
}
```

### Migration Strategy

#### Phase 2.1: Abstraction Layer (Non-Breaking)

1. Define `IFFmpegDriver` interface
2. Implement `WasmDriver` wrapper around existing `FFmpegService`
3. No changes to application code yet
4. Add unit tests for driver interface

#### Phase 2.2: Native Driver Implementation

1. Implement Rust FFmpeg commands in Tauri backend
2. Implement `NativeDriver` class
3. Add capability detection
4. Test native execution in isolation

#### Phase 2.3: Integration and Auto-Selection

1. Implement `FFmpegDriverManager`
2. Update `useFFmpegWeb` hook to use driver manager
3. Update `FFmpegPool` to work with driver abstraction
4. Add user preference UI (Settings page)
5. Comprehensive testing

#### Phase 2.4: Optimization and Polish

1. Progress parsing for native driver
2. Error message normalization
3. Performance benchmarking
4. Documentation

---

## Impact: Affected Areas

### Code Changes

**New Files** (~15 files, ~1,500 LOC):

1. **Driver Abstraction** (~300 LOC):
   - `app/services/driver/IFFmpegDriver.ts` - Interface definition
   - `app/services/driver/types.ts` - Shared types
   - `app/services/driver/WasmDriver.ts` - WASM implementation
   - `app/services/driver/NativeDriver.ts` - Native implementation
   - `app/services/driver/FFmpegDriverManager.ts` - Selection logic
   - `app/services/driver/index.ts` - Exports

2. **Rust Backend** (~800 LOC):
   - `src-tauri/src/ffmpeg_native.rs` - FFmpeg command execution
   - `src-tauri/src/ffmpeg_types.rs` - Shared types
   - `src-tauri/src/ffmpeg_progress.rs` - Progress parsing
   - `src-tauri/src/ffmpeg_detection.rs` - Capability detection

3. **Integration** (~200 LOC):
   - `app/hooks/useFFmpegDriver.ts` - React hook for driver
   - `app/components/DriverSelector.tsx` - UI for driver selection
   - `app/store/driver/` - Driver preferences state

4. **Testing** (~200 LOC):
   - `app/services/driver/__tests__/` - Unit tests
   - Integration tests for both drivers

**Modified Files** (~8 files, ~300 LOC changed):
- `app/hooks/useFFmpegWeb.ts` - Use driver manager
- `app/services/ffmpegPool.ts` - Support driver abstraction
- `app/services/queueProcessor.ts` - Work with IFFmpegDriver
- `app/routes/settings.tsx` - Add driver preferences UI
- `src-tauri/src/lib.rs` - Register new commands
- `src-tauri/Cargo.toml` - Add dependencies (uuid, regex)

**No Changes**:
- Component library (except new DriverSelector)
- Utility functions
- Store modules (except new driver store)
- Command presets
- Task system logic

### Dependencies

**New Rust Dependencies**:
- `uuid = "1.6"` - Temp directory naming
- `regex = "1.10"` - Progress parsing
- `serde_json = "1.0"` - JSON serialization

**No New JavaScript Dependencies**: All functionality uses existing tools.

### Performance Impact

**Expected Improvements** (Native vs. WASM):
- H.264 encoding: **3-5x faster** (CPU-only)
- H.264 encoding: **10-20x faster** (with NVENC/QuickSync)
- H.265 encoding: **5-10x faster** (CPU-only)
- H.265 encoding: **15-30x faster** (with hardware)
- File size limits: **500MB → unlimited**
- Memory usage: **Browser limit → system memory**

**Benchmarking Plan**:
1. Test suite with standard clips (1080p, 4K)
2. Measure encoding time for various codecs
3. Compare CPU usage and thermal impact
4. Memory consumption tracking

### User Experience

**Transparent by Default**:
- Application automatically selects best available driver
- No user action required for basic usage
- Existing workflows unchanged

**Advanced Control** (Settings):
- Driver preference selector:
  - "Automatic" (default - use native if available)
  - "Prefer WASM" (browser compatibility)
  - "Prefer Native" (desktop performance)
- Display active driver info (type, capabilities)
- Hardware acceleration status indicator

**Visual Feedback**:
- Badge/icon showing active driver ("WASM" / "Native" / "Native + GPU")
- Performance comparison statistics (optional)
- Estimated time remaining improvements

### Breaking Changes

**None**. This is a backward-compatible addition:
- WASM driver preserves all existing functionality
- Web deployment unaffected
- Desktop app works with or without system FFmpeg

### Migration Path

**For Developers**:
1. Review updated service layer documentation
2. Update code using `FFmpegService` directly (if any)
3. Test with both drivers

**For Users**:
- Web users: No changes
- Desktop users: Automatic upgrade to native when FFmpeg detected
- No configuration required

---

## Alternatives Considered

### 1. Keep WASM-Only

**Pros**: Simplest, no additional code  
**Cons**: Performance forever limited, no hardware acceleration  
**Decision**: Rejected - leaves desktop advantage unutilized

### 2. Native-Only on Desktop

**Pros**: Simpler implementation, no abstraction needed  
**Cons**: Breaks web deployment, requires FFmpeg installation  
**Decision**: Rejected - web deployment is critical

### 3. Separate Applications

**Pros**: No abstraction complexity  
**Cons**: Code duplication, maintenance burden, user confusion  
**Decision**: Rejected - unified experience is core value

### 4. WebCodecs API

**Pros**: Browser-native, hardware access in some browsers  
**Cons**: Limited browser support, restricted API compared to FFmpeg  
**Decision**: Complementary future option, not replacement

---

## Open Questions

### 1. FFmpeg Installation Strategy

**Question**: Should desktop app bundle FFmpeg or require system installation?

**Options**:
- A) Require user installation (smaller download, updates separate)
- B) Bundle static binary (larger app, guaranteed availability)
- C) Hybrid (check system, offer download if missing)

**Recommendation**: Start with A, implement B/C in Phase 3 if needed

### 2. Hardware Acceleration Detection

**Question**: How to reliably detect GPU capabilities?

**Approach**:
- Query FFmpeg encoders (`ffmpeg -encoders`)
- Test hardware encoders on startup
- Cache detection results
- Graceful fallback on errors

### 3. Progress Parsing

**Question**: Can we accurately parse FFmpeg stderr for progress?

**Challenges**:
- Inconsistent format across versions
- Regex complexity
- Performance of parsing

**Solution**: Implement regex-based parser with fallback to percentage estimation

### 4. Error Handling Differences

**Question**: How to normalize errors between WASM and native?

**Approach**:
- Define common error taxonomy
- Parse FFmpeg native errors
- Map to existing error types
- Maintain error context

### 5. File Size Handling

**Question**: How to handle large files in NativeDriver?

**Approach**:
- Stream files to disk (no browser memory limits)
- Use Tauri file system APIs
- Progress updates during file I/O
- Cleanup temp files reliably

---

## Dependencies and Prerequisites

### System Requirements (Native Driver)

**For Development**:
- Rust toolchain (already required from Phase 1)
- FFmpeg installed on system (`brew install ffmpeg` / `apt install ffmpeg`)

**For Users (Desktop)**:
- FFmpeg 4.4+ installed and in PATH
- OR: Bundled FFmpeg binary (future)

**For Users (Web)**:
- No changes from current requirements

### Optional Hardware

**GPU Acceleration** (detected automatically):
- NVIDIA GPU with NVENC (GeForce GTX 600+, RTX series)
- Intel CPU with QuickSync (6th gen+)
- AMD GPU with AMF (GCN 4+, RDNA)
- Apple Silicon with VideoToolbox (M1+)

---

## Timeline and Milestones

### Phase 2.1: Abstraction Layer (Week 1)
- ✅ Design `IFFmpegDriver` interface
- ✅ Implement `WasmDriver` wrapper
- ✅ Unit tests for abstraction
- ✅ Code review and refinement

### Phase 2.2: Native Implementation (Week 2-3)
- Implement Rust FFmpeg commands
- File I/O through Tauri
- Error handling and logging
- Progress parsing
- Unit tests

### Phase 2.3: Integration (Week 4)
- Implement `NativeDriver`
- Driver manager and auto-selection
- Update hooks and pools
- UI for driver preferences
- Integration testing

### Phase 2.4: Polish and Documentation (Week 5)
- Performance benchmarking
- Error message improvements
- User documentation
- Developer guide
- Migration examples

**Total Estimated Effort**: 4-5 weeks for complete implementation

---

## Success Metrics

### Technical Metrics
1. **Performance**: Native driver ≥3x faster than WASM (H.264, 1080p)
2. **Reliability**: Driver selection success rate ≥99%
3. **Compatibility**: WASM fallback works in 100% of scenarios
4. **Test Coverage**: ≥80% for driver layer

### User Metrics
1. **Adoption**: ≥60% of desktop users use native driver within 1 month
2. **Errors**: <5% increase in reported errors from driver switching
3. **Satisfaction**: Positive feedback on performance improvements

### Code Quality
1. **Type Safety**: Zero TypeScript errors
2. **Linting**: Zero critical Biome diagnostics
3. **Documentation**: All public APIs documented
4. **Tests**: All drivers pass identical test suite

---

## Risks and Mitigation

### Risk 1: FFmpeg Not Installed (Desktop Users)

**Probability**: Medium (50% of users)  
**Impact**: High (native driver unavailable)  
**Mitigation**:
- Graceful fallback to WASM
- Clear messaging to user
- Documentation on FFmpeg installation
- Future: Bundled FFmpeg option

### Risk 2: Progress Parsing Failures

**Probability**: Medium (varies by FFmpeg version)  
**Impact**: Low (progress bar inaccurate)  
**Mitigation**:
- Robust regex patterns
- Fallback to estimation
- Extensive testing with versions
- Log warnings, don't fail

### Risk 3: Platform-Specific Issues

**Probability**: High (Windows/macOS/Linux differences)  
**Impact**: Medium (native driver fails)  
**Mitigation**:
- Test on all three platforms
- Platform-specific error handling
- Automatic WASM fallback
- Community testing program

### Risk 4: Increased Complexity

**Probability**: High (abstraction layer adds code)  
**Impact**: Medium (maintenance burden)  
**Mitigation**:
- Comprehensive unit tests
- Clear documentation
- Interface-driven design
- Regular refactoring

---

## References

### Technical References
- [FFmpeg Command Line Documentation](https://ffmpeg.org/ffmpeg.html)
- [Tauri File System API](https://tauri.app/v2/reference/javascript/fs/)
- [Hardware Acceleration Guide](https://trac.ffmpeg.org/wiki/HWAccelIntro)

### Related Proposals
- [add-tauri-desktop-support](../add-tauri-desktop-support/) - Phase 1 foundation

### Future Work
- Phase 3: Hardware acceleration optimization
- Phase 4: Bundled FFmpeg binary
- Phase 5: Streaming processing for large files

---

**Status**: Proposed, awaiting review  
**Next Step**: Validate proposal structure and gather feedback on approach
