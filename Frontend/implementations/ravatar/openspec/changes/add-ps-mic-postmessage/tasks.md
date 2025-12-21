# Tasks: Add PostMessage Listener for Microphone Control

## 1. Add Constants
- [ ] Add `PM_PS_MIC_MUTE = 'rvo-ps-mic-mute'` constant to `src/constants.ts`
- [ ] Add `PM_PS_MIC_UNMUTE = 'rvo-ps-mic-unmute'` constant to `src/constants.ts`
- [ ] Export constants for external use

## 2. Implement Message Listener
- [ ] Import new constants in `player.ts`
- [ ] Create message event handler function after PixelStreaming instance creation
- [ ] Register window `message` event listener
- [ ] Validate incoming message has `type` property before processing

## 3. Handle Mute Command
- [ ] Check for `PM_PS_MIC_MUTE` message type
- [ ] Call `stream.muteMicrophone()` when mute message received
- [ ] Wrap in try-catch and log warning on failure

## 4. Handle Unmute Command
- [ ] Check for `PM_PS_MIC_UNMUTE` message type
- [ ] Call `stream.unmuteMicrophone(true)` with `forceEnable=true`
- [ ] Wrap in try-catch and log warning on failure

## 5. Validation
- [ ] Build project with `npm run build`
- [ ] Verify no TypeScript errors
- [ ] Verify ESLint passes
- [ ] Manual test: Send mute/unmute postMessages from parent and verify mic state changes
