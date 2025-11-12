# Implement Native FFmpeg Driver

**Change-ID**: `implement-native-ffmpeg-driver`  
**Status**: ✅ Proposed (Awaiting Approval)  
**Validation**: ✅ Passed `openspec validate --strict`  
**Depends On**: `add-tauri-desktop-support` (Phase 1)

---

## Quick Summary

This proposal implements a **driver abstraction layer** enabling FFmpeg Easy to seamlessly use either WASM-based or native FFmpeg execution, selected automatically based on environment and availability. This unlocks native performance, hardware acceleration, and unlimited file sizes on desktop while maintaining full browser compatibility.

### What This Enables
- ✅ **Native Performance**: 3-10x faster encoding with system FFmpeg
- ✅ **Hardware Acceleration**: GPU encoding (NVENC, QuickSync, VideoToolbox, AMF)
- ✅ **Unlimited Files**: Process videos of any size on desktop
- ✅ **Automatic Selection**: Works transparently without user configuration
- ✅ **Full Compatibility**: Zero impact on web deployment

### What This Changes
- ✅ **Adds**: `IFFmpegDriver` interface and driver abstraction layer
- ✅ **Adds**: `WasmDriver` (wraps existing FFmpegService)
- ✅ **Adds**: `NativeDriver` (Rust-based native execution)
- ✅ **Adds**: `FFmpegDriverManager` (auto-selection and switching)
- ✅ **Adds**: User preference UI for manual driver selection
- ⚠️ **Non-Breaking**: All existing code continues to work

---

## Architecture Overview

```
Application Layer
       ↓
FFmpegDriverManager (Selection + Auto-detection)
       ↓
IFFmpegDriver Interface
    ↙        ↘
WasmDriver   NativeDriver
    ↓             ↓
FFmpeg.wasm   Tauri Commands
                  ↓
              Rust FFmpeg Wrapper
                  ↓
              System FFmpeg
```

---

## Capabilities

### 1. Driver Abstraction ([spec](./specs/driver-abstraction/spec.md))
- Unified `IFFmpegDriver` interface for all implementations
- Lifecycle management (load, execute, abort, terminate)
- Capability reporting (max file size, hardware acceleration, encoders)
- Configuration and error handling

**Key Interface**:
```typescript
interface IFFmpegDriver {
  load(): Promise<void>;
  executeCommand(options: ExecuteCommandOptions): Promise<Blob>;
  abort(): Promise<void>;
  terminate(): Promise<void>;
  getCapabilities(): DriverCapabilities;
  getType(): 'wasm' | 'native';
}
```

### 2. Native Execution ([spec](./specs/native-execution/spec.md))
- FFmpeg availability detection
- Temporary workspace management
- File I/O through Tauri
- Process execution and monitoring
- Progress parsing from stderr
- Hardware acceleration detection

**Key Rust Commands**:
- `ffmpeg_check_availability()` - Detect FFmpeg
- `ffmpeg_create_temp_workspace()` - Create temp directory
- `ffmpeg_write_file()` / `ffmpeg_read_file()` - File I/O
- `ffmpeg_execute()` - Run FFmpeg command
- `ffmpeg_cleanup_workspace()` - Cleanup

### 3. Auto-Detection ([spec](./specs/auto-detection/spec.md))
- Environment detection (browser vs desktop)
- Intelligent driver selection
- User preference handling
- Runtime driver switching
- Capability-based feature availability

**Selection Algorithm**:
```typescript
Environment Browser → WASM only
Environment Desktop + Preference "wasm" → WASM
Environment Desktop + Preference "native" → Native (if available) → WASM fallback
Environment Desktop + Preference "auto" → Native (if available) → WASM fallback
```

---

## Performance Impact

### Expected Improvements (Native vs WASM)

| Scenario | WASM | Native (CPU) | Native (GPU) |
|----------|------|--------------|--------------|
| **H.264 1080p encoding** | 10-15 min | 3-5 min | 1-2 min |
| **H.265 4K encoding** | 40-60 min | 10-15 min | 3-5 min |
| **Max file size** | 500 MB | Unlimited | Unlimited |
| **Memory usage** | ~2 GB | System RAM | System RAM |
| **Hardware acceleration** | ❌ | ❌ | ✅ |

**Typical Speedup**: 3-5x with CPU, 10-20x with GPU acceleration

---

## File Structure

```
openspec/changes/implement-native-ffmpeg-driver/
├── README.md                              ✅ This file
├── proposal.md                            ✅ Complete proposal
├── tasks.md                               ✅ Implementation checklist (39 task groups)
└── specs/
    ├── driver-abstraction/
    │   └── spec.md                        ✅ Interface specification
    ├── native-execution/
    │   └── spec.md                        ✅ Rust implementation spec
    └── auto-detection/
        └── spec.md                        ✅ Selection logic spec

app/services/driver/                       (To be created)
├── types.ts
├── IFFmpegDriver.ts
├── WasmDriver.ts
├── NativeDriver.ts
├── FFmpegDriverManager.ts
└── index.ts

src-tauri/src/ffmpeg/                      (To be created)
├── mod.rs
├── detection.rs
├── workspace.rs
├── executor.rs
├── progress.rs
└── error.rs
```

---

## Implementation Plan

### Phase 2.1: Abstraction Layer (Week 1)
- Define `IFFmpegDriver` interface
- Implement `WasmDriver` wrapper
- Unit tests for abstraction
- **Milestone**: WASM driver working through new interface

### Phase 2.2: Native Implementation (Week 2-3)
- Rust FFmpeg commands (detection, file I/O, execution)
- Progress parsing
- Error handling
- **Milestone**: Rust backend can execute FFmpeg commands

### Phase 2.3: Integration (Week 4)
- Implement `NativeDriver` class
- Driver manager and auto-selection
- Update hooks and pools
- UI for preferences
- **Milestone**: Both drivers working, auto-selection functional

### Phase 2.4: Polish (Week 5)
- Performance benchmarking
- Documentation
- Error message improvements
- **Milestone**: Production-ready, documented

**Total Effort**: 4-5 weeks

---

## Success Criteria

### Technical
- [x] OpenSpec validation passes
- [ ] All tests passing (≥80% coverage)
- [ ] Native driver ≥3x faster than WASM (1080p H.264)
- [ ] Zero breaking changes
- [ ] Type-safe (zero TypeScript errors)

### User Experience
- [ ] Works transparently without configuration
- [ ] Clear feedback when native unavailable
- [ ] Manual driver selection in settings
- [ ] Performance improvements are noticeable

### Quality
- [ ] All documentation complete
- [ ] Platform testing (macOS, Windows, Linux)
- [ ] Benchmarks documented

---

## Dependencies

### System Requirements

**For Native Driver** (Desktop):
- FFmpeg 4.4+ installed and in PATH
- OR: Bundled FFmpeg (future Phase 3)

**Installation Instructions**:
```bash
# macOS
brew install ffmpeg

# Windows (Chocolatey)
choco install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg
```

**For WASM Driver** (Browser):
- No changes from current requirements

### Rust Dependencies

Add to `src-tauri/Cargo.toml`:
```toml
uuid = { version = "1.6", features = ["v4"] }
regex = "1.10"
serde_json = "1.0"
```

---

## User Experience

### Transparent Operation (Default)
1. User opens desktop app
2. App detects native FFmpeg → uses native driver automatically
3. User gets 5x faster encoding without knowing why
4. Everything just works

### Manual Control (Settings)
```
Settings → FFmpeg Driver

○ Automatic (Recommended)
  Uses native driver when available, falls back to WASM
  
○ Prefer Native
  Faster, unlimited file size, hardware acceleration
  
○ Prefer WASM  
  Works everywhere, no installation required

─────────────────────────────────────────
Active Driver: Native + GPU
Max File Size: Unlimited
Hardware Acceleration: NVIDIA NVENC
Available Encoders: h264_nvenc, hevc_nvenc, libx264, ...
```

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| FFmpeg not installed | Medium | High | Auto-fallback to WASM |
| Progress parsing fails | Medium | Low | Fallback to estimation |
| Platform differences | High | Medium | Test all platforms |
| Increased complexity | High | Medium | Comprehensive tests |

---

## Breaking Changes

**None**. This is a fully backward-compatible addition:
- WASM driver preserves existing behavior exactly
- Web deployment completely unchanged
- Desktop app works with or without FFmpeg

---

## Future Enhancements (Not in Phase 2)

### Phase 3 Candidates
- Bundled FFmpeg binary (no installation required)
- Streaming processing for large files
- Cloud execution driver
- WebCodecs API driver (browser-native GPU)

---

## Validation

```bash
$ npx openspec validate implement-native-ffmpeg-driver --strict
✅ Change 'implement-native-ffmpeg-driver' is valid
```

**Proposal Structure**:
- ✅ proposal.md: Complete (Why/What/Impact/Alternatives)
- ✅ tasks.md: 39 task groups across 8 phases
- ✅ specs/: 3 capability specs with requirements and scenarios
- ✅ All scenarios have testable Given/When/Then format
- ✅ Cross-references between capabilities documented

---

## Related Work

- **Depends On**: [add-tauri-desktop-support](../add-tauri-desktop-support/) - Phase 1 foundation
- **Enables**: Phase 3 hardware acceleration optimization
- **Future**: Phase 4 bundled FFmpeg, Phase 5 streaming

---

## Getting Started (After Approval)

1. **Review Proposal**: Read `proposal.md` for complete rationale
2. **Review Tasks**: Check `tasks.md` for implementation order
3. **Review Specs**: Study capability specifications in `specs/`
4. **Begin Implementation**: Start with Phase 2.1 (abstraction layer)

---

## Questions?

- **Architecture**: See `proposal.md` "What" section
- **Implementation Details**: See `specs/` directory
- **Timeline**: See `tasks.md` phase breakdown
- **Performance**: See "Performance Impact" section above

---

**Created**: 2025-01-13  
**Status**: Proposed, validation passed  
**Next Step**: Review and approval to proceed with implementation

**Estimated Effort**: 4-5 weeks  
**Team Size**: 1-2 developers  
**Risk Level**: Medium (abstraction layer adds complexity, but well-scoped)
