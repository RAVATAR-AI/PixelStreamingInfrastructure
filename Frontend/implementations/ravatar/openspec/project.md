# Project Context

## Purpose
RAVATAR Pixel Streaming Frontend - A custom frontend implementation for RAVATAR's Pixel Streaming solution built on Epic Games' Pixel Streaming infrastructure. This project provides a streamlined, branded experience for streaming Unreal Engine content to web browsers with integrated chat widget support and session management.

**Key Goals:**
- Provide a fully functional Pixel Streaming client optimized for RAVATAR's use case
- Enable seamless integration with external chat widgets via postMessage API
- Deliver a clean, simplified UI with auto-connect and auto-play capabilities
- Support voice interactions through integrated microphone functionality

## Tech Stack
- **TypeScript 5.7** - Primary language with strict type checking
- **Webpack 5** - Module bundling and build tooling
- **ESLint 9** with TypeScript-ESLint - Code linting
- **Prettier 3** - Code formatting
- **@epicgames-ps/lib-pixelstreamingfrontend-ue5.6** - Core Pixel Streaming library
- **@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6** - Reference UI components
- **HTML5/WebRTC** - Underlying streaming technology

## Project Conventions

### Code Style
- **Formatting**: Prettier with default settings
- **Linting**: ESLint with TypeScript support, extends base config from parent project
- **Unused Variables**: Prefix with underscore (`_`) to ignore (e.g., `_unusedVar`)
- **Naming**:
  - Constants: `UPPER_SNAKE_CASE` for exported constants
  - Types/Interfaces: `PascalCase`
  - Functions/Variables: `camelCase`
- **Imports**: Use explicit imports from `@epicgames-ps` packages
- **Export Pattern**: Re-export library contents plus custom implementations

### Architecture Patterns
- **Entry Point**: `src/player.ts` - Main application bootstrap
- **Configuration-Driven**: Use `Config` object with `initialSettings` for stream configuration
- **Event-Driven Communication**: 
  - Listen to PixelStreaming events (`videoInitialized`, `streamConnect`, `webRtcDisconnected`)
  - Communicate with parent windows via `postMessage` API
- **Singleton Pattern**: Global `window.pixelStreaming` instance for external access
- **Style Application**: `PixelStreamingApplicationStyle` for consistent theming
- **Build Targets**:
  - Development: Source maps enabled, unminified
  - Production: Optimized and minified
  - ES Module: For modern module consumption

### Testing Strategy
- Test files excluded from linting: `src/__test__/**/*.ts`, `**/*.test.ts`
- Manual testing via development server (`npm run serve`)
- Integration testing through the SignallingWebServer

### Git Workflow
- Part of larger PixelStreamingInfrastructure monorepo
- Build output goes to `SignallingWebServer/www` directory
- Clean builds recommended: `npm run rebuild`

## Domain Context
**Pixel Streaming** is Epic Games' technology for streaming Unreal Engine applications to web browsers via WebRTC. Key concepts:

- **Streamer**: The Unreal Engine application sending video/audio
- **Signalling Server**: Coordinates WebRTC connections between clients and streamers
- **Frontend**: Web client that receives and displays the stream

**RAVATAR-Specific Features:**
- **Session Events**: `ravatar-session-start` and `ravatar-session-close` events sent to parent window
- **Chat Widget Integration**: Designed to work embedded in iframes with external widgets
- **Hidden UI Mode**: `HideUI: true` by default for cleaner integration
- **Auto-Connect Flow**: Automatically connects and plays without user interaction

## Important Constraints
- **Browser Compatibility**: Requires WebRTC support (modern browsers)
- **Parent Window Communication**: Uses `postMessage` with `'*'` target origin
- **Dependency on Epic Libraries**: Must match UE5.6 version compatibility
- **Private Package**: Not published to npm (`"private": true`)
- **Build Order**: Depends on parent libraries being built first (use `start.bat --build`)

## External Dependencies
- **@epicgames-ps/lib-pixelstreamingfrontend-ue5.6**: Core streaming functionality (WebRTC, input handling, video playback)
- **@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6**: UI components (Application wrapper, controls, overlays)
- **SignallingWebServer**: Backend server for WebRTC signalling (separate component)
- **Unreal Engine Streamer**: The UE application providing the stream content
