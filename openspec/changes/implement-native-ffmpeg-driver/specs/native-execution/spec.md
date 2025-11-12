# Native Execution Specification

**Capability**: Native Execution  
**Version**: 1.0.0  
**Status**: Proposed  
**Related**: driver-abstraction, auto-detection

---

## Overview

This specification defines how the application executes FFmpeg natively on desktop systems through the Tauri backend. It covers file I/O, process management, progress parsing, and error handling for native FFmpeg execution.

---

## ADDED Requirements

### Requirement: FFmpeg Availability Detection

The system MUST detect whether FFmpeg is installed and accessible on the host system before attempting native execution.

#### Scenario: FFmpeg Installed and Accessible

**Given** FFmpeg is installed and in system PATH

**When** the native driver checks availability

**Then**
- `ffmpeg_check_availability()` command MUST return `true`
- FFmpeg version MUST be queryable
- Available encoders MUST be listable
- Hardware acceleration support MUST be detectable

**Implementation Example** (Rust):
```rust
#[tauri::command]
pub fn ffmpeg_check_availability() -> bool {
    Command::new("ffmpeg")
        .arg("-version")
        .output()
        .is_ok()
}
```

**Implementation Example** (TypeScript):
```typescript
const isAvailable = await invoke<boolean>('ffmpeg_check_availability');
if (isAvailable) {
  // Proceed with native driver
} else {
  // Fallback to WASM driver
}
```

---

#### Scenario: FFmpeg Not Found

**Given** FFmpeg is not installed or not in PATH

**When** the native driver checks availability

**Then**
- `ffmpeg_check_availability()` MUST return `false`
- The system MUST fallback to WASM driver automatically
- User SHOULD be notified with installation instructions

---

### Requirement: Temporary Workspace Management

The system MUST create isolated temporary workspaces for each FFmpeg execution to prevent file conflicts and ensure proper cleanup.

#### Scenario: Workspace Creation

**Given** a native driver is preparing to execute a command

**When** workspace creation is requested

**Then**
- A unique temporary directory MUST be created
- Directory name MUST be globally unique (e.g., UUID-based)
- Directory MUST have appropriate read/write permissions
- Directory path MUST be returned to caller

**Implementation Example** (Rust):
```rust
use uuid::Uuid;

#[tauri::command]
pub fn ffmpeg_create_temp_workspace() -> Result<String, String> {
    let temp_dir = std::env::temp_dir()
        .join(format!("ffmpeg_easy_{}", Uuid::new_v4()));
    
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create workspace: {}", e))?;
    
    Ok(temp_dir.to_string_lossy().to_string())
}
```

**Implementation Example** (TypeScript):
```typescript
const workspace = await invoke<string>('ffmpeg_create_temp_workspace');
// workspace === "/tmp/ffmpeg_easy_<uuid>"
```

---

#### Scenario: Workspace Cleanup

**Given** FFmpeg execution has completed (success or failure)

**When** cleanup is requested

**Then**
- All files in workspace MUST be deleted
- The workspace directory MUST be removed
- Cleanup MUST succeed even if some files are locked
- Errors SHOULD be logged but not thrown

**Implementation Example** (Rust):
```rust
#[tauri::command]
pub fn ffmpeg_cleanup_workspace(path: String) -> Result<(), String> {
    match fs::remove_dir_all(&path) {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Warning: Cleanup failed for {}: {}", path, e);
            Ok(()) // Don't fail on cleanup errors
        }
    }
}
```

---

### Requirement: File I/O Operations

The system MUST support writing input files to the workspace and reading output files back to JavaScript.

#### Scenario: Write Input File

**Given** a JavaScript File object needs to be provided to FFmpeg

**When** `ffmpeg_write_file()` is called with file data

**Then**
- File MUST be written to specified path in workspace
- File permissions MUST allow FFmpeg to read it
- Large files MUST be handled efficiently (no memory errors)
- Function MUST return success/failure status

**Implementation Example** (Rust):
```rust
#[tauri::command]
pub fn ffmpeg_write_file(path: String, data: Vec<u8>) -> Result<(), String> {
    fs::write(&path, data)
        .map_err(|e| format!("Failed to write file {}: {}", path, e))
}
```

**Implementation Example** (TypeScript):
```typescript
const inputFile: File = ... // User-selected file
const arrayBuffer = await inputFile.arrayBuffer();
const data = Array.from(new Uint8Array(arrayBuffer));

await invoke('ffmpeg_write_file', {
  path: `${workspace}/input.mp4`,
  data: data
});
```

---

#### Scenario: Read Output File

**Given** FFmpeg has produced an output file

**When** `ffmpeg_read_file()` is called with output path

**Then**
- File contents MUST be read into memory
- Data MUST be returned as byte array
- Large files MUST be handled (may require streaming in future)
- File not found MUST result in descriptive error

**Implementation Example** (Rust):
```rust
#[tauri::command]
pub fn ffmpeg_read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path)
        .map_err(|e| format!("Failed to read file {}: {}", path, e))
}
```

**Implementation Example** (TypeScript):
```typescript
const outputData = await invoke<number[]>('ffmpeg_read_file', {
  path: `${workspace}/output.mp4`
});

const blob = new Blob([new Uint8Array(outputData)]);
```

---

### Requirement: FFmpeg Process Execution

The system MUST execute FFmpeg commands as child processes with proper argument handling, output capture, and error reporting.

#### Scenario: Successful FFmpeg Execution

**Given** a valid FFmpeg command with input files in workspace

**When** `ffmpeg_execute()` is called

**Then**
- FFmpeg process MUST be spawned with provided arguments
- Process MUST run in the workspace directory
- Standard output and standard error MUST be captured
- Function MUST wait for process completion
- Exit code 0 MUST result in success
- Execution result MUST contain stdout and stderr

**Implementation Example** (Rust):
```rust
use std::process::{Command, Stdio};

#[derive(serde::Serialize)]
pub struct ExecutionResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[tauri::command]
pub fn ffmpeg_execute(
    work_dir: String,
    args: Vec<String>,
) -> Result<ExecutionResult, String> {
    let output = Command::new("ffmpeg")
        .args(&args)
        .current_dir(&work_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to spawn FFmpeg: {}", e))?;
    
    let exit_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    if !output.status.success() {
        return Err(format!("FFmpeg failed (exit {}): {}", exit_code, stderr));
    }
    
    Ok(ExecutionResult {
        exit_code,
        stdout,
        stderr,
    })
}
```

---

#### Scenario: FFmpeg Execution Error

**Given** an FFmpeg command with invalid parameters

**When** `ffmpeg_execute()` is called

**Then**
- FFmpeg process MUST run and fail
- Non-zero exit code MUST be detected
- Standard error output MUST be captured
- Function MUST return an error with FFmpeg's message
- Error message MUST be parseable for common issues

**Implementation Example** (TypeScript):
```typescript
try {
  await invoke('ffmpeg_execute', {
    workDir: workspace,
    args: ['-i', 'input.mp4', '-c:v', 'invalid_codec', 'output.mp4']
  });
} catch (error) {
  // error contains FFmpeg stderr
  console.error('FFmpeg error:', error);
  // Parse for specific error types
  if (error.includes('Unknown encoder')) {
    // Handle codec not found
  }
}
```

---

### Requirement: Progress Monitoring

The system MUST parse FFmpeg's standard error output to extract progress information and report it to the frontend.

#### Scenario: Progress Parsing During Execution

**Given** FFmpeg is executing a command

**When** FFmpeg outputs progress lines to stderr

**Then**
- Progress lines MUST be detected (e.g., "time=00:01:23.45")
- Timestamp MUST be extracted and parsed
- Progress percentage MUST be calculated (if duration known)
- Progress callbacks MUST be invoked with updates
- Parsing errors MUST NOT abort execution

**Implementation Example** (Rust):
```rust
use regex::Regex;

pub fn parse_progress(stderr_line: &str) -> Option<f64> {
    let re = Regex::new(r"time=(\d{2}):(\d{2}):(\d{2}\.\d{2})").ok()?;
    let caps = re.captures(stderr_line)?;
    
    let hours: f64 = caps.get(1)?.as_str().parse().ok()?;
    let minutes: f64 = caps.get(2)?.as_str().parse().ok()?;
    let seconds: f64 = caps.get(3)?.as_str().parse().ok()?;
    
    Some(hours * 3600.0 + minutes * 60.0 + seconds)
}

#[test]
fn test_parse_progress() {
    let line = "frame= 1234 fps= 45 q=28.0 size=   5120kB time=00:01:23.45 bitrate= 506.2kbits/s speed=1.2x";
    assert_eq!(parse_progress(line), Some(83.45));
}
```

---

#### Scenario: Progress Callback Invocation

**Given** FFmpeg execution with progress monitoring enabled

**When** progress is parsed from stderr

**Then**
- Frontend `onProgress` callback MUST be invoked
- Progress value MUST be between 0 and 100 (if duration known)
- Time value MUST be in seconds
- Callbacks MUST be throttled (e.g., max once per 100ms)

**Note**: Initial implementation may omit progress callbacks; can be added incrementally.

---

### Requirement: Process Abortion

The system MUST support aborting in-progress FFmpeg executions cleanly.

#### Scenario: Abort FFmpeg Process

**Given** an FFmpeg process is running

**When** `ffmpeg_abort()` is called

**Then**
- The FFmpeg process MUST be terminated (SIGTERM then SIGKILL)
- Partial output files MUST be deleted
- Workspace MUST be cleaned up
- Function MUST return quickly (<1 second)
- Subsequent executions MUST work normally

**Implementation Example** (Rust):
```rust
use std::sync::{Arc, Mutex};
use std::process::Child;

pub struct FFmpegExecutor {
    current_process: Arc<Mutex<Option<Child>>>,
}

impl FFmpegExecutor {
    pub fn abort(&self) -> Result<(), String> {
        let mut process = self.current_process.lock().unwrap();
        if let Some(child) = process.as_mut() {
            child.kill().map_err(|e| format!("Failed to kill process: {}", e))?;
            *process = None;
        }
        Ok(())
    }
}
```

---

### Requirement: Hardware Acceleration Detection

The system MUST detect available hardware acceleration options (GPU encoders) and report them in capabilities.

#### Scenario: Detect NVIDIA NVENC

**Given** system has NVIDIA GPU with NVENC support

**When** hardware acceleration detection runs

**Then**
- `h264_nvenc` encoder MUST be detected
- `hevc_nvenc` encoder MUST be detected
- Capability `hardwareAcceleration` MUST be `true`

**Implementation Example** (Rust):
```rust
pub fn detect_hardware_encoders() -> Vec<String> {
    let output = Command::new("ffmpeg")
        .args(&["-encoders"])
        .output();
    
    if let Ok(output) = output {
        let encoders = String::from_utf8_lossy(&output.stdout);
        let mut hw_encoders = Vec::new();
        
        for line in encoders.lines() {
            if line.contains("h264_nvenc") || line.contains("hevc_nvenc") ||
               line.contains("h264_qsv") || line.contains("hevc_qsv") ||
               line.contains("h264_videotoolbox") {
                // Extract encoder name
                if let Some(name) = line.split_whitespace().nth(1) {
                    hw_encoders.push(name.to_string());
                }
            }
        }
        
        hw_encoders
    } else {
        Vec::new()
    }
}
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
- File write operations MUST handle files up to 10GB without memory errors
- Process spawn MUST complete within 500ms
- Cleanup operations MUST complete within 5 seconds

### Security
- Workspace directories MUST have restricted permissions (owner only)
- File paths MUST be validated to prevent directory traversal
- FFmpeg arguments MUST be validated (no shell injection)

### Reliability
- Process abortion MUST always clean up resources
- Failed cleanups MUST be logged but not throw errors
- System MUST recover from FFmpeg crashes

### Platform Support
- MUST work on macOS (Homebrew FFmpeg)
- MUST work on Windows (Chocolatey / manual install)
- MUST work on Linux (apt / dnf / pacman)

---

## Dependencies

This specification depends on:
- **External**: System FFmpeg installation, Tauri file system APIs
- **Internal**: driver-abstraction (IFFmpegDriver interface)

This specification is depended on by:
- **auto-detection**: Uses availability check

---

## Error Scenarios

### FFmpeg Not in PATH
**Error**: "FFmpeg executable not found"  
**Recovery**: Fallback to WASM driver  
**User Action**: Install FFmpeg and restart

### Insufficient Disk Space
**Error**: "No space left on device"  
**Recovery**: Cleanup workspace, report to user  
**User Action**: Free disk space and retry

### File Permission Error
**Error**: "Permission denied"  
**Recovery**: Try alternative temp directory  
**User Action**: Check file/directory permissions

### FFmpeg Crash
**Error**: "Process terminated unexpectedly"  
**Recovery**: Cleanup workspace, log crash info  
**User Action**: Report bug with system info

---

## Testing Requirements

### Unit Tests (Rust)
- [ ] Test FFmpeg availability detection
- [ ] Test workspace creation and cleanup
- [ ] Test file write and read operations
- [ ] Test progress parsing with various formats
- [ ] Test error message extraction

### Integration Tests
- [ ] Test complete execution flow (write → execute → read)
- [ ] Test abortion during execution
- [ ] Test with various file sizes (1MB, 100MB, 1GB)
- [ ] Test with various codecs and formats

### Platform Tests
- [ ] Test on macOS (Intel and Apple Silicon)
- [ ] Test on Windows 10/11
- [ ] Test on Ubuntu, Fedora, Arch Linux

---

## Migration Notes

This is a new capability; no migration required.

Native execution will be opt-in through auto-detection or user preference.

---

## Open Issues

1. **Streaming Large Files**: Current approach loads entire files into memory
2. **Progress Events**: How to emit real-time progress from Rust to TypeScript
3. **Concurrent Executions**: Should we limit concurrent native executions?
4. **FFmpeg Version**: Minimum required FFmpeg version?

---

## References

- [Tauri Command System](https://tauri.app/v2/guides/features/command/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Rust std::process](https://doc.rust-lang.org/std/process/)
