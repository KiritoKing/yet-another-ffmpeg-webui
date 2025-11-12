# Proposal: Add Tauri Desktop Support

**Change-ID**: `add-tauri-desktop-support`  
**Status**: Proposed  
**Created**: 2025-01-09  
**Author**: AI Agent with chlorinec

---

## Why: Problem and Motivation

### Current Limitations
The FFmpeg Easy application currently runs exclusively as a web application using FFmpeg.wasm in the browser. While this approach has significant advantages (no installation, cross-platform via URL, sandbox security), it faces inherent limitations:

1. **Performance Constraints**: WebAssembly execution is slower than native binaries, particularly for video encoding/transcoding tasks that can benefit from hardware acceleration
2. **Memory Limits**: Browser memory constraints (typically ~2GB practical limit) restrict the size and complexity of video processing tasks
3. **Hardware Acceleration**: No access to GPU-accelerated encoding (NVENC, QuickSync, VideoToolbox) or specialized media hardware
4. **File System Access**: Limited by browser security model; requires user interaction for file selection and download
5. **Background Processing**: Tab throttling and power management policies can interrupt long-running tasks
6. **Platform Integration**: Cannot integrate with OS features (system tray, native notifications, file associations)

### Opportunity
Tauri provides a path to desktop application deployment while maintaining the existing web-based architecture:

- **Dual Deployment**: Keep web version for accessibility, add desktop version for power users
- **Native FFmpeg**: Foundation for future integration with system-installed or bundled native FFmpeg binaries
- **Incremental Migration**: Start with minimal integration, gradually add native capabilities as needed
- **Rust Ecosystem**: Access to Rust's rich ecosystem for media processing, hardware detection, and system integration
- **Architecture Preservation**: Continue using React Router + Vite + TypeScript frontend with no major refactoring

### Strategic Context
This proposal represents **Phase 1** of a multi-phase desktop strategy:

- **Phase 1** (This Proposal): Minimal functional verification
  - Prove Tauri integration works with existing architecture
  - Establish communication patterns between Rust backend and JavaScript frontend
  - Validate build and deployment workflows
  - No user-facing feature changes

- **Phase 2** (Future): Native FFmpeg driver interface
  - Define `IFFmpegDriver` abstraction layer
  - Implement `WasmDriver` (current FFmpeg.wasm path)
  - Implement `NativeDriver` (system FFmpeg via Rust)
  - Auto-detect and select best driver at runtime

- **Phase 3** (Future): Desktop-specific features
  - Hardware acceleration detection and configuration
  - Drag-and-drop file processing
  - System tray integration
  - Background processing with native progress notifications
  - File association handlers

---

## What: Proposed Solution

### High-Level Approach
Add Tauri 2.x as a desktop application framework alongside the existing web deployment, with minimal changes to the current codebase:

1. **Tauri Infrastructure**
   - Install `@tauri-apps/cli` and `@tauri-apps/api` dependencies
   - Create `src-tauri/` directory with Rust backend structure
   - Configure `tauri.conf.json` for desktop window and build settings
   - Set up application icons and metadata

2. **Test Command Implementation**
   - Implement `greet_from_rust` Rust command as proof-of-concept
   - Add JavaScript bindings using `invoke()` from `@tauri-apps/api/core`
   - Create `TauriTest` component in settings page for verification

3. **Environment Detection**
   - Detect Tauri environment using `__TAURI_INTERNALS__` global variable
   - Enable conditional rendering for Tauri-specific features
   - Maintain full compatibility with browser deployment

4. **Build and Development Workflow**
   - Add `dev:tauri` and `build:tauri` npm scripts
   - Document correct startup sequence (Vite first, then Tauri)
   - Configure Tauri to use Vite dev server in development

### Technical Implementation

#### Rust Backend Structure
```
src-tauri/
├── Cargo.toml          # Rust dependencies (tauri 2.1, serde)
├── build.rs            # Build script for tauri-build
├── tauri.conf.json     # Tauri app configuration
├── src/
│   ├── main.rs         # Application entry point
│   └── lib.rs          # Library with command handlers
└── icons/              # Application icon assets
```

#### Command Pattern
Rust side (lib.rs):
```rust
#[tauri::command]
fn greet_from_rust(name: &str) -> String {
    format!("Hello, {}! Welcome from Rust backend 🦀", name)
}
```

JavaScript side (settings.tsx):
```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<string>("greet_from_rust", { 
  name: "FFmpeg Easy" 
});
```

#### Environment Detection
```typescript
const isTauri = typeof window !== "undefined" && 
                "__TAURI_INTERNALS__" in window;
```

**Note**: Tauri 2.0 changed the global variable from `__TAURI__` to `__TAURI_INTERNALS__`. This was discovered during implementation via browser console inspection.

#### Development Workflow
Correct startup sequence to avoid Vite dependency caching issues:

1. Start Vite dev server first: `pnpm dev` (port 5173)
2. Wait for Vite to be ready
3. Start Tauri: `pnpm dev:tauri`
4. Tauri loads from `http://localhost:5173`

**Critical**: Starting Tauri first or having stale Vite cache causes 504 "Outdated Optimize Dep" errors.

### Configuration Details

#### tauri.conf.json Key Settings
```json
{
  "productName": "FFmpeg Easy",
  "build": {
    "frontendDist": "../build/client",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [
      {
        "title": "FFmpeg Easy",
        "width": 1400,
        "height": 900,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

#### Cargo.toml Key Settings
```toml
[lib]
name = "ffmpeg_easy_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2.1", features = ["devtools"] }
serde = { version = "1", features = ["derive"] }
```

---

## Impact: Affected Areas

### Code Changes
**New Files** (~20 files, ~200 LOC):
- `src-tauri/Cargo.toml` - Rust project configuration
- `src-tauri/build.rs` - Tauri build integration
- `src-tauri/src/main.rs` - Application entry point
- `src-tauri/src/lib.rs` - Command handlers
- `src-tauri/tauri.conf.json` - App configuration
- `src-tauri/icons/*` - Application icons (16 files)

**Modified Files** (~2 files, +30 LOC):
- `package.json` - Add Tauri dependencies and scripts
- `app/routes/settings.tsx` - Add TauriTest component

**No Changes Required**:
- Core application logic
- Component library
- State management
- Services layer
- Utility functions
- Build configuration (except new scripts)

### Dependencies
**New Dependencies**:
- `@tauri-apps/cli@2.9.4` (devDependency) - ~15MB
- `@tauri-apps/api@2.9.0` (dependency) - ~500KB
- Rust toolchain required at build time

**Total Bundle Size Impact**:
- Web bundle: **No change** (Tauri deps only used in desktop build)
- Desktop bundle: +~3MB for Tauri runtime

### Build Process
**Development**:
- Existing: `pnpm dev` → Vite dev server
- New: `pnpm dev:tauri` → Launches desktop app with Vite dev server

**Production**:
- Existing: `pnpm build` → `build/client/` for web deployment
- New: `pnpm build:tauri` → Platform-specific installers (`.app`, `.exe`, `.deb`, etc.)

**Build Times**:
- First Tauri build: ~40-60 seconds (compiles 449 Rust packages)
- Incremental builds: ~5-10 seconds (Rust caching)
- Web builds: **No change**

### User Experience
**No User-Facing Changes in Phase 1**:
- Web application remains primary deployment
- Desktop application is optional, feature-equivalent
- UI/UX identical between web and desktop
- All existing features work unchanged

**Future Opportunities** (Phase 2+):
- Native FFmpeg option for better performance
- Desktop-specific features (system tray, drag-drop)
- Offline operation with bundled resources

### Documentation
**New Documentation Required**:
- Development setup guide for Tauri (Rust installation, troubleshooting)
- Desktop build and distribution guide
- Architecture documentation explaining dual deployment
- Known issues and limitations (startup sequence, environment detection)

**Updated Documentation**:
- README.md - Add desktop installation section
- DEPLOYMENT.md - Add desktop platform instructions
- AGENTS.md - Reference this proposal

### Testing
**New Test Scenarios**:
- Environment detection (browser vs. Tauri)
- Rust command invocation from JavaScript
- Desktop app startup and window rendering
- Build process for multiple platforms

**Existing Tests**:
- All current functionality remains testable
- No regression risk for web deployment

### Deployment
**Web Deployment**: **Unchanged**
- Vercel, Netlify, Cloudflare Pages continue to work
- No changes to static asset structure
- No changes to headers or CSP policies

**Desktop Deployment**: **New**
- Requires platform-specific builds (macOS, Windows, Linux)
- Can distribute via direct download or update servers
- Separate release process from web deployment

---

## Verification Criteria

This proposal is considered successfully implemented when:

1. ✅ **Build System**: Both `pnpm dev:tauri` and `pnpm build:tauri` execute without errors
2. ✅ **Desktop Launch**: Application window opens with correct dimensions and title
3. ✅ **Environment Detection**: `__TAURI_INTERNALS__` correctly identifies desktop vs. browser
4. ✅ **Command Communication**: `invoke("greet_from_rust")` successfully calls Rust and returns response
5. ✅ **Web Compatibility**: `pnpm dev` and `pnpm build` continue to work for web deployment
6. ✅ **Type Safety**: All new code passes `pnpm typecheck` with zero errors
7. ✅ **Code Quality**: Biome checks pass with no critical diagnostics
8. ✅ **Documentation**: Basic Tauri development guide created

**Acceptance Test**: 
- Start development environment with correct sequence
- Open desktop app
- Navigate to Settings page
- Click "测试 Tauri 通信" button
- Verify toast shows success message with Rust response

---

## Alternatives Considered

### 1. Electron
**Pros**: Mature ecosystem, extensive documentation, large community  
**Cons**: Large bundle size (~150MB), Node.js overhead, security concerns, slower performance  
**Decision**: Tauri chosen for smaller bundle (~5-10MB), better performance, and Rust integration benefits

### 2. Native FFmpeg.wasm Multi-threading Only
**Pros**: No new dependencies, simpler architecture  
**Cons**: Still constrained by browser limits, no hardware acceleration, no OS integration  
**Decision**: Not mutually exclusive; desktop app provides optional path while keeping web version

### 3. Server-Side Processing
**Pros**: Offload processing to powerful servers  
**Cons**: Privacy concerns, network latency, hosting costs, requires backend infrastructure  
**Decision**: Conflicts with client-side processing philosophy and privacy focus

### 4. WebGPU for Acceleration
**Pros**: Browser-native GPU access  
**Cons**: Limited codec support, experimental APIs, not available in all browsers  
**Decision**: Promising future direction but not ready for production; Tauri provides immediate path

---

## Open Questions

1. **Distribution Strategy**: How should desktop builds be distributed?
   - Direct download from website?
   - Auto-update mechanism?
   - App stores (Mac App Store, Microsoft Store)?

2. **Platform Priority**: Which platforms to support initially?
   - Proposal: macOS first (developer platform), then Windows, then Linux

3. **Update Mechanism**: How to handle application updates?
   - Consider Tauri's built-in updater feature
   - Version management between web and desktop

4. **Native FFmpeg Bundling** (Phase 2): Should we bundle FFmpeg binary or use system installation?
   - Bundling: Larger download but guaranteed availability
   - System: Smaller but dependency management complexity

5. **Feature Parity**: Should desktop version eventually have exclusive features?
   - Risk of fragmenting user base
   - Opportunity to differentiate power user experience

---

## Dependencies and Prerequisites

### Development Environment
- **Rust Toolchain**: rustc 1.70+ and cargo
- **Node.js**: v18+ (same as web development)
- **pnpm**: 9.x (same as web development)
- **Tauri CLI**: Installed via `@tauri-apps/cli`

### Platform-Specific Build Requirements
- **macOS**: Xcode Command Line Tools
- **Windows**: Visual Studio Build Tools or MinGW
- **Linux**: webkit2gtk, libssl-dev, and other system libraries

### Runtime Prerequisites
- **macOS**: macOS 10.15+
- **Windows**: Windows 10+
- **Linux**: Modern distribution with GTK3

---

## Timeline and Milestones

**Phase 1: Minimal Functional Verification** (Complete)
- ✅ Research and dependency installation
- ✅ Project structure creation
- ✅ Test command implementation
- ✅ Environment detection
- ✅ Verification and debugging
- ✅ OpenSpec proposal creation

**Phase 2: Driver Abstraction** (Future, separate proposal)
- Define `IFFmpegDriver` interface
- Implement `WasmDriver` wrapper
- Implement `NativeDriver` with Rust
- Auto-detection and selection logic

**Phase 3: Desktop Features** (Future, separate proposal)
- Hardware acceleration
- System integration
- Background processing
- Distribution and updates

---

## References

- [Tauri Official Documentation](https://tauri.app/v2/)
- [Tauri 2.0 Migration Guide](https://tauri.app/v2/guides/migration/)
- [FFmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/)
- Issue: Environment detection (`__TAURI_INTERNALS__` vs `__TAURI__`)
- Build Issue: Vite dependency caching requiring correct startup sequence
