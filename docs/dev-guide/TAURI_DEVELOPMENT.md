# Tauri Desktop Development Guide

This guide covers everything you need to know about developing and building the desktop version of FFmpeg Easy using Tauri.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Workflow](#development-workflow)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)
- [Best Practices](#best-practices)

---

## Overview

FFmpeg Easy supports dual deployment:
- **Web Application**: Runs in browsers using FFmpeg.wasm
- **Desktop Application**: Native desktop app using Tauri 2.x

The desktop version:
- Shares the same codebase with the web version
- Uses React Router v7 + Vite for the frontend
- Uses Rust for the backend (via Tauri)
- Provides foundation for future native FFmpeg integration

### Phase 1 Status (Current)

✅ **Completed**: Minimal functional verification
- Tauri infrastructure setup
- Environment detection
- Rust ↔ JavaScript communication
- Build configuration

⏳ **Future Phases**:
- Phase 2: Native FFmpeg driver interface
- Phase 3: Desktop-specific features (hardware acceleration, system tray, etc.)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or later)
   ```bash
   node --version  # Should be v18.x or higher
   ```

2. **pnpm** (v9.x)
   ```bash
   pnpm --version  # Should be 9.x
   ```

3. **Rust Toolchain** (v1.70 or later)
   
   **macOS / Linux**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   rustc --version  # Verify installation
   ```

   **Windows**:
   - Download and run [rustup-init.exe](https://rustup.rs/)
   - Follow the installer prompts
   - Restart your terminal
   - Run `rustc --version` to verify

### Platform-Specific Dependencies

**macOS**:
```bash
xcode-select --install  # Xcode Command Line Tools
```

**Windows**:
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- OR use [MinGW](https://www.mingw-w64.org/)

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

**Linux (Fedora)**:
```bash
sudo dnf install webkit2gtk4.1-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel
```

---

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/KiritoKing/yet-another-ffmpeg-webui.git
   cd yet-another-ffmpeg-webui
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Verify Tauri CLI is installed**:
   ```bash
   pnpm tauri --version
   # Should output: @tauri-apps/cli 2.9.4 or later
   ```

---

## Development Workflow

### Critical: Correct Startup Sequence ⚠️

**Always start Vite BEFORE Tauri** to avoid dependency caching issues:

#### Method 1: Two Terminal Windows (Recommended)

**Terminal 1** - Start Vite dev server:
```bash
pnpm dev
# Wait for: "ready in XXXms" message
```

**Terminal 2** - Start Tauri:
```bash
pnpm dev:tauri
```

#### Method 2: Using concurrently (Future Enhancement)

Currently not configured, but could be added:
```bash
# Future enhancement
pnpm dev:desktop  # Would run both with proper sequencing
```

### What Happens During Development

1. **Vite Dev Server** starts on `http://localhost:5173`
   - Hot Module Replacement (HMR) enabled
   - Frontend changes reload automatically

2. **Tauri Desktop Window** launches
   - Loads content from `http://localhost:5173`
   - Wraps web app in native window

3. **Rust Backend** compiles and runs
   - First compilation: ~40-60 seconds (449 packages)
   - Incremental builds: ~5-10 seconds
   - Auto-recompiles when Rust code changes

### Testing Environment Detection

1. Navigate to **Settings** page in the app
2. Scroll to **Tauri 桌面集成测试** section
3. Look for the indicator:
   - ✅ **Tauri 环境** → Running in desktop app
   - ⚠️ **Web 环境** → Running in browser

### Testing Rust Communication

1. In the **Tauri 桌面集成测试** section
2. Click **测试 Tauri 通信** button
3. Expected result: Toast notification with message
   ```
   Hello, FFmpeg Easy! Welcome from Rust backend 🦀
   ```

---

## Building for Production

### Web Build (Unchanged)

```bash
pnpm build
```

Output: `build/client/` - Static assets for web deployment

### Desktop Build

```bash
pnpm build:tauri
```

**What happens**:
1. Frontend is built with `react-router build`
2. Rust backend is compiled in release mode
3. Assets are bundled into platform-specific installer(s)

**Output location**: `src-tauri/target/release/bundle/`

**Generated artifacts**:

| Platform | File Types | Location |
|----------|------------|----------|
| **macOS** | `.app` bundle<br>`.dmg` installer | `bundle/macos/` |
| **Windows** | `.exe` installer<br>`.msi` (optional) | `bundle/msi/` or `bundle/nsis/` |
| **Linux** | `.AppImage`<br>`.deb`<br>`.rpm` | `bundle/appimage/` or `bundle/deb/` |

### Build Times

- **First desktop build**: ~60 seconds (Rust compilation)
- **Incremental builds**: ~10-15 seconds
- **Web builds**: Unchanged (~5-10 seconds)

### Distribution

**macOS**:
```bash
# Sign the app (requires Apple Developer ID)
codesign --deep --force --verify --verbose --sign "Developer ID Application" \
    src-tauri/target/release/bundle/macos/FFmpeg\ Easy.app

# Create distributable DMG
# (Already generated by Tauri build)
```

**Windows**:
```bash
# .exe installer is ready to distribute
# Optionally sign with signtool.exe
```

**Linux**:
```bash
# AppImage is portable, no installation needed
# .deb and .rpm can be installed via package managers
```

---

## Troubleshooting

### Issue: White Screen with 504 Error

**Symptoms**:
- Desktop window opens but shows white screen
- Console shows: "504 Outdated Optimize Dep"

**Cause**: Started Tauri before Vite was ready

**Solution**:
1. Stop both Vite and Tauri
2. Delete `.vite` cache directory (if it exists)
3. Start Vite first: `pnpm dev`
4. Wait for "ready" message
5. Start Tauri: `pnpm dev:tauri`

---

### Issue: `__TAURI__` is not defined

**Symptoms**:
- JavaScript error about `__TAURI__` being undefined
- Environment detection fails

**Cause**: Using Tauri 1.x global variable name

**Solution**:
Tauri 2.0 changed the global variable:
```typescript
// ❌ OLD (Tauri 1.x)
const isTauri = "__TAURI__" in window;

// ✅ NEW (Tauri 2.0+)
const isTauri = "__TAURI_INTERNALS__" in window;
```

---

### Issue: Rust Compilation Fails

**Symptoms**:
```
error: linking with `cc` failed
```

**Cause**: Missing system dependencies

**Solution**:
1. **macOS**: Install Xcode Command Line Tools
   ```bash
   xcode-select --install
   ```

2. **Windows**: Install Visual Studio Build Tools

3. **Linux**: Install required packages (see Prerequisites)

---

### Issue: Tauri CLI Not Found

**Symptoms**:
```
'tauri' is not recognized as an internal or external command
```

**Cause**: Tauri CLI not installed or not in PATH

**Solution**:
```bash
# Reinstall dependencies
pnpm install

# Or manually install Tauri CLI
pnpm add -D @tauri-apps/cli

# Verify
pnpm tauri --version
```

---

### Issue: Long First Build Time

**Symptoms**: First `pnpm dev:tauri` takes 40-60 seconds

**This is expected behavior**:
- Cargo downloads and compiles ~450 packages
- Creates compilation cache in `src-tauri/target/`
- Subsequent builds use cache: ~5-10 seconds

**Tips to reduce wait time**:
- Keep `src-tauri/target/` directory (don't delete)
- Use `cargo build --release` in advance if needed
- Consider using `sccache` for distributed caching

---

### Issue: Port 5173 Already in Use

**Symptoms**:
```
Port 5173 is in use, trying another one...
```

**Cause**: Previous Vite instance still running

**Solution**:
```bash
# Kill process on port 5173
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## Architecture

### Project Structure

```
ffmpeg-easy/
├── app/                    # React frontend (shared)
│   ├── routes/
│   │   └── settings.tsx    # Contains TauriTest component
│   └── ...
├── src-tauri/              # Rust backend (desktop only)
│   ├── src/
│   │   ├── main.rs        # Entry point
│   │   └── lib.rs         # Commands (greet_from_rust)
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri configuration
│   └── icons/             # App icons
├── build/client/          # Built frontend assets
└── package.json           # Node.js dependencies
```

### Communication Flow

```
┌─────────────────────────────────────────────┐
│         React Frontend (TypeScript)         │
│  ┌─────────────────────────────────────┐   │
│  │  import { invoke } from             │   │
│  │    "@tauri-apps/api/core"           │   │
│  │                                     │   │
│  │  const result = await invoke(       │   │
│  │    "greet_from_rust",               │   │
│  │    { name: "FFmpeg Easy" }          │   │
│  │  );                                 │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │ IPC (Inter-Process Communication)
                   ▼
┌─────────────────────────────────────────────┐
│          Rust Backend (Tauri)               │
│  ┌─────────────────────────────────────┐   │
│  │  #[tauri::command]                  │   │
│  │  fn greet_from_rust(name: &str)     │   │
│  │      -> String {                    │   │
│  │    format!("Hello, {}!", name)      │   │
│  │  }                                  │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Environment Detection

```typescript
// app/routes/settings.tsx
const isTauri = typeof window !== "undefined" && 
                "__TAURI_INTERNALS__" in window;

if (isTauri) {
  // Desktop-specific features
} else {
  // Browser fallback
}
```

### Configuration Files

**tauri.conf.json**:
```json
{
  "build": {
    "frontendDist": "../build/client",  // Production assets
    "devUrl": "http://localhost:5173"   // Dev server
  },
  "app": {
    "productName": "FFmpeg Easy",
    "windows": [{
      "width": 1400,
      "height": 900,
      "minWidth": 800,
      "minHeight": 600
    }]
  }
}
```

**Cargo.toml**:
```toml
[lib]
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2.0.0", features = [] }
serde = { version = "1", features = ["derive"] }
```

---

## Best Practices

### 1. Always Use Environment Detection

❌ **Bad**: Assume Tauri APIs are always available
```typescript
import { invoke } from "@tauri-apps/api/core";

// This will crash in browser!
const result = await invoke("some_command");
```

✅ **Good**: Check environment first
```typescript
import { invoke } from "@tauri-apps/api/core";

const isTauri = "__TAURI_INTERNALS__" in window;

if (isTauri) {
  const result = await invoke("some_command");
} else {
  // Browser fallback
}
```

### 2. Handle Command Errors

✅ **Good**: Always wrap `invoke` in try-catch
```typescript
try {
  const result = await invoke<string>("greet_from_rust", { name });
  toast.success(result);
} catch (error) {
  console.error("Tauri command error:", error);
  toast.error("Failed to communicate with backend");
}
```

### 3. Keep Web Version Functional

- Desktop features should be **optional enhancements**
- Never break web version for desktop features
- Test both deployments regularly

### 4. Type Safety for Commands

✅ **Good**: Use TypeScript generics
```typescript
// Type the response
const response = await invoke<string>("greet_from_rust", { name });
```

### 5. Follow Rust Best Practices

- Keep commands simple and focused
- Validate input parameters
- Return serializable types (String, i32, Vec, etc.)
- Use `Result<T, E>` for operations that can fail

Example:
```rust
#[tauri::command]
fn process_file(path: String) -> Result<String, String> {
    if path.is_empty() {
        return Err("Path cannot be empty".to_string());
    }
    
    // Process file...
    Ok("Success".to_string())
}
```

---

## Performance Considerations

### Development Mode

- **HMR**: Frontend changes reload instantly
- **Rust recompilation**: 5-10 seconds for backend changes
- **Memory**: ~200-300MB for dev environment

### Production Build

- **Bundle size**: ~3-5MB (Tauri runtime) + frontend assets
- **Startup time**: < 2 seconds on modern hardware
- **Memory**: ~100-150MB typical usage

### Optimization Tips

1. **Use release builds for distribution**:
   ```bash
   pnpm build:tauri  # Automatically uses --release
   ```

2. **Enable Rust compiler optimizations** (already configured):
   ```toml
   [profile.release]
   opt-level = 3
   lto = true
   ```

3. **Tree-shake frontend dependencies**:
   - Already handled by Vite
   - Ensure unused imports are removed

---

## Next Steps

### Current: Phase 1 Complete ✅
- Infrastructure setup
- Basic communication patterns
- Build configuration

### Future: Phase 2 (Planned)
- Define `IFFmpegDriver` interface
- Implement `WasmDriver` (current path)
- Implement `NativeDriver` (system FFmpeg)
- Auto-detect and select best driver

### Future: Phase 3 (Planned)
- Hardware acceleration detection
- Drag-and-drop file handling
- System tray integration
- Background processing with native notifications

---

## Additional Resources

- **Tauri Documentation**: https://tauri.app/v2/
- **Tauri Commands Guide**: https://tauri.app/v2/guides/features/command/
- **Rust Book**: https://doc.rust-lang.org/book/
- **Project Proposal**: `openspec/changes/add-tauri-desktop-support/proposal.md`
- **Specification**: `openspec/changes/add-tauri-desktop-support/specs/desktop-integration/spec.md`

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Tauri documentation
3. Search existing issues on GitHub
4. Create a new issue with:
   - Platform (macOS/Windows/Linux)
   - Error messages and logs
   - Steps to reproduce

---

**Last Updated**: 2025-01-13 (v6.0 - Phase 1 Complete)
