# Change: Add PostMessage Listener for Microphone Control

## Why
Parent widgets embedding the Pixel Streaming iframe need to remotely control the microphone state (mute/unmute) without direct access to the PixelStreaming instance. This enables better user experience in chat widget integrations where voice interactions need to be paused/resumed based on external events.

## What Changes
- Add incoming postMessage constants `PM_PS_MIC_MUTE` and `PM_PS_MIC_UNMUTE` to `constants.ts`
- Add window `message` event listener in `player.ts` after PixelStreaming instance creation
- Handle `rvo-ps-mic-mute` messages by calling `stream.muteMicrophone()`
- Handle `rvo-ps-mic-unmute` messages by calling `stream.unmuteMicrophone(true)` with forceEnable
- Log warnings on failed mute/unmute operations

## Impact
- Affected specs: `mic-postmessage` (new capability)
- Affected code: `src/constants.ts`, `src/player.ts`
- No breaking changes to existing session start/close postMessage behavior
- Existing `UseMic: true` config remains unchanged - mic auto-enables on load, postMessages control subsequent state

## Design Decisions
- **One-way communication**: No confirmation messages sent back to parent - keeps implementation simple
- **No origin validation**: Accept messages from any origin (`'*'`) to match existing postMessage pattern
- **ForceEnable on unmute**: Use `forceEnable=true` to allow mic reconnection if track was lost
- **Fail silently with warning**: Log console warnings on errors rather than throwing exceptions

## Message Format
Messages received as:
```typescript
{
  type: 'rvo-ps-mic-mute' | 'rvo-ps-mic-unmute',
  timestamp: number
}
```
