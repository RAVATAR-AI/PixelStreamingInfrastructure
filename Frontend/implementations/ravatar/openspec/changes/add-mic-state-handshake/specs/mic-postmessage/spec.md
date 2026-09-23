# Capability: Microphone PostMessage Control

Adds a pixel -> widget acknowledgement channel on top of the existing widget -> pixel microphone commands.

## ADDED Requirements

### Requirement: Outgoing Message Constants
The system SHALL define constants for outgoing microphone handshake messages:
- `PM_PS_MIC_READY` with value `'ravatar-ps-mic-ready'`
- `PM_PS_MIC_STATE` with value `'ravatar-ps-mic-state'`

#### Scenario: Constants are accessible
- **GIVEN** the constants module is imported
- **WHEN** accessing `PM_PS_MIC_READY` and `PM_PS_MIC_STATE`
- **THEN** they return `'ravatar-ps-mic-ready'` and `'ravatar-ps-mic-state'` respectively

### Requirement: Microphone Sender Access
The system SHALL expose the outgoing microphone `RTCRtpSender` through a `RavatarPixelStreaming` subclass, because `PixelStreaming._webRtcController` is `protected`.

#### Scenario: Sender is available after connection
- **GIVEN** the peer connection has an audio sender
- **WHEN** `getMicSender()` is called
- **THEN** the first sender whose track kind is `'audio'` is returned

#### Scenario: Sender is missing before connection
- **GIVEN** the peer connection, the peer connection controller or the WebRTC controller does not exist yet
- **WHEN** `getMicSender()` is called
- **THEN** `null` is returned
- **AND** no exception is thrown

### Requirement: Microphone Readiness Announcement
The system SHALL post a `ravatar-ps-mic-ready` message to the parent window when the library reports `webRtcConnected` or `videoInitialized`.

The payload SHALL be:
```typescript
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
```

#### Scenario: Ready announced on WebRTC connection
- **GIVEN** the widget embeds the pixel in an iframe
- **WHEN** the library emits `webRtcConnected`
- **THEN** a `ravatar-ps-mic-ready` message with `reason: 'webrtc-connected'` is posted to `window.parent`

#### Scenario: Ready announced on video initialization
- **GIVEN** the widget embeds the pixel in an iframe
- **WHEN** the library emits `videoInitialized`
- **THEN** a `ravatar-ps-mic-ready` message with `reason: 'video-initialized'` is posted to `window.parent`

#### Scenario: Ready reports a missing track
- **GIVEN** the peer connection has no audio sender
- **WHEN** a readiness event fires
- **THEN** the message carries `hasMicTrack: false` and `enabled`, `muted`, `readyState`, `label` all `null`

#### Scenario: No parent window
- **GIVEN** the pixel page is opened at the top level (`window.parent === window`)
- **WHEN** a readiness event fires
- **THEN** no message is posted

### Requirement: Command Acknowledgement
The system SHALL post a `ravatar-ps-mic-state` message to the parent window after handling every `rvo-ps-mic-mute` and `rvo-ps-mic-unmute` command.

The payload SHALL be:
```typescript
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

#### Scenario: Mute acknowledged
- **GIVEN** the pixel has an enabled microphone track
- **WHEN** a message with `type: 'rvo-ps-mic-mute'` is received
- **THEN** `stream.muteMicrophone()` is called
- **AND** a `ravatar-ps-mic-state` message with `requested: 'mute'`, `enabled: false` and `applied: true` is posted

#### Scenario: Unmute acknowledged
- **GIVEN** the pixel has a disabled microphone track
- **WHEN** a message with `type: 'rvo-ps-mic-unmute'` is received
- **THEN** `stream.unmuteMicrophone(true)` is called
- **AND** a `ravatar-ps-mic-state` message with `requested: 'unmute'`, `enabled: true` and `applied: true` is posted

#### Scenario: Command arrives before a track exists
- **GIVEN** the peer connection has no audio sender yet
- **WHEN** a mute or unmute command is received
- **THEN** a `ravatar-ps-mic-state` message with `hasMicTrack: false` and `applied: false` is posted
- **AND** the requested state is remembered as the desired state

#### Scenario: Library call fails
- **GIVEN** `muteMicrophone()` or `unmuteMicrophone()` throws
- **WHEN** the corresponding command is handled
- **THEN** a warning is logged
- **AND** a `ravatar-ps-mic-state` message is still posted describing the unchanged track
- **AND** no exception escapes the message listener

### Requirement: Sticky Desired State
The system SHALL remember the last requested microphone state and SHALL re-apply it to the (possibly new) track before each readiness announcement.

#### Scenario: Reconnect does not unmute a muted microphone
- **GIVEN** the widget requested `mute` and a WebRTC reconnect produced a fresh, enabled audio track
- **WHEN** `webRtcConnected` or `videoInitialized` fires again
- **THEN** `stream.muteMicrophone()` is called before the announcement
- **AND** the posted `ravatar-ps-mic-ready` message reports `enabled: false`

#### Scenario: No desired state yet
- **GIVEN** the widget has not sent any mute or unmute command
- **WHEN** a readiness event fires
- **THEN** neither `muteMicrophone()` nor `unmuteMicrophone()` is called
- **AND** the `ravatar-ps-mic-ready` message reports the track as it is

### Requirement: Unknown Command Types Are Not Acknowledged
The system SHALL treat message types other than `rvo-ps-mic-mute` and `rvo-ps-mic-unmute` as none of its business.

#### Scenario: Unrelated message type
- **GIVEN** a postMessage with a `type` that is not a microphone command
- **WHEN** it is handled by the bridge
- **THEN** `false` is returned
- **AND** no message is posted to the parent window
- **AND** the desired state is unchanged

### Requirement: Backward Compatibility
The handshake SHALL be additive in both directions.

#### Scenario: Old widget with new pixel
- **GIVEN** a widget that does not know the handshake messages
- **WHEN** the pixel posts `ravatar-ps-mic-ready` or `ravatar-ps-mic-state`
- **THEN** the widget ignores the unknown message name
- **AND** mute/unmute commands keep working exactly as before

#### Scenario: New widget with old pixel
- **GIVEN** a pixel build without the handshake
- **WHEN** the widget sends mute/unmute commands
- **THEN** no ready or acknowledgement message ever arrives
- **AND** the widget keeps re-stating the desired state on its legacy interval

## MODIFIED Requirements

### Requirement: One-Way Communication
The system SHALL send microphone messages back to the parent window ONLY as part of the state handshake: a `ravatar-ps-mic-ready` announcement on a readiness event, and a `ravatar-ps-mic-state` acknowledgement per received command. No other microphone traffic SHALL be emitted, and the messages SHALL be posted with target origin `'*'` like every other outgoing message.

#### Scenario: Acknowledgement is the only response
- **GIVEN** a mute or unmute message is received and processed
- **WHEN** the operation completes (success or failure)
- **THEN** exactly one `ravatar-ps-mic-state` message is posted back to the parent window
- **AND** no other message is posted as a result of that command

#### Scenario: Session messages are unaffected
- **GIVEN** the handshake is active
- **WHEN** `videoInitialized`, `streamConnect` or `webRtcDisconnected` fires
- **THEN** the existing `ravatar-session-start` / `ravatar-session-close` messages are posted unchanged
