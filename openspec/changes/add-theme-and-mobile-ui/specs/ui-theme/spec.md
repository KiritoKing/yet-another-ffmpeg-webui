# Spec: UI Theme System

## Overview
Defines the theme system for `ffmpeg-easy`, enabling users to switch between light and dark modes with persistent preferences.

## ADDED Requirements

### Requirement: Theme State Management
**ID**: `ui-theme-001`  
**Priority**: High

The application SHALL provide a centralized theme store using Zustand that manages:
- Current theme mode: `"light"`, `"dark"`, or `"system"`
- Theme initialization from localStorage or system preference
- Theme update methods with persistence
- Theme change event notifications

#### Scenario: User toggles theme manually
**Given** the user is on any page  
**When** the user clicks the theme toggle button  
**Then** the theme should switch from light to dark or vice versa  
**And** the new theme preference should be saved to localStorage  
**And** all UI components should re-render with the new theme  
**And** the transition should be smooth without flickering

#### Scenario: System theme preference is respected
**Given** the user has no saved theme preference  
**And** the user's OS is set to dark mode  
**When** the user visits the application for the first time  
**Then** the application should automatically use dark theme  
**And** the theme mode should be set to "system"

#### Scenario: Saved theme preference is loaded
**Given** the user has previously selected dark theme  
**And** the preference is saved in localStorage  
**When** the user returns to the application  
**Then** the application should load the dark theme immediately  
**And** no flash of light theme should occur during page load

---

### Requirement: Theme Toggle Component
**ID**: `ui-theme-002`  
**Priority**: High

The application SHALL provide a theme toggle component that:
- Displays current theme state with appropriate icon (sun for light, moon for dark)
- Is accessible via keyboard navigation (Tab, Enter/Space to activate)
- Includes proper ARIA labels for screen readers
- Is positioned consistently across all pages
- Supports three-state toggling: light → dark → system → light

#### Scenario: User activates theme toggle with keyboard
**Given** the user is navigating with keyboard  
**When** the user tabs to the theme toggle button  
**And** presses Enter or Space  
**Then** the theme should toggle to the next state  
**And** the button should announce the new theme via ARIA live region

#### Scenario: Theme toggle shows current state
**Given** the application is in dark mode  
**When** the user views the theme toggle button  
**Then** it should display a sun icon (indicating "switch to light")  
**And** include tooltip text "Switch to light mode"

---

### Requirement: Dark Mode CSS Support
**ID**: `ui-theme-003`  
**Priority**: High

The application SHALL provide complete dark mode styling that:
- Uses CSS variables for all theme-dependent colors
- Maintains WCAG AA contrast ratios in both themes (minimum 4.5:1 for text)
- Applies dark mode via `.dark` class on `<html>` element
- Includes smooth transitions for color changes (max 200ms)
- Covers all existing components (buttons, cards, inputs, dialogs, etc.)

#### Scenario: All components render correctly in dark mode
**Given** the user switches to dark mode  
**When** the user navigates through all pages and opens all dialogs  
**Then** all text should be readable with sufficient contrast  
**And** all interactive elements should be clearly visible  
**And** no white backgrounds or black text on dark backgrounds should appear

#### Scenario: Theme colors transition smoothly
**Given** the user is viewing a page with multiple components  
**When** the user toggles the theme  
**Then** color transitions should complete within 200ms  
**And** no jarring flashes or color mismatches should occur  
**And** the transition should feel natural and polished

---

### Requirement: Theme Persistence
**ID**: `ui-theme-004`  
**Priority**: Medium

The application SHALL persist theme preferences that:
- Saves theme choice to localStorage under key `ffmpeg-easy-theme`
- Loads theme before first render to prevent FOUC
- Handles localStorage errors gracefully (fallback to system preference)
- Syncs theme across browser tabs (via storage event listener)

#### Scenario: Theme persists across sessions
**Given** the user selects dark theme  
**And** closes the browser  
**When** the user returns and opens the application  
**Then** dark theme should be active immediately  
**And** no light theme flash should occur

#### Scenario: Theme syncs across tabs
**Given** the user has the application open in two tabs  
**When** the user changes theme in tab A  
**Then** tab B should update to match the new theme within 100ms  
**And** both tabs should show the same theme state

#### Scenario: localStorage unavailable fallback
**Given** localStorage is blocked or unavailable (privacy mode)  
**When** the user toggles the theme  
**Then** the theme should still change for the current session  
**And** a console warning should be logged about persistence failure  
**And** the app should fallback to system preference on refresh

---

### Requirement: System Theme Detection
**ID**: `ui-theme-005`  
**Priority**: Medium

The application SHALL detect and respond to system theme changes:
- Listen to `prefers-color-scheme` media query changes
- Update theme automatically when system theme changes (only if mode is "system")
- Provide an option to disable automatic system theme following

#### Scenario: System theme change is detected
**Given** the user has theme mode set to "system"  
**And** the user's OS is in light mode  
**When** the user switches their OS to dark mode  
**Then** the application should automatically switch to dark theme  
**And** the change should happen within 500ms

#### Scenario: Manual theme overrides system preference
**Given** the user has explicitly selected light theme  
**And** the user's OS switches to dark mode  
**When** the system theme change event fires  
**Then** the application should remain in light theme  
**And** the system change should be ignored

---

## Technical Notes

### Store Structure
```typescript
interface ThemeStore {
  // State
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark'; // Computed from theme + system preference
  isClient: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}
```

### CSS Variables
All theme colors should be defined as CSS custom properties in `:root` and `.dark` selectors, following the existing pattern in `app.css`.

### Component Integration
Components should use Tailwind's `dark:` variant for theme-specific styles:
```tsx
<div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
```

### FOUC Prevention
Inject inline script in `<head>` to read localStorage and set `.dark` class before render:
```html
<script>
  (function() {
    const theme = localStorage.getItem('ffmpeg-easy-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

### Dependencies
- Existing TailwindCSS v4 dark mode support
- Zustand for theme store
- No additional npm packages required (custom implementation preferred)
