/**
 * Constants for Ravatar Pixel Streaming implementation
 */

export const POST_MESSAGE_EVENTS = {
    SESSION_START: 'ravatar-session-start',
    SESSION_CLOSE: 'ravatar-session-close'
} as const;

export const POST_MESSAGE_TARGET = '*';

// Incoming postMessage constants for microphone control
export const PM_PS_MIC_MUTE = 'rvo-ps-mic-mute';
export const PM_PS_MIC_UNMUTE = 'rvo-ps-mic-unmute';

// Outgoing postMessage constants for the microphone state handshake (pixel -> widget).
// These are dispatched by the widget on `event.data.name`, unlike the incoming
// commands above which are dispatched on `event.data.type`.
export const PM_PS_MIC_READY = 'ravatar-ps-mic-ready';
export const PM_PS_MIC_STATE = 'ravatar-ps-mic-state';
