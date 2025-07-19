# Pixel Streaming Events

## AFK (Away From Keyboard) Events
- **`afkWarningActivate`** - Emitted when AFK disconnect is about to happen. Can be cancelled by calling the callback function provided as part of the event.
- **`afkWarningUpdate`** - Emitted when the AFK disconnect countdown is updated.
- **`afkWarningDeactivate`** - Emitted when AFK warning is deactivated.
- **`afkTimedOut`** - Emitted when AFK countdown reaches 0 and the user is disconnected.

## Video Quality & Encoder Events
- **`videoEncoderAvgQP`** - Emitted when we receive new video quality value.

## WebRTC Connection Events
- **`webRtcSdp`** - Emitted after a WebRtc connection has been negotiated.
- **`webRtcSdpAnswer`** - Emitted after the SDP answer is set.
- **`webRtcSdpOffer`** - Emitted after the SDP offer is set.
- **`webRtcAutoConnect`** - Emitted when auto connecting.
- **`webRtcConnecting`** - Emitted when sending a WebRtc offer.
- **`webRtcConnected`** - Emitted when WebRtc connection has been established.
- **`webRtcFailed`** - Emitted if WebRtc connection has failed.
- **`webRtcDisconnected`** - Emitted if WebRtc connection is disconnected.
- **`webRtcTCPRelayDetected`** - Emitted when the webRTC connections is relayed over TCP.

## Data Channel Events
- **`dataChannelOpen`** - Emitted when RTCDataChannel is opened.
- **`dataChannelClose`** - Emitted when RTCDataChannel is closed.
- **`dataChannelError`** - Emitted on RTCDataChannel errors.

## Video Stream Events
- **`videoInitialized`** - Emitted when the video stream has been initialized.
- **`streamLoading`** - Emitted when video stream loading starts.
- **`streamConnect`** - Emitted when video stream loading has finished.
- **`streamDisconnect`** - Emitted when video stream has stopped.
- **`streamReconnect`** - Emitted when video stream is reconnecting.
- **`playStreamError`** - Emitted if there are errors loading the video stream.
- **`playStream`** - Emitted before trying to start video playback.
- **`playStreamRejected`** - Emitted if the browser rejects video playback (e.g., when video auto-play without user interaction is refused by the browser).

## Freeze Frame Events
- **`loadFreezeFrame`** - Emitted when receiving a full FreezeFrame image from UE.
- **`hideFreezeFrame`** - Emitted when receiving UnfreezeFrame message from UE and video playback is about to be resumed.

## Statistics & Performance Events
- **`statsReceived`** - Emitted when receiving WebRTC statistics.
- **`latencyTestResult`** - Emitted when receiving latency test results.
- **`latencyCalculated`** - Emitted everytime latency is calculated using the WebRTC stats API.
- **`dataChannelLatencyTestResponse`** - Emitted when receiving data channel latency test response from server (handled by DataChannelLatencyTestController).
- **`dataChannelLatencyTestResult`** - Emitted when data channel latency test results are ready.

## Streamer Management Events
- **`streamerListMessage`** - Emitted when streamer list changes.
- **`streamerIDChangedMessage`** - Emitted when a subscribed to streamer's id changes.
- **`subscribeFailed`** - Emitted when subscription fails.
- **`playerCount`** - Emitted when receiving a player count from the signalling server.

## Settings & Configuration Events
- **`initialSettings`** - Emitted when receiving initial settings from UE.
- **`settingsChanged`** - Emitted when PixelStreaming settings change.

## UI Events
- **`showOnScreenKeyboard`** - Emitted when we receive the "onScreenKeyboard" command from UE.

## XR (Extended Reality) Events
- **`xrSessionStarted`** - Event emitted when an XR Session starts.
- **`xrSessionEnded`** - Event emitted when an XR Session ends.
- **`xrFrame`** - Event emitted when an XR