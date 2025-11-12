# Tasks: Add Tauri Desktop Support

**Change-ID**: `add-tauri-desktop-support`

---

## Phase 1: Setup and Configuration

### 1. Install Dependencies
- [x] Install `@tauri-apps/cli@2.9.4` as devDependency
- [x] Install `@tauri-apps/api@2.9.0` as dependency
- [x] Verify Rust toolchain is installed (`rustc --version`, `cargo --version`)
- [x] Update `package.json` with new dependencies

### 2. Create Project Structure
- [x] Create `src-tauri/` directory at project root
- [x] Create `src-tauri/Cargo.toml` with project metadata
- [x] Create `src-tauri/build.rs` with tauri-build integration
- [x] Create `src-tauri/src/main.rs` application entry point
- [x] Create `src-tauri/src/lib.rs` library with command handlers
- [x] Create `src-tauri/icons/` directory

### 3. Configure Tauri
- [x] Create `src-tauri/tauri.conf.json` with app configuration
  - [x] Set productName to "FFmpeg Easy"
  - [x] Configure build.frontendDist as "../build/client"
  - [x] Configure build.devUrl as "http://localhost:5173"
  - [x] Set window dimensions (1400x900, min 800x600)
- [x] Copy application icons to `src-tauri/icons/`
  - [x] Copy full icon set from template project
  - [x] Verify all required sizes present

### 4. Implement Test Command
- [x] Add `greet_from_rust` command to `src-tauri/src/lib.rs`
  - [x] Accept `name: &str` parameter
  - [x] Return formatted greeting string
  - [x] Add `#[tauri::command]` attribute
- [x] Register command in Builder invoke_handler
- [x] Verify Cargo.toml has correct crate-type settings

---

## Phase 2: Frontend Integration

### 5. Add Environment Detection
- [x] Add Tauri environment check using `__TAURI_INTERNALS__` global
- [x] Create conditional rendering helper
- [x] Test detection in both browser and desktop contexts

### 6. Create Test Component
- [x] Create `TauriTest` component in `app/routes/settings.tsx`
  - [x] Display environment status (browser vs. Tauri)
  - [x] Add test button to invoke Rust command
  - [x] Display result in toast notification
  - [x] Handle errors gracefully
- [x] Import `invoke` from `@tauri-apps/api/core`
- [x] Integrate component into settings page UI

### 7. Add npm Scripts
- [x] Add `dev:tauri` script: `"tauri dev"`
- [x] Add `build:tauri` script: `"tauri build"`
- [x] Document correct startup sequence in comments

---

## Phase 3: Testing and Validation

### 8. Development Testing
- [x] Test correct startup sequence (Vite first, then Tauri)
- [x] Verify desktop window opens with correct dimensions
- [x] Confirm environment detection shows "✅ Tauri 环境"
- [x] Test `greet_from_rust` command invocation
- [x] Verify toast shows success message
- [x] Check Rust response matches expected format

### 9. Build Testing
- [x] Run first Rust compilation (`pnpm dev:tauri`)
- [x] Verify compilation completes (~40s, 449 packages)
- [x] Test incremental builds are faster
- [x] Verify web build still works (`pnpm build`)
- [x] Check type safety (`pnpm typecheck`)
- [x] Run Biome checks (`pnpm lint`)

### 10. Cross-Environment Testing
- [x] Test web deployment at `localhost:5173`
- [x] Test desktop app launch
- [x] Verify component renders correctly in both environments
- [x] Confirm no regressions in existing functionality

---

## Phase 4: Documentation

### 11. Create Development Guide
- [ ] Document Rust installation requirements
- [ ] Document correct startup sequence
- [ ] Document known issues (environment detection, caching)
- [ ] Add troubleshooting section
- [ ] Create architecture diagram showing dual deployment

### 12. Update Project Documentation
- [ ] Update README.md with desktop installation section
- [ ] Update DEPLOYMENT.md with desktop build instructions
- [ ] Add reference to this proposal in AGENTS.md
- [ ] Create changelog entry for v6.0

### 13. OpenSpec Compliance
- [x] Create proposal.md with complete rationale
- [x] Create tasks.md with implementation checklist
- [x] Create spec delta for desktop integration capability
- [x] Run `openspec validate add-tauri-desktop-support --strict`
- [x] Address any validation errors (none found)
- [x] Create comprehensive summary document (SUMMARY.md)
- [ ] Get approval before archiving

---

## Phase 5: Cleanup and Polish

### 14. Code Quality
- [x] Ensure all TypeScript code passes type checking
- [x] Run Biome and fix any diagnostics
- [x] Remove any debug logging or test code
- [ ] Review and refactor for clarity

### 15. Final Verification
- [x] Complete acceptance test (end-to-end flow)
- [x] Verify all 8 verification criteria met
- [ ] Document any discovered limitations
- [ ] Plan Phase 2 work (native FFmpeg driver)

---

## Notes

### Discovered Issues and Fixes
1. **Missing Icons**: Copied complete icon set from template project
2. **Cargo Version Error**: Changed from `"2"` to `"2.1"` in Cargo.toml
3. **White Screen (504 Error)**: Fixed by starting Vite before Tauri
4. **Environment Detection**: Changed from `__TAURI__` to `__TAURI_INTERNALS__`

### Critical Learnings
- Startup order matters: Vite dev server must run first
- Tauri 2.0 uses different global variable than Tauri 1.x
- First Rust build is slow, but caching makes incremental builds fast
- Desktop and browser are truly separate environments for testing

### Future Work (Not in Phase 1)
- Define `IFFmpegDriver` interface abstraction
- Implement `WasmDriver` (wrapper for current FFmpeg.wasm)
- Implement `NativeDriver` (Rust-based system FFmpeg)
- Hardware acceleration detection and configuration
- Desktop-specific UI features (drag-drop, system tray)
- Distribution and update mechanism
