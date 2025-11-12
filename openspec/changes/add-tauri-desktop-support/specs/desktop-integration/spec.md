# Desktop Integration Specification

**Capability**: Desktop Integration  
**Version**: 1.0.0  
**Status**: Proposed

---

## Overview

This specification defines the minimal desktop application integration for FFmpeg Easy using Tauri 2.x. It establishes the foundation for running the application as a native desktop application while maintaining full compatibility with browser-based deployment.

The specification covers:
1. Environment detection to distinguish desktop from browser contexts
2. Rust-JavaScript communication patterns using Tauri's command system
3. Build configuration for dual deployment (web + desktop)
4. Development workflow requirements

---

## ADDED Requirements

### Requirement: Environment Detection

The application MUST be able to detect whether it is running in a Tauri desktop environment or a standard browser environment at runtime.

#### Scenario: Desktop Environment Detection

**Given** the application is running in a Tauri desktop application

**When** the environment detection code executes

**Then** 
- The global object `window.__TAURI_INTERNALS__` MUST be defined
- Environment detection returns `true` for Tauri context
- Tauri-specific UI elements MAY be conditionally rendered
- Browser-specific fallbacks MUST NOT execute

**Implementation Example**:
```typescript
const isTauri = typeof window !== "undefined" && 
                "__TAURI_INTERNALS__" in window;
```

---

#### Scenario: Browser Environment Detection

**Given** the application is running in a standard web browser

**When** the environment detection code executes

**Then**
- The global object `window.__TAURI_INTERNALS__` MUST be undefined
- Environment detection returns `false` for Tauri context
- Tauri-specific UI elements MUST NOT render
- Browser-specific functionality MUST continue to work normally
- No errors or warnings related to Tauri SHOULD occur

---

### Requirement: Rust Command Execution

The application MUST support invoking Rust backend commands from JavaScript and receiving typed responses.

#### Scenario: Successful Command Invocation

**Given** a Rust command is defined with `#[tauri::command]` attribute

**And** the command is registered in the Tauri Builder invoke_handler

**And** the application is running in Tauri desktop environment

**When** JavaScript calls `invoke<T>(commandName, args)`

**Then**
- The Rust command MUST execute with provided arguments
- The command MUST return a value of the expected type
- The Promise MUST resolve with the typed result
- No errors MUST occur during invocation

**Implementation Example**:

Rust side:
```rust
#[tauri::command]
fn greet_from_rust(name: &str) -> String {
    format!("Hello, {}! Welcome from Rust backend 🦀", name)
}
```

JavaScript side:
```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<string>("greet_from_rust", { 
  name: "FFmpeg Easy" 
});
// result === "Hello, FFmpeg Easy! Welcome from Rust backend 🦀"
```

---

#### Scenario: Command Error Handling

**Given** a Rust command may fail or throw an error

**When** JavaScript invokes the command and an error occurs

**Then**
- The Promise MUST reject with an error
- The error SHOULD contain a descriptive message
- The application MUST handle the error gracefully
- User-facing error messages SHOULD be displayed appropriately

---

### Requirement: Build Configuration

The project MUST support building both web and desktop versions from the same codebase without conflicts.

#### Scenario: Web Build Process

**Given** the project is configured for web deployment

**When** the build command `pnpm build` executes

**Then**
- Static web assets MUST be generated in `build/client/` directory
- The build MUST NOT include Tauri-specific code in the bundle
- The build MUST work with standard web hosting (Vercel, Netlify, etc.)
- Build time MUST NOT significantly increase due to Tauri presence
- All existing web features MUST continue to function

---

#### Scenario: Desktop Build Process

**Given** the project is configured for desktop deployment

**When** the build command `pnpm build:tauri` executes

**Then**
- Platform-specific installer(s) MUST be generated
- The application bundle MUST include the Tauri runtime (~3-5MB)
- The frontend assets MUST be embedded from `build/client/`
- Rust dependencies MUST be compiled and linked
- The resulting executable MUST launch without requiring Node.js

**Build Artifacts**:
- **macOS**: `.app` bundle, optionally `.dmg` installer
- **Windows**: `.exe` installer, optionally `.msi`
- **Linux**: `.AppImage`, `.deb`, or `.rpm` as configured

---

### Requirement: Development Workflow

The development environment MUST support running the application in Tauri desktop mode without interfering with web development.

#### Scenario: Desktop Development Mode

**Given** the Vite development server is running on `http://localhost:5173`

**When** the command `pnpm dev:tauri` executes

**Then**
- Tauri MUST launch a desktop window
- The window MUST load content from `http://localhost:5173`
- Hot module replacement (HMR) MUST work correctly
- Changes in frontend code MUST reload automatically
- Changes in Rust code MUST trigger recompilation
- Console logs MUST be visible in terminal

**Critical Startup Sequence**:
1. Start Vite dev server first: `pnpm dev`
2. Wait for Vite to be ready (watch for "ready" message)
3. Start Tauri: `pnpm dev:tauri`

**Rationale**: Starting Tauri before Vite causes dependency caching issues leading to 504 errors.

---

#### Scenario: First-Time Rust Compilation

**Given** Rust code has never been compiled before

**When** `pnpm dev:tauri` or `pnpm build:tauri` executes for the first time

**Then**
- Cargo MUST download and compile all Rust dependencies
- Compilation SHOULD complete within 60 seconds on modern hardware
- Approximately 450 Rust packages WILL be compiled
- Total compiled artifacts SHOULD be around 10-15MB
- Subsequent builds MUST use Cargo's incremental compilation cache

**Performance Expectations**:
- First build: ~40-60 seconds
- Incremental builds: ~5-10 seconds

---

### Requirement: Configuration Files

The Tauri configuration MUST correctly specify paths and settings for both development and production builds.

#### Scenario: Tauri Configuration Validation

**Given** the file `src-tauri/tauri.conf.json` exists

**Then**
- `build.frontendDist` MUST be set to `"../build/client"`
- `build.devUrl` MUST be set to `"http://localhost:5173"`
- `app.productName` MUST be defined (e.g., "FFmpeg Easy")
- `app.windows[0].width` SHOULD be at least 1400
- `app.windows[0].height` SHOULD be at least 900
- `app.windows[0].minWidth` MUST be at least 800
- `app.windows[0].minHeight` MUST be at least 600
- Icon paths MUST be valid and all required sizes present

---

#### Scenario: Cargo Configuration Validation

**Given** the file `src-tauri/Cargo.toml` exists

**Then**
- `[package].name` MUST match the library name
- `[lib].crate-type` MUST include `["staticlib", "cdylib", "rlib"]`
- `[dependencies].tauri` version MUST be at least `2.1`
- `[dependencies].serde` MUST be included with `derive` feature

---

## MODIFIED Requirements

None. This is a new capability with no modifications to existing functionality.

---

## REMOVED Requirements

None. This is a purely additive change.

---

## Non-Functional Requirements

### Performance
- Desktop application startup MUST complete within 5 seconds on typical hardware
- Command invocation latency MUST be under 50ms for simple commands
- Desktop builds MUST NOT increase web bundle size

### Security
- Tauri MUST run with appropriate security settings (CSP, allowlist)
- Rust commands SHOULD validate input parameters
- File system access MUST be restricted to user-selected paths

### Compatibility
- Desktop application MUST work on:
  - macOS 10.15+ (Catalina and later)
  - Windows 10+
  - Modern Linux distributions with GTK3
- Web version MUST remain fully functional and unchanged

### Maintainability
- Rust code MUST pass `cargo clippy` without warnings
- TypeScript code MUST pass `pnpm typecheck` without errors
- New code MUST follow project conventions (file size limits, naming)

---

## Dependencies

This specification depends on:
- **External**: Tauri 2.1+, Rust toolchain 1.70+
- **Internal**: Existing React Router + Vite build configuration

This specification is depended on by:
- **Future**: Native FFmpeg driver implementation (Phase 2)
- **Future**: Desktop-specific features (Phase 3)

---

## Migration and Rollout

### Development Environment Setup
Developers MUST install Rust toolchain before working with desktop features:

```bash
# macOS / Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# Download and run rustup-init.exe from rustup.rs
```

### Deployment Strategy
- **Web**: No changes, continue existing deployment process
- **Desktop**: New optional distribution channel
- **Users**: Can choose between web and desktop versions

### Rollback Plan
If critical issues arise:
1. Remove Tauri dependencies from `package.json`
2. Delete `src-tauri/` directory
3. Remove desktop-specific scripts
4. Web version continues to work unchanged

---

## Testing Requirements

### Manual Acceptance Tests
1. **Environment Detection**:
   - Open app in browser → shows browser indicator
   - Open app in Tauri → shows desktop indicator

2. **Command Invocation**:
   - Navigate to Settings → Tauri Test section
   - Click "测试 Tauri 通信" button
   - Verify toast shows: "Hello, FFmpeg Easy! Welcome from Rust backend 🦀"

3. **Build Verification**:
   - Run `pnpm build` → web assets generated
   - Run `pnpm build:tauri` → desktop installer generated
   - Install and launch desktop app → works correctly

### Automated Tests (Future)
- Unit tests for environment detection helper
- Integration tests for command invocation (requires Tauri test framework)
- Build pipeline tests in CI/CD

---

## Open Issues and Future Considerations

### Known Limitations
1. **First Build Time**: Initial Rust compilation takes ~60 seconds
2. **Startup Sequence**: Manual coordination required between Vite and Tauri in development
3. **Platform Dependencies**: Requires platform-specific build tools

### Future Enhancements
1. **Phase 2: Driver Abstraction**
   - Define `IFFmpegDriver` interface
   - Implement auto-detection and selection logic
   - Enable runtime switching between WASM and native

2. **Phase 3: Native Features**
   - Hardware acceleration detection
   - Drag-and-drop file handling
   - System tray integration
   - Background processing with OS notifications

3. **Development Experience**
   - Investigate automated startup sequence (concurrently?)
   - Consider Tauri plugin for better Vite integration
   - Explore Rust test framework integration

---

## References

- [Tauri 2.x Documentation](https://tauri.app/v2/)
- [Tauri Command System](https://tauri.app/v2/guides/features/command/)
- [Tauri Configuration Reference](https://tauri.app/v2/reference/config/)
- [Cargo Manifest Format](https://doc.rust-lang.org/cargo/reference/manifest.html)
