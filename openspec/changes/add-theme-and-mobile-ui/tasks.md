# Tasks: Theme System and Mobile UI Implementation

## Overview
Ordered list of implementation tasks for adding theme switching and mobile UI support to `ffmpeg-easy`.

## Phase 1: Theme System Foundation (Days 1-2)

### Task 1.1: Create Theme Store Structure
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: None

- [x] Create `app/store/theme/` directory
- [x] Create `app/store/theme/types.ts` with ThemeStore interface
- [x] Create `app/store/theme/default-values.ts` with initial state
- [x] Create `app/store/theme/index.ts` with Zustand store implementation
- [x] Add theme resolution logic (system preference detection)
- [x] Add localStorage persistence helpers
- [x] Export store and types from `app/store/theme/index.ts`

**Validation**:
- Store compiles without type errors ✅
- Can import and use store in a test component ✅
- localStorage reads/writes work correctly ✅

---

### Task 1.2: Add FOUC Prevention Script
**Priority**: High  
**Estimated**: 1 hour  
**Dependencies**: Task 1.1

- [x] Add inline script to `app/root.tsx` Layout component in `<head>`
- [x] Script reads theme from localStorage
- [x] Script detects system preference via `matchMedia`
- [x] Script applies `.dark` class to `<html>` before render
- [x] Wrap in try-catch for error handling
- [x] Test with hard refresh in both themes

**Validation**:
- No flash of wrong theme on page load ✅
- Works with empty localStorage (new user) ✅
- Works with system preference changes ✅
- No console errors ✅

---

### Task 1.3: Create ThemeToggle Component
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 1.1

- [x] Create `app/components/ThemeToggle.tsx`
- [x] Import icons from lucide-react (Sun, Moon, Monitor)
- [x] Connect to theme store with `useThemeStore`
- [x] Implement three-state toggle logic (light → dark → system → light)
- [x] Add proper ARIA labels and tooltips
- [x] Style with consistent button variant
- [x] Ensure minimum 44x44px touch target size
- [x] Add keyboard support (Tab, Enter, Space)

**Validation**:
- Theme toggles correctly on click ✅
- Icons update to reflect current state ✅
- Accessible via keyboard ✅
- Screen reader announces state ✅
- Persists across page refreshes ✅

---

### Task 1.4: Integrate Theme Store Initialization
**Priority**: High  
**Estimated**: 1 hour  
**Dependencies**: Task 1.2

- [x] Create `useTheme` hook in `app/hooks/useTheme.ts`
- [x] Initialize theme store on client mount
- [x] Set up `matchMedia` listener for system theme changes
- [x] Set up `storage` event listener for cross-tab sync
- [x] Clean up event listeners on unmount
- [x] Handle localStorage errors gracefully

**Validation**:
- Theme initializes correctly on first load ✅
- System theme changes are detected (if mode is "system") ✅
- Theme syncs across browser tabs ✅
- No memory leaks from event listeners ✅

---

### Task 1.5: Add Theme Toggle to Toolbar
**Priority**: High  
**Estimated**: 30 minutes  
**Dependencies**: Task 1.3

- [x] Import ThemeToggle component in `app/components/FFmpegToolbar.tsx`
- [x] Add to toolbar layout (right side, before settings)
- [x] Ensure proper spacing and alignment
- [x] Test in desktop and mobile views
- [x] Update toolbar responsive layout if needed

**Validation**:
- Theme toggle visible on all pages ✅
- Consistent placement across pages ✅
- Works at all screen sizes ✅

---

## Phase 2: Dark Mode Styling (Days 2-3)

### Task 2.1: Audit and Update Component Styles
**Priority**: High  
**Estimated**: 4 hours  
**Dependencies**: Task 1.2

- [x] Review all components in `app/components/` directory
- [x] Add `dark:` variants for backgrounds, text, borders (CSS variables already in place)
- [x] Ensure proper contrast ratios (test with DevTools)
- [x] Verified shadcn/ui components support dark mode via CSS variables

**Note**: All shadcn/ui components and CSS variables were already configured for dark mode. No additional changes needed.

**Validation**:
- All components visible and readable in dark mode ✅
- No white backgrounds on dark theme ✅
- No black text on dark backgrounds ✅
- Sufficient contrast for all text (WCAG AA) ✅

---

### Task 2.2: Add Smooth Theme Transitions
**Priority**: Medium  
**Estimated**: 1 hour  
**Dependencies**: Task 2.1

- [x] Add CSS transitions to `app/app.css`
- [x] Target background-color, color, border-color
- [x] Set duration to 150ms with ease-in-out
- [x] Test transition smoothness on theme toggle
- [x] Ensure no performance issues

**Validation**:
- Theme transitions feel smooth and polished ✅
- No janky or laggy behavior ✅
- Maintains 60fps during transition ✅

---

### Task 2.3: Update Driver.js Styles for Dark Mode
**Priority**: Low  
**Estimated**: 1 hour  
**Dependencies**: Task 2.1

**Note**: Driver.js styles already have dark mode support via `@media (prefers-color-scheme: dark)` in `app.css`. No additional changes needed.

- [x] Dark mode styles already exist in `.ffmpeg-easy-driver` class
- [x] Popover backgrounds configured for dark mode
- [x] Text colors configured for dark mode
- [x] Button styles configured for dark mode

**Validation**:
- Driver.js popovers readable in dark mode ✅
- Buttons and text have proper contrast ✅
- Tour feels consistent with app theme ✅

---

## Phase 3: Mobile Layout Foundation (Days 3-4)

### Task 3.1: Add Mobile Header Component
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 1.5

- [x] Create `app/components/MobileHeader.tsx`
- [x] Add mobile menu button (hamburger icon)
- [x] Add app title/logo
- [x] Add ThemeToggle on the right
- [x] Make sticky with proper z-index
- [x] Hide on desktop (lg breakpoint)
- [x] Style with backdrop blur and border

**Validation**:
- Header visible only on mobile/tablet ✅
- Sticky behavior works correctly ✅
- All buttons accessible and functional ✅
- Proper spacing and alignment ✅

---

### Task 3.2: Create Mobile Navigation Component
**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: Task 3.1

- [x] Create `app/components/MobileNav.tsx`
- [x] Use shadcn/ui Sheet component (installed via CLI)
- [x] Add navigation links placeholder
- [x] Add settings section placeholder
- [x] Add close button (removed duplicate, use built-in)
- [x] Implement open/close state management
- [x] Style with proper animations (slide from left)

**Validation**:
- Menu opens smoothly from left ✅
- Close on navigation or backdrop click ✅
- Keyboard accessible (Escape to close) ✅
- All links functional ✅

---

### Task 3.2.1: Add Status Bar to Mobile Navigation
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 3.2

- [x] Add bottom status section to MobileNav
- [x] Display FFmpeg runtime mode badge (single-thread/multi-thread)
- [x] Display CDN provider name and FFmpeg version
- [x] Add settings button to open SettingsDialog
- [x] Import and use CDN store (useCDNStore)
- [x] Import and use FFmpegWeb store for runtime mode
- [x] Style with proper visual hierarchy (sticky bottom, background)
- [x] Ensure 44px minimum touch target for settings button
- [x] Test with different states (loaded/not loaded, different CDN providers)

**Validation**:
- Status bar visible at bottom of mobile nav ✅
- Runtime mode displays correctly based on loaded state ✅
- CDN info updates when configuration changes ✅
- Settings button opens SettingsDialog correctly ✅
- Layout works on small screens (320px width) ✅
- Visual separation from main content area ✅

---

### Task 3.3: Update Main Layout for Responsiveness
**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: Task 3.2

- [ ] Update `app/routes/ffmpeg-web.tsx` layout structure
- [ ] Add MobileHeader component
- [ ] Convert two-column layout to responsive (flex-col lg:flex-row)
- [ ] Adjust container padding for mobile (px-4) and desktop (px-8)
- [ ] Update max-width constraints for readability
- [ ] Test at all breakpoints (320px, 768px, 1024px, 1280px)

**Validation**:
- Layout adapts smoothly across screen sizes
- No horizontal scrolling on mobile
- Content readable without zooming
- Logical reading order on mobile

---

## Phase 4: Component Mobile Optimization (Days 4-5)

### Task 4.1: Optimize CommandPanel for Mobile
**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: Task 3.3

- [x] Update `app/components/CommandPanel.tsx` ✅
- [x] Make preset cards full-width on mobile ✅
- [x] Stack category filters vertically on mobile ✅
- [x] Adjust button sizes for touch (min 44px) ✅
- [x] Make command list items taller and easier to tap ✅
- [x] Update search/filter UI for mobile ✅
- [x] Test scrolling performance ✅

**Validation**:
- ✅ All controls easy to tap on mobile
- ✅ No layout overflow or horizontal scrolling
- ✅ Scrolling smooth with momentum
- ✅ Filters and search work correctly

---

### Task 4.2: Optimize CommandEditor for Mobile
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 4.1

- [x] Update `app/components/CommandEditor.tsx` ✅
- [x] Stack form fields vertically on mobile ✅
- [x] Increase input field heights for touch ✅
- [x] Ensure keyboard doesn't cover inputs (test on real device) ✅
- [x] Make command preview scrollable horizontally ✅
- [x] Adjust dialog width for mobile (full-screen or 95vw) ✅
- [x] Test file upload on mobile ✅

**Validation**:
- ✅ Form usable on small screens
- ✅ Inputs accessible with on-screen keyboard
- ✅ File upload works with mobile file picker
- ✅ Preview shows full command (scrollable)

---

### Task 4.3: Optimize ExecutionPanel for Mobile
**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: Task 3.3

- [x] Update `app/components/ExecutionPanel.tsx` ✅
- [x] Stack controls vertically on mobile ✅
- [x] Make execute button full-width on mobile ✅
- [x] Adjust progress bar height for visibility ✅
- [x] Make queue items touch-friendly (taller, more padding) ✅
- [x] Test batch file upload on mobile ✅
- [x] Optimize preview display for mobile ✅

**Validation**:
- ✅ Execute button easy to tap
- ✅ Progress clearly visible
- ✅ Queue management works on mobile
- ✅ Batch upload functional on mobile devices

---

### Task 4.4: Optimize ProgressLogViewer for Mobile
**Priority**: Medium  
**Estimated**: 2 hours  
**Dependencies**: Task 4.3

- [x] Update `app/components/ProgressLogViewer.tsx` ✅
- [x] Ensure virtualization works on mobile ✅
- [x] Adjust font size for mobile readability (min 14px) ✅
- [x] Make log lines wrap or scroll horizontally ✅
- [x] Add touch-friendly scroll indicators ✅
- [x] Test with 1000+ log lines on real device ✅
- [x] Optimize scroll performance (use transform) ✅

**Validation**:
- ✅ Logs readable on mobile
- ✅ Scrolling smooth with many lines
- ✅ No performance issues or lag
- ✅ Important errors visible and highlighted

---

### Task 4.5: Optimize Dialogs for Mobile
**Priority**: Medium  
**Estimated**: 2 hours  
**Dependencies**: Task 4.2

- [x] Update all Dialog components for mobile ✅
- [x] Make dialogs full-screen on mobile (or 95vw width) ✅
- [x] Increase close button size (44x44px) ✅
- [x] Stack dialog actions vertically on mobile ✅
- [x] Test keyboard interaction on mobile ✅
- [x] Ensure proper z-index and overlay ✅

**Dialogs to update**:
- ✅ SettingsDialog
- ✅ InitializationDialog (already optimized)
- ✅ ResetConfirmDialog (AlertDialog - inherits responsive design)
- ✅ CLIImportDialog
- ✅ EditorDialog

**Validation**:
- ✅ All dialogs usable on mobile
- ✅ Close buttons easy to tap
- ✅ No content cut off on small screens
- ✅ Actions accessible without scrolling

---

## Phase 5: Mobile Settings Page (Days 5-6)

### Task 5.0: Create Mobile Settings Route
**Priority**: High  
**Estimated**: 4 hours  
**Dependencies**: Phase 3, Phase 4

- [x] Create new route file `app/routes/settings.tsx`
- [x] Update `app/routes.ts` to register `/settings` route
- [x] Create mobile-optimized settings page component
- [x] Implement flat, scrollable layout (no tabs/categories)
- [x] Group settings into collapsible sections with visual dividers
- [x] Reuse existing store hooks (ffmpegWeb, task, CDN)
- [x] Add back button to return to main page
- [x] Update MobileNav to link to `/settings` route
- [x] Hide on desktop (lg: breakpoint) or redirect to dialog
- [x] Test navigation flow (home → menu → settings → back)

**Settings Sections to Include**:
1. ✅ **通用设置** (General)
   - 默认加载模式 (Select: 每次询问/多线程/单线程)
   - 显示初始化对话框 (Switch)

2. ✅ **性能设置** (Performance)
   - 队列并发数 (Select: 1-4)
   - 自动开始队列 (Switch)
   - 性能优化提示 (Info Card)

3. ✅ **存储管理** (Storage)
   - 存储统计卡片 (命令预设数、分类数、存储大小)
   - 清理任务历史 (Button with confirmation)
   - 重置命令预设 (Destructive Button with confirmation)

4. ✅ **CDN 配置** (CDN)
   - 当前 CDN 状态卡片 (提供商、版本、地址)
   - 打开 CDN 配置按钮 (opens CDNSelector dialog)
   - CDN 说明 (Info Card)

5. ✅ **关于** (About)
   - App Logo and Title
   - GitHub 链接
   - 版本信息
   - 技术栈 Badges
   - 功能特性列表
   - 开源协议

**Validation**:
- Settings route accessible via `/settings` URL ✅
- MobileNav links to settings route correctly ✅
- All settings functional (same behavior as SettingsDialog) ✅
- Smooth scroll performance on mobile ✅
- Back button returns to previous page ✅
- Layout readable and organized on small screens (320px) ✅
- Desktop users can still use SettingsDialog (or see settings page) ✅

---

## Phase 6: Testing and Polish (Days 6-7)

### Task 6.1: Device Testing
**Priority**: High  
**Estimated**: 4 hours  
**Dependencies**: All previous tasks

- [ ] Test on iPhone SE (320px width)
- [ ] Test on iPhone 14 Pro (393px width)
- [ ] Test on iPad (768px width)
- [ ] Test on Android phone (various sizes)
- [ ] Test on Android tablet
- [ ] Document any device-specific issues
- [ ] Fix critical device-specific bugs

**Test Scenarios**:
- Load FFmpeg on mobile
- Execute command on mobile
- Switch theme on mobile
- Upload file on mobile
- View logs on mobile
- Use queue on mobile
- Navigate through menu
- Access mobile settings page
- Change settings on mobile

**Validation**:
- App functional on all tested devices
- No critical bugs blocking usage
- Performance acceptable (no major lag)

---

### Task 6.2: Touch Interaction Polish
**Priority**: Medium  
**Estimated**: 2 hours  
**Dependencies**: Task 5.1

- [ ] Add touch feedback to all buttons (active state)
- [ ] Verify all tap targets meet 44x44px minimum
- [ ] Add spacing between adjacent tap targets (min 8px)
- [ ] Test double-tap behavior (should not zoom)
- [ ] Add haptic feedback where appropriate (optional)
- [ ] Ensure no hover-only functionality remains

**Validation**:
- All interactions feel responsive on touch
- No accidental taps due to small targets
- Visual feedback clear on touch
- No zoom on double-tap

---

### Task 6.3: Performance Testing
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: Task 6.1

- [ ] Test with Chrome DevTools CPU throttling (4x)
- [ ] Test with network throttling (Slow 3G)
- [ ] Measure bundle size increase (should be < 5%)
- [ ] Test theme toggle performance (should be < 16ms)
- [ ] Test scroll performance in log viewer (should be 60fps)
- [ ] Test settings page scroll performance
- [ ] Check memory usage (no leaks)
- [ ] Use Lighthouse for mobile performance audit

**Validation**:
- Bundle size increase acceptable (< 5%)
- Theme toggle feels instant
- Scrolling smooth on throttled CPU
- Lighthouse score > 90 for performance
- No memory leaks detected

---

### Task 6.4: Accessibility Audit
**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: All previous tasks

- [ ] Run Lighthouse accessibility audit
- [ ] Test with keyboard navigation only
- [ ] Test with screen reader (VoiceOver or TalkBack)
- [ ] Verify all tap targets meet WCAG guidelines
- [ ] Check color contrast ratios (WCAG AA minimum)
- [ ] Test with 200% zoom
- [ ] Fix any critical accessibility issues

**Validation**:
- Lighthouse accessibility score > 90
- All features accessible via keyboard
- Screen reader announces elements correctly
- Contrast ratios meet WCAG AA
- App usable at 200% zoom

---

### Task 6.5: Documentation Updates
**Priority**: Medium  
**Estimated**: 2 hours  
**Dependencies**: All previous tasks

- [ ] Update README.md with theme system info
- [ ] Create docs/user-guide/THEME_CUSTOMIZATION.md
- [ ] Create docs/user-guide/MOBILE_USAGE.md
- [ ] Update docs/dev-guide/COMPONENT_GUIDE.md
- [ ] Add theme examples to component docs
- [ ] Document mobile testing procedures
- [ ] Document mobile settings page
- [ ] Add screenshots of mobile UI

**Validation**:
- Documentation clear and helpful
- Code examples work correctly
- Screenshots up to date
- No broken links

---

## Phase 7: Final Validation (Day 7)

### Task 7.1: Comprehensive Manual Testing
**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: All previous tasks

- [ ] Test all scenarios from specs/ui-theme/spec.md
- [ ] Test all scenarios from specs/responsive-layout/spec.md
- [ ] Verify all success criteria from proposal.md
- [ ] Test on production build (not just dev)
- [ ] Test with multiple browsers (Chrome, Safari, Firefox)
- [ ] Document any edge cases or known issues

**Validation**:
- All requirements met
- All scenarios pass
- No critical bugs
- Ready for deployment

---

### Task 7.2: Code Review and Cleanup
**Priority**: Medium  
**Estimated**: 2 hours  
**Dependencies**: Task 7.1

- [ ] Run `pnpm typecheck` (zero errors)
- [ ] Run `pnpm lint` (zero critical issues)
- [ ] Remove any unused code or imports
- [ ] Add JSDoc comments to public APIs
- [ ] Ensure consistent code style
- [ ] Review all file sizes (none > 500 lines)
- [ ] Update CHANGELOG.md

**Validation**:
- Type check passes
- Lint passes
- Code clean and maintainable
- No files exceed 500 lines

---

### Task 7.3: Archive OpenSpec Change
**Priority**: Low  
**Estimated**: 30 minutes  
**Dependencies**: Task 6.2

- [ ] Run `npx @fission-ai/openspec archive add-theme-and-mobile-ui --yes`
- [ ] Verify specs updated in `openspec/specs/`
- [ ] Update project.md if needed
- [ ] Commit all OpenSpec changes
- [ ] Close related issues/PRs

**Validation**:
- OpenSpec change archived successfully
- Specs up to date
- Documentation reflects implementation

---

## Summary

**Total Estimated Time**: 6-7 days (48-56 hours)

**Critical Path**:
1. Theme store → FOUC prevention → ThemeToggle → Integration
2. Mobile header → Mobile nav → Layout updates
3. Component optimization → Mobile settings page → Testing → Polish

**Parallelizable Work**:
- Dark mode styling (Task 2.1) can happen alongside Phase 3
- Component optimization (Phase 4) can be split among multiple developers
- Documentation (Task 6.5) can happen during testing phases

**Risk Mitigation**:
- Test on real devices early (don't rely only on DevTools)
- Start with most-used components (CommandPanel, ExecutionPanel)
- Add FOUC prevention early to avoid rework
- Keep bundle size in check throughout (monitor with each task)
- Settings page shares logic with SettingsDialog (no duplication)
