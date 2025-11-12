# Proposal: Add Theme System and Mobile UI Support

## Change-ID
`add-theme-and-mobile-ui`

## Status
Proposed

## Owner
Development Team

## Created
2025-01-11

## Summary
Add comprehensive theme switching (light/dark mode) and mobile-responsive UI support to improve user experience across different devices and user preferences.

## Motivation
Currently, `ffmpeg-easy` lacks:
1. **Dark mode support**: Users working in low-light environments or preferring dark themes cannot customize the UI appearance.
2. **Mobile responsiveness**: The UI is primarily designed for desktop, making it difficult to use on mobile devices with smaller screens.
3. **Theme persistence**: No mechanism to save user theme preferences across sessions.
4. **Mobile feature parity**: Mobile navigation menu lacks key information displayed in desktop toolbar (runtime mode, CDN status).

These limitations reduce accessibility and usability for a significant portion of users:
- Users on mobile devices (phones/tablets) have poor experience with desktop-oriented layouts
- Users preferring dark mode have to deal with bright white backgrounds
- Users expect modern web apps to respect system theme preferences
- Mobile users cannot easily access runtime information and settings that are visible on desktop

## Goals
1. **Theme System**:
   - Implement light/dark mode switching with smooth transitions
   - Respect system theme preference by default (`prefers-color-scheme`)
   - Persist user's theme choice in localStorage
   - Provide a theme toggle component in the UI
   - Ensure all components support both themes with proper contrast

2. **Mobile UI Compatibility**:
   - Make all pages responsive for mobile devices (320px to 768px width)
   - Optimize touch interactions and tap targets (min 44x44px)
   - Implement mobile-friendly navigation (collapsible menus, bottom sheets)
   - Create dedicated mobile settings page with flat layout (separate route)
   - Display runtime status in mobile navigation (FFmpeg mode, CDN info)
   - Provide quick access to settings from mobile menu
   - Ensure FFmpeg controls and command editor work on small screens
   - Optimize progress displays and log viewers for mobile viewports

3. **User Experience**:
   - Smooth theme transitions without jarring flashes
   - Consistent theme application across all components
   - Accessible theme toggle (keyboard navigation, ARIA labels)
   - Mobile-first approach for new components

## Non-Goals
- Multiple color themes beyond light/dark (e.g., blue, red themes)
- Native mobile app development
- Offline-first mobile PWA features (out of scope for this change)
- Tablet-specific optimizations (will be covered by responsive breakpoints)

## Scope
### In Scope
- Theme store with Zustand for theme state management
- Theme toggle component with icon indicator
- CSS variables update for dark mode support
- Mobile breakpoint styles for all existing components
- Touch-friendly UI adjustments
- Mobile settings page as a dedicated route (`/settings`)
- Flat settings layout optimized for mobile scrolling
- Theme preference persistence in localStorage
- System theme detection and auto-switching
- Documentation for theme system usage

### Out of Scope
- Custom theme builder/editor
- Per-component theme overrides
- Theme animation customizations
- Mobile gesture libraries (swipe, pinch-to-zoom)
- Native app shells or hybrid frameworks

## Dependencies
- **Existing**: TailwindCSS v4 with dark mode variant support
- **Existing**: shadcn/ui components (already support dark mode via CSS variables)
- **Existing**: Zustand for state management
- **New**: `next-themes` or custom theme provider (to be decided in design phase)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Flash of unstyled content (FOUC) on theme switch | Medium | Use class-based dark mode with script in `<head>` to set theme before render |
| Performance impact from CSS variable updates | Low | Use CSS transitions and `requestAnimationFrame` for smooth updates |
| Mobile layout breaks existing functionality | High | Comprehensive testing on real devices, progressive enhancement approach |
| Third-party components don't support dark mode | Medium | Wrap with theme-aware containers, add custom dark mode overrides |
| localStorage unavailable in some contexts | Low | Graceful fallback to system preference only |

## Success Criteria
1. **Theme System**:
   - User can toggle between light and dark modes from any page
   - Theme preference persists across browser sessions
   - System theme preference is respected on first visit
   - All UI components render correctly in both themes with proper contrast ratios (WCAG AA)
   - No FOUC or theme flashing during page load or theme switch

2. **Mobile UI**:
   - All pages are usable on devices with 320px minimum width
   - Touch targets meet minimum size requirements (44x44px)
   - Text remains readable without zooming on mobile devices
   - Mobile navigation displays runtime status (FFmpeg mode, CDN provider, version)
   - Dedicated mobile settings page with flat, scrollable layout
   - Settings accessible from mobile menu via route navigation
   - FFmpeg execution and progress monitoring work seamlessly on mobile
   - Command editor and preset management are usable on small screens

3. **Technical**:
   - Type-safe theme state management
   - Zero type errors and Biome lint passes
   - Lighthouse accessibility score remains above 90
   - No performance regressions (< 5% increase in bundle size)

## Related Changes
- Future: Add high-contrast theme option
- Future: Support custom color accent selection
- Future: Add theme preview in settings

## References
- [TailwindCSS Dark Mode Guide](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Mobile Web Best Practices](https://www.w3.org/TR/mobile-bp/)
