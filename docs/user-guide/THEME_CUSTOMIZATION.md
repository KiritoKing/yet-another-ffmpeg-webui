# Theme Customization Guide

## Overview
FFmpeg Easy supports light and dark themes with smooth transitions. The theme system respects your system preferences by default and remembers your choice across sessions.

## Theme Modes

### Light Mode
- Clean, bright interface optimized for well-lit environments
- High contrast for excellent readability
- Default mode for most users

### Dark Mode
- Reduces eye strain in low-light conditions
- OLED-friendly dark backgrounds
- Optimized color palette for dark environments

### System Mode (Default)
- Automatically follows your operating system's theme preference
- Switches between light and dark based on system settings
- Best for users who change themes throughout the day

## How to Switch Themes

### Desktop
1. **Quick Toggle**: Click the theme icon in the top-right toolbar
   - ☀️ Sun icon = Light mode is active
   - 🌙 Moon icon = Dark mode is active
   - 💻 Monitor icon = System mode is active

2. **Settings Dialog**: 
   - Click "Settings" in the toolbar
   - Find the "Theme" section
   - Select your preferred mode from the dropdown

### Mobile
1. **Mobile Menu**: 
   - Tap the hamburger menu (☰) in the top-left
   - Tap the theme toggle icon at the bottom status bar
   - Or navigate to Settings page from the menu

2. **Settings Page**:
   - Open mobile menu → Settings
   - Theme section shows current mode
   - Tap to cycle through modes

## Theme Persistence
Your theme choice is automatically saved to your browser's local storage and will be remembered on your next visit.

## System Theme Detection
If you select "System" mode, the app will automatically detect your operating system's theme preference:

- **macOS**: Follows System Preferences → General → Appearance
- **Windows**: Follows Settings → Personalization → Colors → Choose your mode
- **iOS/Android**: Follows system-wide dark mode settings
- **Linux**: Follows desktop environment theme settings

## Smooth Transitions
Theme changes use smooth CSS transitions to avoid jarring flashes. All UI elements transition together over 150ms for a polished experience.

## Accessibility
- Both themes meet WCAG AA contrast ratio requirements
- Screen readers announce theme changes
- Keyboard accessible: Use Tab to focus theme toggle, Enter/Space to activate
- No hover-dependent functionality

## Technical Details

### CSS Variables
The theme system uses CSS custom properties for colors:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... more variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... more variables */
}
```

### FOUC Prevention
An inline script in the page `<head>` ensures the correct theme is applied before the page renders, preventing any flash of unstyled content.

### Browser Support
- Chrome/Edge 88+
- Firefox 89+
- Safari 14+
- All modern mobile browsers

## Troubleshooting

### Theme not persisting across sessions
- Check if your browser allows local storage
- Ensure cookies/site data are not cleared on exit
- Try a different browser to rule out extension conflicts

### Theme not matching system preference
- Verify your OS theme is correctly set
- Try refreshing the page
- Manually select "System" mode again

### Smooth transitions not working
- Check if browser has "Reduce motion" enabled
- Try disabling hardware acceleration
- Update to the latest browser version

## Best Practices
- Use "System" mode for automatic day/night theme switching
- Switch to "Dark" mode when working in low-light environments
- Use "Light" mode for presentations or screenshots
- Remember that both themes are carefully optimized - use whichever is most comfortable

## Related Documentation
- [Mobile Usage Guide](./MOBILE_USAGE.md) - Mobile-specific features
- [Component Guide](../dev-guide/COMPONENT_GUIDE.md) - Developer documentation for theme implementation
