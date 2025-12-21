export * from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';
export * from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6';
import { Config, PixelStreaming, Logger, LogLevel } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';
import {
    Application,
    PixelStreamingApplicationStyle
} from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6';
import { POST_MESSAGE_EVENTS, POST_MESSAGE_TARGET, PM_PS_MIC_MUTE, PM_PS_MIC_UNMUTE } from './constants';

const PixelStreamingApplicationStyles = new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();

// expose the pixel streaming object for hooking into. tests etc.
declare global {
    interface Window {
        pixelStreaming: PixelStreaming;
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
    const stream = new PixelStreaming(config);

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

    // Listen for incoming postMessages to control microphone state
    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data as { type?: string } | null;
        if (!message || typeof message.type !== 'string') {
            return;
        }

        const messageType: string = message.type;
        if (messageType === PM_PS_MIC_MUTE) {
            try {
                stream.muteMicrophone();
            } catch (error) {
                console.warn('Failed to mute microphone:', error);
            }
        } else if (messageType === PM_PS_MIC_UNMUTE) {
            try {
                stream.unmuteMicrophone(true);
            } catch (error) {
                console.warn('Failed to unmute microphone:', error);
            }
        }
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
