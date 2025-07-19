# AllSettings - Complete Configuration Reference

The `AllSettings` type represents all possible configuration settings in the Pixel Streaming system. Here's the **accurate** breakdown based on the actual implementation:

## Type Definition

```typescript
export type AllSettings = {
    [K in OptionIds]: OptionKeys<K>;
};
```

## Flag Settings (boolean values)

These are toggle switches that can be enabled or disabled. **Note**: The static property names don't always match the actual setting IDs.

### Connection & Streaming
- **`AutoConnect`** - Automatically connect to the streaming server on load
- **`AutoPlayVideo`** - Automatically start playing video when connection is established  
- **`WaitForStreamer`** - Wait for a streamer to be available before connecting
- **`BrowserSendOffer`** - Browser initiates WebRTC connection offer
- **`TimeoutIfIdle`** (ID for `AFKDetection`) - Enable AFK (Away From Keyboard) timeout detection
- **`ForceTURN`** - Force use of TURN servers for WebRTC connection only

### Audio & Video Controls  
- **`StartVideoMuted`** - Start with video muted
- **`ForceMonoAudio`** - Force audio to mono channel
- **`MatchViewportRes`** (ID for `MatchViewportResolution`) - Dynamically resize video stream to match video element size

### Mouse & Input Controls
- **`HoveringMouse`** (ID for `HoveringMouseMode`) - Use hovering mouse mode instead of locked mouse mode
  - `false` = Locked mouse (pointer captured and locked to video)
  - `true` = Hovering mouse (requires click and hold for input)
- **`FakeMouseWithTouches`** - Convert single finger touch events to mouse events
- **`KeyboardInput`** - Enable keyboard input forwarding to streamer
- **`MouseInput`** - Enable mouse input forwarding to streamer  
- **`TouchInput`** - Enable touch input forwarding to streamer
- **`GamepadInput`** - Enable gamepad input forwarding to streamer
- **`XRControllerInput`** - Enable XR controller input forwarding to streamer
- **`SuppressBrowserKeys`** - Prevent browser from handling certain key combinations (e.g., F5)

### Media Devices
- **`UseMic`** - Enable microphone input
- **`UseCamera`** - Enable camera input

### Quality & Performance  
- **`ControlsQuality`** (ID for `IsQualityController`) - Allow this client to control stream quality based on bandwidth

### User Interface
- **`HideUI`** - Hide the default UI controls
- **`UseModalForTextInput`** - Use modal dialog for text input

### Development & Debugging
- **`EnableCaptureTimeExt`** - Enable capture time extension for latency measurement
- **`LatencyCSV`** - Export latency data to CSV format

## Numeric Settings (number values)

These control numerical parameters with their actual IDs:

### Timeout Settings
- **`AFKTimeout`** (from `AFKTimeoutSecs`) - Time in seconds before AFK timeout triggers
- **`AFKCountdown`** (from `AFKCountdownSecs`) - Countdown time in seconds before AFK disconnect

### Video Quality Parameters
- **`MinQP`** - Minimum quantization parameter for video encoding
- **`MaxQP`** - Maximum quantization parameter for video encoding  
- **`MinQuality`** - Minimum quality level
- **`MaxQuality`** - Maximum quality level
- **`CompatQualityMin`** - Minimum compatibility quality level
- **`CompatQualityMax`** - Maximum compatibility quality level

### WebRTC Settings
- **`WebRTCFPS`** - Target frames per second for WebRTC stream
- **`WebRTCMinBitrate`** - Minimum bitrate for WebRTC connection (bps)
- **`WebRTCMaxBitrate`** - Maximum bitrate for WebRTC connection (bps)

### Connection Management
- **`MaxReconnectAttempts`** - Maximum number of reconnection attempts
- **`StreamerAutoJoinInterval`** - Interval for auto-joining streamers (milliseconds)
- **`KeepaliveDelay`** - Delay between keepalive messages (milliseconds)

## Text Settings (string values)

- **`ss`** (ID for `SignallingServerUrl`) - WebSocket URL of the signalling server
  - Default: `ws://` or `wss://` + current hostname + port

## Option Settings (string values)

These are enumerated options with predefined choices:

- **`PreferredCodec`** - Preferred video codec (e.g., "H264", "VP8", "VP9")
- **`StreamerId`** - ID of the specific streamer to connect to  
- **`PreferredQuality`** - Preferred quality setting

## Key Corrections from Previous Description

1. **`AFKDetection`** maps to ID **`TimeoutIfIdle`** (not `AFKDetection`)
2. **`HoveringMouseMode`** maps to ID **`HoveringMouse`** (not `HoveringMouseMode`)  
3. **`MatchViewportResolution`** maps to ID **`MatchViewportRes`** (not `MatchViewportResolution`)
4. **`IsQualityController`** maps to ID **`ControlsQuality`** (not `IsQualityController`)
5. **`SignallingServerUrl`** maps to ID **`ss`** (not `SignallingServerUrl`)
6. Numeric parameters like **`AFKTimeoutSecs`** map to IDs like **`AFKTimeout`**

## Usage Examples

### Setting Multiple Values
```typescript
// Correct usage with actual setting IDs
const settings: Partial<AllSettings> = {
    AutoConnect: true,
    TimeoutIfIdle: true,        // Not AFKDetection
    AFKTimeout: 600,            // Not AFKTimeoutSecs  
    HoveringMouse: true,        // Not HoveringMouseMode
    MatchViewportRes: false,    // Not MatchViewportResolution
    ss: "wss://myserver.com:8888", // Not SignallingServerUrl
    PreferredCodec: "H264"
};

config.setSettings(settings);
```

### Getting All Settings
```typescript
const allCurrentSettings = config.getSettings();
console.log(allCurrentSettings.AutoConnect); // boolean
console.log(allCurrentSettings.AFKTimeout);  // number
console.log(allCurrentSettings.ss);          // string (signalling server URL)
```

### Individual Setting Management
```typescript
// Working with flags
config.setFlagEnabled(Flags.HoveringMouseMode, true); // Uses class property
console.log(config.isFlagEnabled(Flags.AutoConnect));

// Working with numeric settings  
config.setNumericSetting(NumericParameters.AFKTimeoutSecs, 300);
console.log(config.getNumericSettingValue(NumericParameters.WebRTCFPS));

// Working with text settings
config.setTextSetting(TextParameters.SignallingServerUrl, "wss://example.com:8888");
console.log(config.getTextSettingValue(TextParameters.SignallingServerUrl));

// Working with option settings
config.setOptionSettingValue(OptionParameters.PreferredCodec, "VP9");
```

## Important Notes

- The static class properties (like `Flags.AFKDetection`) provide convenient constants for code readability
- The actual setting IDs used in `AllSettings` type are the string values assigned to those properties
- When using URL parameters, the setting IDs (not the class property names) are used as parameter names
- Some settings have different default values depending on the browser environment and capabilities

This comprehensive settings system allows fine-grained control over every aspect of the Pixel Streaming experience, from connection behavior to input handling and quality management.
