## RAVATAR Pixel Streaming Frontend Implementation

This is a custom frontend implementation for RAVATAR's Pixel Streaming solution, built on top of the Pixel Streaming plugin. The RAVATAR frontend contains:

1. The base `lib-pixelstreamingfrontend` library.
2. The reference ui plugin for the base library `lib-pixelstreamingfrontend-ui`.
3. Custom RAVATAR-specific features and branding.

Using these libraries provides a fully functional and customizable Pixel Streaming experience tailored for RAVATAR's use case.

This package demonstrates how to include the frontend libraries as dependencies and bundle/minify the final application for deployment.

### Key features of the RAVATAR frontend
- **Predefined Configuration**: Optimized settings for RAVATAR use case with auto-connect, auto-play, and streamlined UI
- **Chat Widget Integration**: Post message communication system for session management and external widget integration
- **Simplified UI**: Hidden UI controls for a cleaner, more focused experience
- **Session Management**: Automatic event handling for session start/close events communicated to parent windows
- **Custom Forbidden Page**: Access control handling for unauthorized users
- **Override Text Overlays**: Custom handling of text overlays to prevent unwanted popup displays
- **Touch and Keyboard Support**: Full input support including touch, keyboard, and mouse interactions
- **Quality Controls**: Built-in quality management and viewport resolution matching
- **Microphone Support**: Integrated microphone functionality for voice interactions, remotely controllable by the embedding widget over a two-way postMessage handshake

### Building the RAVATAR frontend
```bash
cd Frontend/implementations/ravatar
npm install
npm run build
```

### Development commands
```bash
# Development build with source maps
npm run build:dev

# Production build (optimized)
npm run build:prod

# ES Module build
npm run build:esm

# Clean and rebuild
npm run rebuild

# Watch mode for development
npm run watch

# Development server
npm run serve

# Production server
npm run serve-prod

# Unit tests (jest + ts-jest, jsdom)
npm test
```

### Using the RAVATAR frontend
Building the RAVATAR frontend using the commands above will place it in the `SignallingWebServer/www` directory.

```bash
# Serve the RAVATAR frontend
cd SignallingWebServer/platform_scripts/cmd
start.bat
# Navigate to http://localhost in your browser to see the RAVATAR frontend
```

***Note:* You can also run `start.bat --build` to build all the dependent libraries.

### File Structure
```
src/
├── assets/          # Static assets and resources
├── docs/            # Documentation files
├── constants.ts     # RAVATAR-specific constants
├── forbidden.html   # Access control page template
├── forbidden.ts     # Access control logic
├── micBridge.ts     # Microphone state handshake with the parent widget
├── micBridge.test.ts# Unit tests for the handshake state machine
├── player.html      # Main player page template
├── player.ts        # Main application entry point
└── ravatarPixelStreaming.ts  # PixelStreaming subclass exposing the mic sender
```

### Configuration
The RAVATAR frontend uses the same configuration system as the reference TypeScript implementation but with predefined settings optimized for RAVATAR's use case:

```typescript
initialSettings: {
    AutoConnect: true,        // Automatically connects to the stream
    AutoPlayVideo: true,      // Automatically plays video without user interaction
    WaitForStreamer: true,    // Waits for streamer to be available
    MatchViewportRes: true,   // Matches stream resolution to viewport
    KeyboardInput: true,      // Enables keyboard input
    TouchInput: true,         // Enables touch input for mobile devices
    HoveringMouse: true,      // Enables hover mouse functionality
    ControlsQuality: true,    // Enables quality controls
    UseMic: true,            // Enables microphone functionality
    HideUI: true             // Hides UI controls for cleaner experience
}
```

### Chat Widget Integration
The RAVATAR implementation includes post message communication for seamless integration with external chat widgets:

- **Session Events**: Automatically sends `ravatar-session-start` and `ravatar-session-close` events to parent window
- **Event Triggers**: 
  - `videoInitialized` and `streamConnect` events trigger session start
  - `webRtcDisconnected` event triggers session close (when reconnection is allowed and reconnect attempts are exhausted)

This enables external applications to respond to streaming session state changes for enhanced user experience integration.

#### Microphone State Handshake

In WebRTC microphone mode the pixel page owns the microphone track, while the widget owns the intent. The two sides converge through a small handshake. All messages are posted with target origin `'*'`; the pixel only posts upwards when it is actually framed (`window.parent !== window`).

**Widget to pixel** (dispatched on `type`, unchanged):

```typescript
{ type: 'rvo-ps-mic-mute',   timestamp: number }
{ type: 'rvo-ps-mic-unmute', timestamp: number }
```

**Pixel to widget** (dispatched on `name`):

```typescript
// Sent on the library's `webRtcConnected` and `videoInitialized` events, i.e.
// whenever a microphone track appears - including after a reconnect, which
// hands the page a brand new track.
{
  name: 'ravatar-ps-mic-ready',
  reason: 'webrtc-connected' | 'video-initialized',
  hasMicTrack: boolean,
  enabled: boolean | null,
  muted: boolean | null,
  readyState: string | null,
  label: string | null,
  timestamp: number
}

// Sent after every mute/unmute command, including when there is no track yet
// (then `hasMicTrack: false` and `applied: false`).
{
  name: 'ravatar-ps-mic-state',
  requested: 'mute' | 'unmute',
  applied: boolean,   // hasMicTrack && enabled === (requested === 'unmute')
  hasMicTrack: boolean,
  enabled: boolean | null,
  muted: boolean | null,
  readyState: string | null,
  label: string | null,
  timestamp: number
}
```

The requested state is **sticky**: the pixel remembers the last command and re-applies it to the track before every `ravatar-ps-mic-ready`, so a WebRTC reconnect cannot silently unmute a microphone the widget muted.

The handshake is additive in both directions. An older widget simply ignores message names it does not know, and a newer widget talking to an older pixel never receives a ready or acknowledgement message and keeps falling back to its periodic re-statement of the desired state.

The state machine lives in `src/micBridge.ts` and takes all of its browser access (sender lookup, mute/unmute, `postMessage`, clock) as injected dependencies, so it is covered by unit tests:

```bash
npm test
```

### Custom Overlay Handling
The implementation overrides the default text overlay behavior to provide a cleaner user experience:

```typescript
// Override the showTextOverlay method to prevent any text overlays from being displayed
Application.prototype.showTextOverlay = (text: string) => {
    console.log(text);
};
```

Instead of displaying overlay popups, messages are logged to the console, maintaining the streamlined UI while preserving debugging capabilities.

### Deployment
After building, the RAVATAR frontend is automatically placed in the `SignallingWebServer/www` directory and can be served directly by the SignallingWebServer for a complete Pixel Streaming solution.