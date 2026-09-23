export * from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';
export * from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6';
import { Config, Logger, LogLevel } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';
import {
    Application,
    PixelStreamingApplicationStyle
} from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6';
import { POST_MESSAGE_EVENTS, POST_MESSAGE_TARGET } from './constants';
import { MicBridge } from './micBridge';
import { RavatarPixelStreaming } from './ravatarPixelStreaming';

const PixelStreamingApplicationStyles = new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();

// expose the pixel streaming object for hooking into. tests etc.
declare global {
    interface Window {
        pixelStreaming: RavatarPixelStreaming;
    }
}

document.body.onload = function () {
    Logger.InitLogging(LogLevel.Warning, true);

    // Create a config object
    const config = new Config({
        useUrlParams: true,
        initialSettings: {
            AutoConnect: true,
            AutoPlayVideo: true,
            WaitForStreamer: true,
            MatchViewportRes: true,
            KeyboardInput: true,
            TouchInput: true,
            HoveringMouse: true,
            ControlsQuality: true,
            UseMic: true,
            HideUI: true
        }
    });

    // Create the main Pixel Streaming object for interfacing with the web-API of Pixel Streaming
    const stream = new RavatarPixelStreaming(config);

    // Microphone state handshake with the embedding chat widget
    const micBridge = new MicBridge({
        getMicSender: () => stream.getMicSender(),
        mute: () => stream.muteMicrophone(),
        unmute: () => stream.unmuteMicrophone(true),
        post: (payload: object) => {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, POST_MESSAGE_TARGET);
            }
        }
    });

    // Listen for events to handle session start and close in chat widget
    stream.addEventListener('videoInitialized', () => {
        if (window.parent) {
            window.parent.postMessage(POST_MESSAGE_EVENTS.SESSION_START, POST_MESSAGE_TARGET);
        }
    });

    stream.addEventListener('streamConnect', () => {
        if (window.parent) {
            window.parent.postMessage(POST_MESSAGE_EVENTS.SESSION_START, POST_MESSAGE_TARGET);
        }
    });

    stream.addEventListener('webRtcDisconnected', ({ data: { allowClickToReconnect } }) => {
        if (allowClickToReconnect && window.parent) {
            window.parent.postMessage(POST_MESSAGE_EVENTS.SESSION_CLOSE, POST_MESSAGE_TARGET);
        }
    });

    // The audio sender is created before the offer, so by the time these events fire
    // the microphone track exists. They also fire again after a reconnect, carrying a
    // brand new track that has to be brought back to the widget's desired state.
    stream.addEventListener('webRtcConnected', () => {
        micBridge.handleTrackReady('webrtc-connected');
    });

    stream.addEventListener('videoInitialized', () => {
        micBridge.handleTrackReady('video-initialized');
    });

    // Listen for incoming postMessages to control microphone state
    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data as { type?: string } | null;
        if (!message || typeof message.type !== 'string') {
            return;
        }

        micBridge.handleCommand(message.type);
    });

    // Override the showTextOverlay method to prevent any text overlays from being displayed
    Application.prototype.showTextOverlay = (text: string) => {
        console.log(text);
    };

    const application = new Application({
        stream,
        onColorModeChanged: (isLightMode) => PixelStreamingApplicationStyles.setColorMode(isLightMode)
    });

    document.body.appendChild(application.rootElement);

    window.pixelStreaming = stream;
};
