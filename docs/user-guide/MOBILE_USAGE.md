# Mobile Usage Guide

## Overview
FFmpeg Easy is fully optimized for mobile devices, providing a seamless video processing experience on phones and tablets. All features available on desktop work great on mobile too.

## Mobile-Specific Features

### Responsive Layout
- **Automatic Adaptation**: UI automatically adjusts to your screen size
- **Touch-Optimized**: All buttons and controls are sized for easy tapping (minimum 44x44px)
- **Optimized Typography**: Font sizes scale appropriately for mobile readability
- **No Horizontal Scrolling**: Content fits perfectly on any screen width (320px+)

### Mobile Navigation
The mobile interface uses a streamlined navigation system:

1. **Top Header** (Always Visible)
   - Hamburger menu button (☰) - Opens navigation
   - App title - "FFmpeg Easy"
   - Theme toggle - Quick access to theme switching

2. **Navigation Menu** (Slide-out)
   - Swipes in from the left
   - Quick links to main features
   - Settings access
   - Status information at bottom

3. **Status Bar** (Bottom of Navigation)
   - FFmpeg runtime mode indicator
   - CDN provider and version info
   - Quick settings button

### Mobile Settings Page
Dedicated mobile settings page with flat, scrollable layout:

- **Access**: Menu → Settings
- **Sections**:
  - 通用设置 (General Settings)
  - 性能设置 (Performance Settings)
  - 存储管理 (Storage Management)
  - CDN 配置 (CDN Configuration)
  - 关于 (About)

All settings are organized in collapsible cards for easy navigation.

## Using FFmpeg on Mobile

### Loading FFmpeg
1. Open the app
2. Choose your runtime mode:
   - **Multi-thread**: Best performance (requires SharedArrayBuffer support)
   - **Single-thread**: Better compatibility, slightly slower
3. Wait for initialization (usually 5-10 seconds)
4. Start processing!

**Tip**: Save your preferred mode in settings to skip this dialog next time.

### Uploading Files
1. **Single File**:
   - Tap the file input in the execution panel
   - Select video from your device
   - File is loaded into browser memory

2. **Multiple Files** (Batch Processing):
   - Tap "批量上传" (Batch Upload) button
   - Select multiple files from your device
   - All files are queued for processing

**Important**: Files are processed entirely in your browser - they never leave your device!

### Processing Videos
1. Select a command preset from the list
2. Upload your video file
3. Adjust any custom parameters (if using custom forms)
4. Tap the execute button
5. Monitor progress in real-time
6. Download processed file when complete

### Batch Processing
1. Upload multiple files
2. Select a command preset
3. Configure queue settings:
   - **Concurrency**: Number of simultaneous tasks (recommend 1 on mobile)
   - **Auto-start**: Automatically begin processing
4. Start queue and monitor progress
5. Download individual results from queue panel

### Viewing Logs
- Logs are displayed below the execution panel
- Tap log type badges to filter (All / Errors / Warnings)
- Use search box to find specific messages
- Logs auto-scroll as new messages appear
- Manually scroll up to review history

## Mobile Performance Tips

### Recommended Settings
- **Runtime Mode**: Single-thread (more stable on mobile)
- **Queue Concurrency**: 1 (prevents memory issues)
- **File Size**: Keep under 100MB for best performance
- **Preset**: Use fast presets like "ultrafast" for encoding

### Battery Optimization
Video processing is CPU-intensive. To preserve battery:
- Process smaller files when on battery
- Use `-c copy` mode (no re-encoding) when possible
- Keep device plugged in for large jobs
- Close other apps to free up resources

### Storage Management
- Processed files are downloaded to your device
- Clear task history regularly: Settings → Storage Management → Clear History
- Monitor storage usage in the Storage Management section

## Touch Interactions

### Gestures
- **Tap**: Select items, activate buttons
- **Press and hold**: Show additional options (where supported)
- **Swipe**: Scroll through lists and logs
- **Pinch**: Not supported (intentionally disabled to prevent accidental zoom)

### Touch Targets
All interactive elements meet accessibility guidelines:
- Minimum size: 44x44 pixels
- Adequate spacing: 8px between targets
- Visual feedback on tap
- No accidental double-tap zoom

## Troubleshooting

### Can't load FFmpeg
- **Check browser support**: Safari 14+, Chrome 88+, Firefox 89+
- **Try single-thread mode**: More compatible than multi-thread
- **Check internet connection**: Required for initial WASM file download
- **Clear browser cache**: May resolve loading issues

### Processing is slow
- **Use single-thread mode**: Multi-thread may not work on all devices
- **Reduce concurrency**: Set to 1 in queue settings
- **Close other apps**: Free up device resources
- **Try a simpler preset**: Use "ultrafast" or copy mode
- **Process smaller files**: Large files strain mobile hardware

### App is laggy
- **Clear task history**: Settings → Storage → Clear History
- **Restart browser**: Refresh the page
- **Update browser**: Ensure latest version
- **Free up RAM**: Close other tabs and apps

### File upload not working
- **Check file size**: Very large files (>500MB) may fail
- **Try different browser**: Some mobile browsers have limitations
- **Check storage space**: Ensure device has free space
- **Restart app**: Refresh page and try again

### Can't download result
- **Check permissions**: Allow downloads in browser settings
- **Check storage space**: Ensure device has adequate free space
- **Try different browser**: Some browsers handle downloads differently
- **Use "Share" instead**: Long-press file to access share options

## Supported Devices

### Minimum Requirements
- **Screen**: 320px width or larger
- **Browser**: Safari 14+ / Chrome 88+ / Firefox 89+
- **RAM**: 2GB+ recommended
- **Storage**: 100MB+ free space for WASM files

### Tested Devices
- ✅ iPhone SE (2020) and newer
- ✅ iPhone 14 Pro / 15 Pro
- ✅ iPad (8th gen) and newer
- ✅ Samsung Galaxy S21 and newer
- ✅ Google Pixel 6 and newer
- ✅ OnePlus 9 and newer

## Best Practices

### For Best Experience
1. Use Wi-Fi for initial load (downloads ~20MB WASM files)
2. Keep device charged during long processing jobs
3. Use single-thread mode for stability
4. Process one file at a time on older devices
5. Clear history regularly to maintain performance
6. Close background apps before heavy processing

### Security & Privacy
- All processing happens in your browser
- Files never uploaded to any server
- No data collection or tracking
- Your videos stay on your device
- Safe to process private/sensitive content

## Keyboard Support (Bluetooth Keyboards)
If you use a Bluetooth keyboard with your mobile device:
- **Tab**: Navigate between controls
- **Enter/Space**: Activate buttons
- **Escape**: Close dialogs and menus
- **Arrow keys**: Navigate lists

## Accessibility

### Screen Readers
- Full VoiceOver (iOS) support
- TalkBack (Android) support
- All controls properly labeled
- Status announcements for key actions

### Visual Accessibility
- High contrast in both light and dark themes
- Scalable text (supports 200% zoom)
- No color-only information
- Clear focus indicators

### Motor Accessibility
- Large touch targets (44x44px minimum)
- Adequate spacing between controls
- No time-limited interactions
- Single-tap for all actions

## Related Documentation
- [Theme Customization Guide](./THEME_CUSTOMIZATION.md) - Theme system details
- [FFmpeg Web Guide](./FFMPEG_WEB.md) - Complete feature documentation
- [Custom Forms Guide](./CUSTOM_FORMS.md) - Creating custom command presets
