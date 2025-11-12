# User Guide

Welcome to the FFmpeg Easy User Guide! This section contains documentation for end users.

## Getting Started

- [FFmpeg Web Interface](./FFMPEG_WEB.md) - Main application features and usage
- [Custom Forms](./CUSTOM_FORMS.md) - How to create and use custom form presets
- [Theme Customization](./THEME_CUSTOMIZATION.md) - Light/dark mode and system theme support
- [Mobile Usage](./MOBILE_USAGE.md) - Complete guide for mobile devices

## Features

### Command Presets
Learn how to use built-in command presets for common video operations:
- Format conversion
- Video processing
- Audio extraction
- And more!

### Custom Commands
Create your own command presets with:
- Dynamic parameters
- Custom forms
- Import/Export functionality

### Batch Processing
Process multiple files at once:
- Queue management
- Concurrent execution
- Progress tracking

### CDN Configuration
Optimize FFmpeg loading for your region:
- Choose from multiple CDN providers
- Auto-select fastest CDN
- Custom CDN support

## Tips & Tricks

### Performance
- Use "Copy Stream" mode for fastest processing (no re-encoding)
- Enable multi-thread mode if supported
- Limit file sizes for browser-based processing
- Use appropriate quality settings

### File Naming
- Avoid special characters in filenames
- System automatically sanitizes filenames
- Supports batch filename handling

### Error Recovery
- Check logs for detailed error information
- Verify file formats are supported
- Ensure sufficient browser memory
- Try single-thread mode if multi-thread fails

## FAQ

**Q: Why is processing slow?**
A: Browser-based video processing is CPU-intensive. Use simpler operations (like copy mode) for better performance, or reduce video resolution.

**Q: What file formats are supported?**
A: FFmpeg supports most common formats, but WASM version has some limitations. VP9, H.264, AAC, and MP3 are well-supported.

**Q: Can I use this offline?**
A: Yes, once FFmpeg loads, all processing happens in your browser. You can optionally configure local CDN resources.

**Q: Is my data safe?**
A: Yes! All processing happens entirely in your browser. No files are uploaded to any server.

## Support

If you encounter issues:
1. Check the logs for error messages
2. Try reloading FFmpeg
3. Verify your file size is reasonable (&lt;500MB recommended)
4. Check browser console for detailed errors

## Contributing

Found a bug or have a suggestion? Please open an issue on GitHub!
