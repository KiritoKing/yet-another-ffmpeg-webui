# Developer Guide

Welcome to the FFmpeg Easy Developer Guide! This section contains technical documentation for developers.

## Architecture

- [API Documentation](./API.md) - FFmpegService API reference
- [Task System v4](./TASK_SYSTEM_v4.md) - Latest task queue architecture
- [Task System v3](./TASK_SYSTEM_v3.md) - Previous task system documentation
- [Task System v1](./TASK_SYSTEM.md) - Original task system design
- [Deployment Guide](./DEPLOYMENT.md) - Platform deployment instructions

## Project Structure

```
app/
├── components/     # React components (see app/components/AGENTS.md)
├── hooks/         # Custom React hooks
├── routes/        # React Router pages
├── services/      # Business logic (see app/services/AGENTS.md)
├── store/         # Zustand stores (see app/store/AGENTS.md)
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Tech Stack

- **Framework**: React 19 + React Router v7
- **Language**: TypeScript 5
- **Styling**: TailwindCSS v4 + shadcn/ui
- **State**: Zustand v5
- **FFmpeg**: @ffmpeg/ffmpeg v0.12 (WebAssembly)
- **Build**: Vite v7
- **Database**: Dexie.js (IndexedDB)

## Getting Started

### Prerequisites
- Node.js v18+
- pnpm (package manager)

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev          # Start dev server (http://localhost:5173)
pnpm typecheck    # Run TypeScript checks
pnpm lint         # Run Biome linter
pnpm format:write # Format code
```

### Building
```bash
pnpm build        # Build for production
pnpm start        # Start production server
```

## Development Guidelines

### Code Style
- Use Biome for linting and formatting
- Follow TypeScript strict mode
- Prefer functional components
- Use hooks for state management

### File Organization
- **Single Responsibility**: One component/service per file
- **Max 500 Lines**: Split larger files into modules
- **Naming**: PascalCase for components, camelCase for functions

### State Management
- Use Zustand stores for global state
- Organize stores in subdirectories (types/index/defaults)
- Avoid prop drilling - consume stores directly
- Only persist user preferences

### Component Guidelines
- Define TypeScript props interface
- Use shadcn/ui for consistent UI
- Implement focused hooks for complex logic
- Avoid unnecessary props (use hooks/stores)

### Service Guidelines
- Keep services stateless
- Use static methods for utilities
- Accept callbacks for events
- Provide clear error messages

## Key Concepts

### FFmpeg Integration
- Browser-based video processing via WebAssembly
- Single/Multi-thread modes (multi requires SharedArrayBuffer)
- Virtual file system for input/output
- Real-time progress and logging

### Task System
- Queue-based batch processing
- Concurrent execution with pooling
- IndexedDB persistence for history
- Blob URL management for results

### CDN System
- Health checking and auto-selection
- Multiple provider support
- Custom URL validation
- Version management

## Common Tasks

### Adding a New Command Preset
1. Add to `store/command/default-values.ts`
2. Define formSchema for dynamic parameters
3. Ensure WASM compatibility
4. Test with various file sizes

### Adding a New Store
1. Create `store/mystore/types.ts`
2. Create `store/mystore/index.ts`
3. Add defaults if needed
4. Update imports in components

### Adding a New Service
1. Create `services/myService.ts`
2. Define clear interfaces
3. Implement error handling
4. Add documentation

### Adding a New Component
1. Create in `components/` directory
2. Define props interface
3. Use shadcn/ui primitives
4. Consume stores via hooks

## Testing

### Type Checking
```bash
pnpm typecheck
```

### Linting
```bash
pnpm lint
```

### Manual Testing
1. Start dev server
2. Test feature in browser
3. Check console for errors
4. Verify file outputs

## Debugging

### FFmpeg Errors
- Check logs in ProgressLogViewer
- Verify command syntax
- Check file compatibility
- Monitor memory usage

### Store Issues
- Use React DevTools
- Check Zustand dev tools
- Inspect localStorage
- Verify persistence config

### Performance Issues
- Use React Profiler
- Check virtual scrolling
- Monitor memory leaks
- Optimize re-renders

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform-specific instructions:
- Vercel
- Netlify
- Cloudflare Pages
- Render
- Fly.io
- Railway
- Platform.sh
- Docker

## Contributing

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run lint and typecheck
5. Submit PR with description

### Commit Convention
Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `style:` - Formatting
- `test:` - Tests
- `chore:` - Maintenance

## Resources

- [React Router v7 Docs](https://reactrouter.com/en/v7)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [FFmpeg.wasm Docs](https://ffmpegwasm.netlify.app/)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [TailwindCSS Docs](https://tailwindcss.com/)
