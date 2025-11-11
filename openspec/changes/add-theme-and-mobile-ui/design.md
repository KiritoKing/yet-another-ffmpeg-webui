# Design: Theme System and Mobile UI

## Overview
This document describes the technical architecture and implementation approach for adding theme switching (light/dark mode) and mobile-responsive UI to `ffmpeg-easy`.

## Architecture Decisions

### Theme System Architecture

#### State Management
**Decision**: Use Zustand for theme state management, following the existing pattern.

**Rationale**:
- Consistent with current architecture (command, task, cdn, log stores all use Zustand)
- Lightweight and performant
- Easy to integrate with React components
- No additional dependencies needed

**Store Structure**:
```typescript
// app/store/theme/types.ts
export interface ThemeStore {
  // State
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  isClient: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}
```

#### Theme Persistence
**Decision**: Use localStorage with inline script for FOUC prevention.

**Rationale**:
- localStorage is widely supported and synchronous
- Inline script in `<head>` ensures theme is applied before first paint
- No server-side rendering complications (CSR-only app)
- Storage events enable cross-tab synchronization

**Implementation**:
```typescript
// app/store/theme/index.ts
const STORAGE_KEY = 'ffmpeg-easy-theme';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',
  isClient: false,
  
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
      const resolved = resolveTheme(theme);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      set({ theme, resolvedTheme: resolved });
    }
  },
  
  // ... other actions
}));
```

#### FOUC Prevention
**Decision**: Inject inline script in `root.tsx` Layout component.

**Rationale**:
- Executes before React hydration
- Prevents flash of wrong theme
- Minimal performance impact (< 1KB inline JS)

**Implementation**:
```tsx
// app/root.tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <Meta />
        <Links />
        {/* Theme initialization script - prevents FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('ffmpeg-easy-theme');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = theme === 'dark' || 
                    (theme === 'system' && systemDark) || 
                    (!theme && systemDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Mobile UI Architecture

#### Responsive Strategy
**Decision**: Mobile-first design with progressive enhancement.

**Rationale**:
- Better performance on mobile (default styles are smaller)
- Easier to maintain (add features for larger screens)
- Aligns with modern web development best practices
- TailwindCSS v4 supports this approach naturally

**Breakpoint Usage**:
- Default (no prefix): 320px - 639px (mobile)
- `sm:`: 640px+ (large phones, small tablets)
- `md:`: 768px+ (tablets)
- `lg:`: 1024px+ (laptops, desktops)

#### Component Adaptation Patterns

**Pattern 1: Stack to Row**
```tsx
// Mobile: vertical stack, Desktop: horizontal row
<div className="flex flex-col lg:flex-row gap-4">
  <CommandPanel className="w-full lg:w-1/2" />
  <ExecutionPanel className="w-full lg:w-1/2" />
</div>
```

**Pattern 2: Hide/Show Elements**
```tsx
// Mobile menu button (hidden on desktop)
<Button className="lg:hidden" onClick={toggleMenu}>
  <Menu />
</Button>

// Desktop navigation (hidden on mobile)
<nav className="hidden lg:flex gap-4">
  {/* Nav items */}
</nav>
```

**Pattern 3: Responsive Typography**
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  FFmpeg Easy
</h1>
```

#### Touch Optimization
**Decision**: Use CSS `touch-action` and minimum sizes for touch targets.

**Implementation**:
```tsx
// Touch-friendly button component
<Button className="min-w-11 min-h-11 touch-manipulation">
  <Icon className="w-5 h-5" />
</Button>
```

**Rationale**:
- `touch-manipulation` disables double-tap zoom on iOS
- 44x44px (11 * 4px = 44px in Tailwind) meets accessibility guidelines
- Adequate spacing prevents accidental taps

## Component Design

### ThemeToggle Component

**Location**: `app/components/ThemeToggle.tsx`

**Design**:
```tsx
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { useThemeStore } from '~/store/theme';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  
  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };
  
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const label = `Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`;
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className="min-w-11 min-h-11"
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
}
```

**Integration Points**:
- Add to `FFmpegToolbar` component (top right)
- Add to mobile menu (Settings section)
- Ensure visible on all pages

### Mobile Navigation Component

**Location**: `app/components/MobileNav.tsx`

**Design**:
```tsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-6 h-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        {/* Navigation items */}
      </SheetContent>
    </Sheet>
  );
}
```

**Rationale**:
- Uses shadcn/ui Sheet component (already available)
- Slides in from left (common pattern)
- Closes automatically on navigation
- Supports keyboard navigation

### Responsive Layout Wrapper

**Location**: Update `app/routes/ffmpeg-web.tsx`

**Changes**:
```tsx
export default function FFmpegWeb() {
  // ... existing logic
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <MobileNav />
          <h1 className="text-lg font-semibold">FFmpeg Easy</h1>
          <ThemeToggle />
        </div>
      </header>
      
      {/* Main content */}
      <div className="container mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Command panel - full width on mobile, 1/2 on desktop */}
          <div className="w-full lg:w-1/2">
            <CommandPanel />
          </div>
          
          {/* Execution panel - full width on mobile, 1/2 on desktop */}
          <div className="w-full lg:w-1/2">
            <ExecutionPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## CSS and Styling

### Dark Mode Variables
**Location**: `app/app.css`

**Additions** (already partially implemented):
```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... existing light theme variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... existing dark theme variables */
}

/* Add smooth transitions */
* {
  transition: background-color 150ms ease-in-out, 
              border-color 150ms ease-in-out,
              color 150ms ease-in-out;
}
```

### Mobile-Specific Styles
```css
/* Touch optimization */
@media (hover: none) and (pointer: coarse) {
  /* Mobile/touch devices */
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Prevent text size adjustment on iOS */
html {
  -webkit-text-size-adjust: 100%;
}

/* Smooth scrolling on mobile */
* {
  -webkit-overflow-scrolling: touch;
}
```

## Integration with Existing Systems

### EventSystem Integration
Emit theme change events for other components to respond:

```typescript
// app/store/theme/index.ts
import { eventBus } from '~/services/events/eventBus';

setTheme: (theme) => {
  // ... existing logic
  eventBus.emit('theme-changed', { theme, resolvedTheme });
}
```

### Driver.js Onboarding Updates
Update onboarding tour to include theme toggle:

```typescript
// app/services/driver/index.ts
export const tourSteps = [
  // ... existing steps
  {
    element: '#theme-toggle',
    popover: {
      title: '主题切换',
      description: '点击切换亮色/暗色/系统模式',
      position: 'bottom'
    }
  }
];
```

## Testing Strategy

### Theme System Testing
1. **Manual Tests**:
   - Toggle theme and verify UI updates
   - Refresh page and verify theme persists
   - Open in new tab and verify sync
   - Test with localStorage disabled
   - Test system theme change detection

2. **Visual Tests**:
   - Check all components in both themes
   - Verify contrast ratios (use browser DevTools)
   - Test FOUC prevention (hard refresh)

### Mobile UI Testing
1. **Device Testing**:
   - iPhone SE (320px)
   - iPhone 14 Pro (393px)
   - iPad (768px)
   - Android phones (various sizes)

2. **Interaction Tests**:
   - Tap all buttons and verify touch feedback
   - Test scrolling in log viewer
   - Upload files on mobile
   - Test keyboard with form inputs
   - Verify menu navigation

3. **Performance Tests**:
   - Chrome DevTools Mobile throttling (slow 3G)
   - CPU throttling (4x slowdown)
   - Monitor frame rate during scrolling

## Migration Path

### Phase 1: Theme System (2-3 days)
1. Create theme store and types
2. Add ThemeToggle component
3. Add FOUC prevention script
4. Test theme switching and persistence
5. Update documentation

### Phase 2: Mobile Layout (3-4 days)
1. Add responsive breakpoints to main layout
2. Create MobileNav component
3. Update CommandPanel for mobile
4. Update ExecutionPanel for mobile
5. Test on real devices

### Phase 3: Polish and Optimization (1-2 days)
1. Add smooth transitions
2. Optimize touch interactions
3. Fix edge cases
4. Performance testing
5. Accessibility audit

## Performance Considerations

### Bundle Size Impact
- Theme store: ~1KB (gzipped)
- ThemeToggle component: ~0.5KB (gzipped)
- Mobile components: ~2KB (gzipped)
- **Total**: ~3.5KB additional bundle size
- **Acceptable**: < 5% increase (current ~500KB total)

### Runtime Performance
- Theme toggle: < 16ms (one frame at 60fps)
- localStorage read/write: < 1ms
- CSS variable updates: Hardware-accelerated
- Mobile layout shifts: Use `content-visibility` for optimization

### Memory Usage
- Theme store: Negligible (< 1KB in memory)
- Mobile components: Lazy-loaded on demand
- No memory leaks from event listeners (cleanup on unmount)

## Security Considerations

### localStorage Security
- Theme preference is not sensitive data
- No XSS risk (stored value is validated before use)
- Graceful fallback if localStorage is blocked

### CSP Compliance
- Inline script uses `dangerouslySetInnerHTML` (acceptable for theme init)
- No `eval()` or dynamic code execution
- All scripts are static and auditable

## Accessibility

### Theme System
- Theme toggle has proper ARIA labels
- Keyboard accessible (Tab + Enter/Space)
- Screen reader announces theme changes (via ARIA live region)
- Focus visible on toggle button

### Mobile UI
- Touch targets meet WCAG 2.2 minimum size (44x44px)
- Sufficient color contrast in both themes (WCAG AA)
- Logical focus order on mobile
- No hover-dependent functionality
- Support for 200% zoom without loss of functionality

## Future Enhancements

### Short-term (Next Release)
- Add theme preview in settings
- Animated theme transition (optional)
- Remember scroll position on mobile navigation

### Long-term (Future Releases)
- High-contrast theme option
- Custom color accent selection
- Per-component theme overrides
- Tablet-specific optimizations (landscape mode)
- PWA features (install prompt, offline support)

## References
- [TailwindCSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Mobile Web Best Practices](https://www.w3.org/TR/mobile-bp/)
- [Touch Target Sizes](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
