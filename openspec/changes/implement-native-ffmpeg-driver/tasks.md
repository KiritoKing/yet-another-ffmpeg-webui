# Tasks: Implement Native FFmpeg Driver

**Change-ID**: `implement-native-ffmpeg-driver`  
**Depends On**: `add-tauri-desktop-support`

---

## Phase 2.1: Driver Abstraction Layer

### 1. Design Interface
- [ ] Review existing `FFmpegService` API thoroughly
- [ ] List all operations that need abstraction
- [ ] Define `IFFmpegDriver` interface with complete method signatures
- [ ] Define `DriverCapabilities` type
- [ ] Define `DriverConfig` type
- [ ] Define `ExecutionResult` type for native driver
- [ ] Review and validate interface design with team

### 2. Create Type Definitions
- [ ] Create `app/services/driver/types.ts`
  - [ ] Export `IFFmpegDriver` interface
  - [ ] Export `DriverType = 'wasm' | 'native'`
  - [ ] Export `DriverCapabilities` interface
  - [ ] Export `DriverConfig` interface
  - [ ] Export `DriverPreferences` interface
  - [ ] Add JSDoc comments for all types

### 3. Implement WasmDriver
- [ ] Create `app/services/driver/WasmDriver.ts`
  - [ ] Import existing `FFmpegService`
  - [ ] Implement `IFFmpegDriver` interface
  - [ ] Wrap all FFmpegService methods
  - [ ] Implement `getCapabilities()` with WASM-specific limits
  - [ ] Implement `getType()` returning 'wasm'
  - [ ] Add error handling and logging
  - [ ] Preserve existing behavior exactly

### 4. Create Driver Index
- [ ] Create `app/services/driver/index.ts`
  - [ ] Export all driver types
  - [ ] Export WasmDriver class
  - [ ] Export interfaces
  - [ ] Add module documentation

### 5. Unit Tests for Abstraction
- [ ] Create `app/services/driver/__tests__/WasmDriver.test.ts`
  - [ ] Test load() functionality
  - [ ] Test executeCommand() delegation
  - [ ] Test abort() behavior
  - [ ] Test getCapabilities() returns correct values
  - [ ] Test error handling
- [ ] Ensure all tests pass
- [ ] Achieve ≥80% coverage for driver code

### 6. Documentation
- [ ] Document `IFFmpegDriver` interface in API.md
- [ ] Add driver architecture diagram
- [ ] Document migration path from FFmpegService

---

## Phase 2.2: Native Driver Implementation

### 7. Rust FFmpeg Detection
- [ ] Create `src-tauri/src/ffmpeg/mod.rs` module structure
- [ ] Create `src-tauri/src/ffmpeg/detection.rs`
  - [ ] Implement `check_ffmpeg_availability()`
  - [ ] Query FFmpeg version
  - [ ] Detect available encoders
  - [ ] Detect hardware acceleration support
  - [ ] Cache detection results
- [ ] Add tests for detection logic

### 8. Rust File Operations
- [ ] Create `src-tauri/src/ffmpeg/workspace.rs`
  - [ ] Implement `create_temp_workspace()`
  - [ ] Implement `write_file(workspace, name, data)`
  - [ ] Implement `read_file(workspace, name)`
  - [ ] Implement `cleanup_workspace(path)`
  - [ ] Add proper error handling
  - [ ] Add file permissions handling

### 9. Rust FFmpeg Execution
- [ ] Create `src-tauri/src/ffmpeg/executor.rs`
  - [ ] Implement `execute_ffmpeg(work_dir, args)`
  - [ ] Capture stdout and stderr
  - [ ] Stream stderr for progress parsing
  - [ ] Handle process lifecycle (start, wait, kill)
  - [ ] Return execution result
  - [ ] Handle errors gracefully

### 10. Progress Parsing
- [ ] Create `src-tauri/src/ffmpeg/progress.rs`
  - [ ] Parse FFmpeg stderr output
  - [ ] Extract time, speed, bitrate
  - [ ] Calculate percentage progress
  - [ ] Handle various FFmpeg output formats
  - [ ] Test with multiple FFmpeg versions (4.4, 5.x, 6.x)

### 11. Tauri Commands Registration
- [ ] Update `src-tauri/src/lib.rs`
  - [ ] Register `ffmpeg_check_availability`
  - [ ] Register `ffmpeg_create_temp_workspace`
  - [ ] Register `ffmpeg_write_file`
  - [ ] Register `ffmpeg_read_file`
  - [ ] Register `ffmpeg_execute`
  - [ ] Register `ffmpeg_cleanup_workspace`
  - [ ] Register `ffmpeg_get_capabilities`

### 12. Rust Dependencies
- [ ] Update `src-tauri/Cargo.toml`
  - [ ] Add `uuid = "1.6"` with `v4` feature
  - [ ] Add `regex = "1.10"`
  - [ ] Add `serde_json = "1.0"`
  - [ ] Run `cargo check` to verify

### 13. Rust Error Types
- [ ] Create `src-tauri/src/ffmpeg/error.rs`
  - [ ] Define `FFmpegError` enum
  - [ ] Implement conversion to String
  - [ ] Add user-friendly error messages
  - [ ] Handle platform-specific errors

---

## Phase 2.3: Native Driver Integration

### 14. Implement NativeDriver Class
- [ ] Create `app/services/driver/NativeDriver.ts`
  - [ ] Implement `load()` - check availability via Tauri
  - [ ] Implement `isLoaded()`
  - [ ] Implement `executeCommand()`
    - [ ] Create temp workspace
    - [ ] Write all input files
    - [ ] Execute FFmpeg command
    - [ ] Read output file
    - [ ] Cleanup workspace
    - [ ] Convert result to Blob
  - [ ] Implement `abort()` - kill FFmpeg process
  - [ ] Implement `terminate()` - cleanup resources
  - [ ] Implement `getCapabilities()` - query from Rust
  - [ ] Implement `getType()` - return 'native'
  - [ ] Add progress callback support
  - [ ] Add comprehensive error handling

### 15. Driver Manager
- [ ] Create `app/services/driver/FFmpegDriverManager.ts`
  - [ ] Implement singleton pattern
  - [ ] Implement `initialize(preferences?)`
  - [ ] Implement `selectDriver(preferences)` logic
    - [ ] Check Tauri environment
    - [ ] Respect user preferences
    - [ ] Try native driver, fallback to WASM
    - [ ] Log selection decision
  - [ ] Implement `getDriver()`
  - [ ] Implement `switchDriver(type)` for manual switching
  - [ ] Add driver change events

### 16. React Hook for Driver
- [ ] Create `app/hooks/useFFmpegDriver.ts`
  - [ ] Wrap driver manager in React context
  - [ ] Provide `driver` instance
  - [ ] Provide `driverType` state
  - [ ] Provide `capabilities` state
  - [ ] Provide `switchDriver` function
  - [ ] Handle initialization lifecycle

### 17. Update Existing Services
- [ ] Update `app/hooks/useFFmpegWeb.ts`
  - [ ] Replace `FFmpegService` with driver manager
  - [ ] Update all service calls to use driver interface
  - [ ] Maintain existing behavior
  - [ ] Test thoroughly
- [ ] Update `app/services/ffmpegPool.ts`
  - [ ] Accept `IFFmpegDriver` instances
  - [ ] Update pool acquisition logic
  - [ ] Support both driver types
- [ ] Update `app/services/queueProcessor.ts`
  - [ ] Work with `IFFmpegDriver` interface
  - [ ] No driver-specific logic

### 18. Driver Preferences State
- [ ] Create `app/store/driver/types.ts`
  - [ ] Define `DriverPreference` type
  - [ ] Define `DriverState` interface
- [ ] Create `app/store/driver/index.ts`
  - [ ] Implement Zustand store
  - [ ] Add `preference` state ('auto' | 'wasm' | 'native')
  - [ ] Add `setPreference` action
  - [ ] Add persistence with Zustand middleware

---

## Phase 2.4: UI and User Experience

### 19. Driver Selector Component
- [ ] Create `app/components/DriverSelector.tsx`
  - [ ] Radio group for driver selection
  - [ ] "Automatic" (default)
  - [ ] "Prefer WASM"
  - [ ] "Prefer Native"
  - [ ] Display current active driver
  - [ ] Display driver capabilities
  - [ ] Show hardware acceleration status
  - [ ] Use shadcn/ui components

### 20. Settings Integration
- [ ] Update `app/routes/settings.tsx`
  - [ ] Add "FFmpeg Driver" section
  - [ ] Integrate `DriverSelector` component
  - [ ] Display driver information
    - [ ] Active driver type
    - [ ] Max file size
    - [ ] Hardware acceleration status
    - [ ] Available encoders (expandable list)
  - [ ] Add "Test Native Driver" button
  - [ ] Show performance comparison stats (optional)

### 21. Visual Feedback
- [ ] Add driver badge to main interface
  - [ ] Show "WASM" or "Native" or "Native + GPU"
  - [ ] Tooltip with capabilities
  - [ ] Color coding (blue=WASM, green=Native, purple=GPU)
- [ ] Update progress indicators
  - [ ] Show "estimated" for WASM
  - [ ] Show "accurate" for Native (when progress parsing works)

---

## Phase 2.5: Testing and Validation

### 22. Unit Tests
- [ ] Test `NativeDriver` class
  - [ ] Mock Tauri invoke calls
  - [ ] Test all interface methods
  - [ ] Test error scenarios
  - [ ] Test progress callbacks
- [ ] Test `FFmpegDriverManager`
  - [ ] Test driver selection logic
  - [ ] Test fallback behavior
  - [ ] Test preference handling
- [ ] Test `useFFmpegDriver` hook
  - [ ] Test React lifecycle
  - [ ] Test state updates

### 23. Integration Tests
- [ ] Test driver switching
  - [ ] Switch from WASM to Native
  - [ ] Switch from Native to WASM
  - [ ] Verify state consistency
- [ ] Test queue processing with both drivers
  - [ ] Identical results from both drivers
  - [ ] Progress updates work correctly
  - [ ] Error handling consistent
- [ ] Test file handling
  - [ ] Various file sizes (small, medium, large)
  - [ ] Different formats (mp4, mkv, webm)
  - [ ] Special characters in filenames

### 24. Platform Testing
- [ ] Test on macOS
  - [ ] With FFmpeg installed (Homebrew)
  - [ ] Without FFmpeg (fallback)
  - [ ] VideoToolbox acceleration (M1+)
- [ ] Test on Windows
  - [ ] With FFmpeg in PATH
  - [ ] Without FFmpeg (fallback)
  - [ ] NVENC acceleration (if available)
- [ ] Test on Linux
  - [ ] With FFmpeg (apt/dnf)
  - [ ] Without FFmpeg (fallback)
  - [ ] VAAPI acceleration (if available)

### 25. Performance Benchmarking
- [ ] Create benchmark suite
  - [ ] Standard test clips (1080p, 4K)
  - [ ] Various codecs (H.264, H.265, VP9)
  - [ ] Different presets (ultrafast, medium, slow)
- [ ] Measure encoding times
  - [ ] WASM single-thread
  - [ ] WASM multi-thread
  - [ ] Native CPU-only
  - [ ] Native with hardware acceleration
- [ ] Document performance results
  - [ ] Create comparison tables
  - [ ] Add to documentation

### 26. Error Scenario Testing
- [ ] Test FFmpeg not found
- [ ] Test FFmpeg execution errors
- [ ] Test out of disk space
- [ ] Test file permission errors
- [ ] Test abort during native execution
- [ ] Test driver fallback scenarios
- [ ] Verify error messages are user-friendly

---

## Phase 2.6: Documentation and Polish

### 27. API Documentation
- [ ] Update `docs/dev-guide/API.md`
  - [ ] Document `IFFmpegDriver` interface
  - [ ] Document all driver methods
  - [ ] Document driver selection algorithm
  - [ ] Add code examples
  - [ ] Add migration guide

### 28. User Documentation
- [ ] Create `docs/user-guide/NATIVE_DRIVER.md`
  - [ ] Explain native vs WASM
  - [ ] List benefits of native driver
  - [ ] Installation instructions for FFmpeg
    - [ ] macOS (Homebrew)
    - [ ] Windows (Chocolatey / manual)
    - [ ] Linux (apt / dnf / pacman)
  - [ ] Hardware acceleration guide
  - [ ] Troubleshooting section

### 29. Architecture Documentation
- [ ] Update `docs/dev-guide/ARCHITECTURE.md`
  - [ ] Add driver abstraction layer diagram
  - [ ] Explain driver selection process
  - [ ] Document Rust↔JavaScript communication
  - [ ] Add sequence diagrams for execution flow

### 30. Developer Guide
- [ ] Create `docs/dev-guide/DRIVER_DEVELOPMENT.md`
  - [ ] How to add new driver implementations
  - [ ] Testing guidelines
  - [ ] Debugging tips
  - [ ] Common pitfalls

### 31. Changelog
- [ ] Create `docs/changelog/CHANGELOG_NATIVE_DRIVER.md`
  - [ ] Document all changes
  - [ ] Performance improvements
  - [ ] Breaking changes (none expected)
  - [ ] Migration instructions

### 32. Update Root Documentation
- [ ] Update `AGENTS.md` changelog
- [ ] Update `README.md` with native driver info
- [ ] Update `docs/changelog/README.md` index

---

## Phase 2.7: Code Quality and Review

### 33. Type Safety
- [ ] Run `pnpm typecheck`
- [ ] Fix all TypeScript errors
- [ ] Add missing type definitions
- [ ] Review `any` usage (should be minimal)

### 34. Code Quality
- [ ] Run `pnpm lint`
- [ ] Fix all Biome diagnostics
- [ ] Apply consistent formatting
- [ ] Remove unused imports

### 35. Rust Code Quality
- [ ] Run `cargo clippy`
- [ ] Fix all clippy warnings
- [ ] Run `cargo fmt`
- [ ] Add Rust documentation comments

### 36. Code Review
- [ ] Self-review all changes
- [ ] Check for code duplication
- [ ] Verify error handling
- [ ] Validate logging statements
- [ ] Ensure file size limits (<500 lines per file)

---

## Phase 2.8: OpenSpec Compliance

### 37. Spec Deltas
- [ ] Create `specs/driver-abstraction/spec.md`
- [ ] Create `specs/native-execution/spec.md`
- [ ] Create `specs/auto-detection/spec.md`
- [ ] Define all requirements with scenarios
- [ ] Cross-reference related capabilities

### 38. Validation
- [ ] Run `openspec validate implement-native-ffmpeg-driver --strict`
- [ ] Fix all validation errors
- [ ] Ensure all scenarios are testable
- [ ] Verify requirement traceability

### 39. Final Review
- [ ] Review proposal.md for completeness
- [ ] Review tasks.md for accuracy
- [ ] Update progress percentages
- [ ] Get stakeholder approval

---

## Summary

**Total Tasks**: 39 task groups  
**Estimated Effort**: 4-5 weeks  
**Dependencies**: `add-tauri-desktop-support` must be complete

**Critical Path**:
1. Driver abstraction → WasmDriver → Testing (Phase 2.1)
2. Rust implementation → NativeDriver (Phase 2.2-2.3)
3. Integration → Testing → Documentation (Phase 2.4-2.6)

**Success Criteria**:
- [ ] All tests passing
- [ ] ≥3x performance improvement with native driver
- [ ] Zero breaking changes for web deployment
- [ ] OpenSpec validation passes
- [ ] Documentation complete

---

## Notes

### Implementation Order Rationale
- Start with abstraction (Phase 2.1) to establish interfaces
- Build Rust backend (Phase 2.2) independently
- Integrate once both pieces are stable (Phase 2.3)
- Polish and document thoroughly (Phase 2.4-2.6)

### Parallel Work Opportunities
- Rust implementation (Phase 2.2) can start once interface is defined
- UI components (Phase 2.4) can be developed alongside Rust work
- Documentation (Phase 2.6) can be written as features complete

### Risk Mitigation
- Early WasmDriver implementation validates abstraction
- Extensive testing before integration
- Fallback to WASM on any issues
- Platform-specific testing on all OSes
