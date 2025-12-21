# Tasks: Add PostMessage Listener for Microphone Control

## 1. Add Constants
- [x] Add `PM_PS_MIC_MUTE = 'rvo-ps-mic-mute'` constant to `src/constants.ts`
- [x] Add `PM_PS_MIC_UNMUTE = 'rvo-ps-mic-unmute'` constant to `src/constants.ts`
- [x] Export constants for external use

## 2. Implement Message Listener
- [x] Import new constants in `player.ts`
- [x] Create message event handler function after PixelStreaming instance creation
- [x] Register window `message` event listener
- [x] Validate incoming message has `type` property before processing

## 3. Handle Mute Command
- [x] Check for `PM_PS_MIC_MUTE` message type
- [x] Call `stream.muteMicrophone()` when mute message received
- [x] Wrap in try-catch and log warning on failure

## 4. Handle Unmute Command
- [x] Check for `PM_PS_MIC_UNMUTE` message type
- [x] Call `stream.unmuteMicrophone(true)` with `forceEnable=true`
- [x] Wrap in try-catch and log warning on failure

## 5. Validation
- [x] Build project with `npm run build`
- [x] Verify no TypeScript errors
- [x] Verify ESLint passes
- [x] Manual test: Send mute/unmute postMessages from parent and verify mic state changes
