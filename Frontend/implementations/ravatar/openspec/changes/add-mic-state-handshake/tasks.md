# Tasks: Add Microphone State Handshake

## 1. Constants
- [x] Add `PM_PS_MIC_READY = 'ravatar-ps-mic-ready'` to `src/constants.ts`
- [x] Add `PM_PS_MIC_STATE = 'ravatar-ps-mic-state'` to `src/constants.ts`
- [x] Keep the existing `PM_PS_MIC_MUTE` / `PM_PS_MIC_UNMUTE` / session constants unchanged

## 2. Expose the microphone sender
- [x] Add `src/ravatarPixelStreaming.ts` with `class RavatarPixelStreaming extends PixelStreaming`
- [x] Implement `getMicSender(): RTCRtpSender | null` via `_webRtcController?.peerConnectionController?.peerConnection?.getSenders()`
- [x] Return `null` (never throw) when any link in the chain is missing

## 3. Bridge state machine
- [x] Add `src/micBridge.ts` with `MicDesired`, `MicReadyReason`, `MicSnapshot` and the message payload types
- [x] Implement pure `snapshotSender`, `isApplied`, `buildReadyMessage`, `buildStateMessage`
- [x] Implement `MicBridge` with `handleCommand(type): boolean`, `handleTrackReady(reason)` and `get desired()`
- [x] Wrap mute/unmute, sender reads and `post` in try/catch

## 4. Wire it into the player
- [x] Construct the stream as `RavatarPixelStreaming` and keep `window.pixelStreaming` exposed
- [x] Create the bridge with `getMicSender` / `muteMicrophone` / `unmuteMicrophone(true)` / parent `postMessage`
- [x] Post only when `window.parent !== window`
- [x] Call `handleTrackReady('webrtc-connected')` on `webRtcConnected`
- [x] Call `handleTrackReady('video-initialized')` on `videoInitialized`
- [x] Replace the two mute/unmute branches in the `message` listener with `micBridge.handleCommand(...)`
- [x] Leave `SESSION_START` / `SESSION_CLOSE` postMessages untouched

## 5. Tests
- [x] Add `jest.config.js` and `tsconfig.jest.json` mirroring `Frontend/library`
- [x] Add `jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom` devDependencies and an `npm test` script
- [x] Cover `snapshotSender` with and without a track
- [x] Cover `isApplied` for mute / unmute / no track
- [x] Cover `handleCommand` returning `false` for unrelated types
- [x] Cover mute then unmute updating `desired` and acking with `applied: true`
- [x] Cover a command with no track acking `hasMicTrack: false`, `applied: false` while remembering `desired`
- [x] Cover `handleTrackReady` re-applying a remembered `mute` onto a fresh enabled track before posting ready
- [x] Cover `handleTrackReady` with `desired === null` not calling mute/unmute
- [x] Cover a throwing `mute()` / `unmute()` still producing a state message

## 6. Documentation
- [x] Document the two outgoing messages in `README.md` (Chat Widget Integration / Microphone)
- [x] Document the handshake sequence and the backward-compatibility rules

## 7. Validation
- [x] `npm run lint`
- [x] `npx tsc --noEmit -p tsconfig.jest.json`
- [x] `npm test`
- [x] `npm run build`
