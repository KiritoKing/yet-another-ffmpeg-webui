# Add Tauri Desktop Support

**Change-ID**: `add-tauri-desktop-support`  
**Status**: ✅ Proposed (Awaiting Approval)  
**Validation**: ✅ Passed `openspec validate --strict`

---

## Quick Summary

This proposal documents the **minimal functional verification** of Tauri 2.x desktop integration with FFmpeg Easy. It establishes the foundation for running the application as a native desktop application while maintaining full compatibility with the existing browser-based deployment.

### What This Changes
- ✅ **Adds**: Desktop application capability using Tauri 2.x
- ✅ **Adds**: Rust backend with command system (proof-of-concept)
- ✅ **Adds**: Environment detection (desktop vs. browser)
- ✅ **Adds**: Build scripts and development workflow
- ⚠️ **No user-facing changes** - this is Phase 1 infrastructure only

### What This Doesn't Change
- Web deployment remains primary and unchanged
- All existing features work identically
- No new user-facing features (yet)
- Build and development workflow for web unchanged

---

## Verification Status

All 8 verification criteria met:
- ✅ Build system works (`pnpm dev:tauri`, `pnpm build:tauri`)
- ✅ Desktop application launches successfully
- ✅ Environment detection using `__TAURI_INTERNALS__`
- ✅ Rust↔JavaScript command communication verified
- ✅ Web compatibility maintained
- ✅ Type safety (zero TypeScript errors)
- ✅ Code quality (Biome checks passed)
- ✅ OpenSpec validation passed

**Acceptance Test Result**: ✅ Communication test successful
- Desktop app displays "✅ Tauri 环境"
- Button click invokes `greet_from_rust` command
- Toast shows: "Hello, FFmpeg Easy! Welcome from Rust backend 🦀"

---

## Files

- **[proposal.md](./proposal.md)** - Complete rationale, implementation details, and impact analysis
- **[tasks.md](./tasks.md)** - Implementation checklist (95% complete)
- **[specs/desktop-integration/spec.md](./specs/desktop-integration/spec.md)** - Formal capability specification with requirements and scenarios

---

## Key Technical Decisions

### Environment Detection
Uses `__TAURI_INTERNALS__` global variable (Tauri 2.0 breaking change from `__TAURI__`)

### Development Workflow
Critical startup sequence:
1. Start Vite first: `pnpm dev`
2. Then start Tauri: `pnpm dev:tauri`

**Rationale**: Prevents Vite dependency caching issues causing 504 errors

### Command Pattern
```typescript
// JavaScript side
import { invoke } from "@tauri-apps/api/core";
const result = await invoke<string>("command_name", { args });

// Rust side
#[tauri::command]
fn command_name(args: ArgType) -> ReturnType { ... }
```

---

## Next Steps (Phase 2)

This proposal lays groundwork for future native FFmpeg integration:
1. Define `IFFmpegDriver` interface abstraction
2. Implement `WasmDriver` (current FFmpeg.wasm)
3. Implement `NativeDriver` (system FFmpeg via Rust)
4. Auto-detection and runtime switching
5. Hardware acceleration support

**Separate proposal required** for Phase 2 work.

---

## Impact Summary

| Area | Change |
|------|--------|
| **Bundle Size** | Web: unchanged, Desktop: +3-5MB |
| **Dependencies** | +2 packages (~15MB dev) |
| **Code Changes** | ~20 new files, 2 modified files |
| **Build Time** | First: +60s, Incremental: +5s |
| **User Experience** | No changes (Phase 1) |
| **Deployment** | Web unchanged, Desktop new |

---

## Known Issues

1. **Startup Sequence**: Manual coordination required (Vite then Tauri)
2. **First Build**: Slow due to Rust compilation (~60s)
3. **Platform Tools**: Requires platform-specific build dependencies

---

## Review Checklist

Before archiving, confirm:
- [ ] All stakeholders reviewed and approved
- [ ] Documentation complete (dev guide, deployment)
- [ ] AGENTS.md updated with reference
- [ ] Changelog entry created
- [ ] Phase 2 proposal scoped (if needed)

---

**Created**: 2025-01-09  
**Last Updated**: 2025-01-09  
**Validation Date**: 2025-01-09
