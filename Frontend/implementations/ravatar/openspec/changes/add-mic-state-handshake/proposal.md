# Change: Add Microphone State Handshake (pixel -> widget)

## Why
Microphone control between the chat widget and the Pixel Streaming iframe is one-way today: the widget posts `rvo-ps-mic-mute` / `rvo-ps-mic-unmute` and never learns whether a microphone track existed, whether the command landed, or whether a WebRTC reconnect replaced the track with a fresh, enabled one. The widget compensates by blindly re-stating the desired state every 5 seconds, which is both noisy and slow to converge — and after a reconnect the microphone can be live while the widget believes it is muted.

## What Changes
- Add outgoing postMessage constants `PM_PS_MIC_READY` (`'ravatar-ps-mic-ready'`) and `PM_PS_MIC_STATE` (`'ravatar-ps-mic-state'`).
- Add `RavatarPixelStreaming`, a subclass of `PixelStreaming` exposing `getMicSender(): RTCRtpSender | null` (the base class keeps `_webRtcController` `protected`).
- Add `micBridge.ts`: a browser-free state machine (`MicBridge`) plus pure helpers (`snapshotSender`, `isApplied`, `buildReadyMessage`, `buildStateMessage`).
- Announce readiness to the parent window on `webRtcConnected` and `videoInitialized`, re-applying the remembered desired state first so a reconnect cannot silently unmute.
- Acknowledge every mute/unmute command with a `ravatar-ps-mic-state` message carrying the observed track state, including when no track exists yet.
- Add a jest setup (jest, ts-jest, @types/jest, jest-environment-jsdom) and unit tests for the bridge; add `npm test`.
- No breaking changes: the incoming message names, payload shape and origin policy are untouched.

## Impact
- Affected specs: `mic-postmessage`
- Affected code: `src/constants.ts`, `src/player.ts`, `src/micBridge.ts` (new), `src/ravatarPixelStreaming.ts` (new), `src/micBridge.test.ts` (new), `jest.config.js` (new), `tsconfig.jest.json` (new), `package.json`, `README.md`
- Counterpart change in the chat-widget repo (`useIframeMicSync`): consumes the two new messages, keeps the 5 s re-statement as the legacy fallback.

## Design Decisions
- **Outgoing messages are dispatched on `name`, not `type`**: the widget's `PostMessageContext` routes on `event.data.name`. Incoming commands keep `type` for backward compatibility.
- **Sticky desired state**: `desired` is remembered until the widget changes it and is re-applied on every track-ready event. This is the actual fix for the reconnect race; the acknowledgement is what lets the widget stop guessing.
- **`webRtcConnected` and `videoInitialized` as readiness triggers**: the audio sender is created before the offer is sent, so the track exists by the time either event fires, and both fire again after a reconnect.
- **Both directions stay backward compatible**: an old widget ignores unknown message names; a new widget talking to an old pixel never receives a ready/ack and falls back to its periodic re-statement.
- **Errors never escape the bridge**: `mute()`, `unmute()`, sender reads and `post()` are each wrapped, so a failing library call still produces an acknowledgement the widget can act on.
- **State machine free of browser globals**: `MicBridge` takes its sender accessor, mute/unmute, `post` and clock as dependencies, so the protocol is unit-testable in jsdom without a peer connection.
