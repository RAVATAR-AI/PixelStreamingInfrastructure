# Capability: Microphone PostMessage Control

Enables parent windows to control the Pixel Streaming microphone state via postMessage API.

## ADDED Requirements

### Requirement: Incoming Message Constants
The system SHALL define constants for incoming microphone control messages:
- `PM_PS_MIC_MUTE` with value `'rvo-ps-mic-mute'`
- `PM_PS_MIC_UNMUTE` with value `'rvo-ps-mic-unmute'`

#### Scenario: Constants are accessible
- **GIVEN** the constants module is imported
- **WHEN** accessing `PM_PS_MIC_MUTE` and `PM_PS_MIC_UNMUTE`
- **THEN** they return `'rvo-ps-mic-mute'` and `'rvo-ps-mic-unmute'` respectively

### Requirement: Message Event Listener Registration
The system SHALL register a window `message` event listener after the PixelStreaming instance is created.

#### Scenario: Listener is registered on page load
- **GIVEN** the page has loaded and PixelStreaming instance exists
- **WHEN** the initialization completes
- **THEN** a `message` event listener is attached to the window

### Requirement: Handle Mute Message
The system SHALL mute the microphone when receiving a `rvo-ps-mic-mute` message from the parent window.

#### Scenario: Mute message received
- **GIVEN** the PixelStreaming instance is running with microphone enabled
- **WHEN** a message with `type: 'rvo-ps-mic-mute'` is received
- **THEN** `stream.muteMicrophone()` is called

#### Scenario: Mute fails gracefully
- **GIVEN** the PixelStreaming instance exists
- **WHEN** a mute message is received and `muteMicrophone()` throws an error
- **THEN** a warning is logged to the console
- **AND** no exception is thrown to the caller

### Requirement: Handle Unmute Message
The system SHALL unmute the microphone with `forceEnable=true` when receiving a `rvo-ps-mic-unmute` message from the parent window.

#### Scenario: Unmute message received
- **GIVEN** the PixelStreaming instance is running with microphone muted
- **WHEN** a message with `type: 'rvo-ps-mic-unmute'` is received
- **THEN** `stream.unmuteMicrophone(true)` is called with `forceEnable=true`

#### Scenario: Unmute reconnects lost mic track
- **GIVEN** the PixelStreaming instance has no active microphone track
- **WHEN** a message with `type: 'rvo-ps-mic-unmute'` is received
- **THEN** `stream.unmuteMicrophone(true)` attempts to re-establish the microphone connection

#### Scenario: Unmute fails gracefully
- **GIVEN** the PixelStreaming instance exists
- **WHEN** an unmute message is received and `unmuteMicrophone()` throws an error
- **THEN** a warning is logged to the console
- **AND** no exception is thrown to the caller

### Requirement: Message Format
The system SHALL accept messages in the format `{ type: string, timestamp: number }`.

#### Scenario: Valid message format
- **GIVEN** a parent window sends a postMessage
- **WHEN** the message has `type` property matching a known message constant
- **THEN** the corresponding action is performed

#### Scenario: Unknown message type ignored
- **GIVEN** a parent window sends a postMessage
- **WHEN** the message `type` does not match any known constant
- **THEN** the message is silently ignored

### Requirement: No Origin Validation
The system SHALL accept messages from any origin without validation.

#### Scenario: Message from any origin accepted
- **GIVEN** a postMessage is received
- **WHEN** the message originates from any domain
- **THEN** the message is processed if it matches a known type

### Requirement: One-Way Communication
The system SHALL NOT send confirmation messages back to the parent window for mute/unmute operations.

#### Scenario: No response sent
- **GIVEN** a mute or unmute message is received and processed
- **WHEN** the operation completes (success or failure)
- **THEN** no postMessage is sent back to the parent window

### Requirement: Preserve Existing Behavior
The system SHALL maintain existing `UseMic: true` configuration behavior where microphone auto-enables on load.

#### Scenario: Mic auto-enables on load
- **GIVEN** the page loads with `UseMic: true` in config
- **WHEN** the stream connects
- **THEN** the microphone is automatically enabled
- **AND** postMessages can subsequently control mute/unmute state
