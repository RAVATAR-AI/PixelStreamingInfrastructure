import { PM_PS_MIC_MUTE, PM_PS_MIC_READY, PM_PS_MIC_STATE, PM_PS_MIC_UNMUTE } from './constants';

/** The microphone state the widget asked the pixel to be in. */
export type MicDesired = 'mute' | 'unmute';

/** Why the pixel believes a (new) microphone track is available. */
export type MicReadyReason = 'webrtc-connected' | 'video-initialized';

/** Observable facts about the outgoing microphone track, safe to serialize. */
export interface MicSnapshot {
    hasMicTrack: boolean;
    enabled: boolean | null;
    muted: boolean | null;
    readyState: string | null;
    label: string | null;
}

/** `ravatar-ps-mic-ready` — the pixel has (or regained) a microphone track. */
export interface MicReadyMessage extends MicSnapshot {
    name: typeof PM_PS_MIC_READY;
    reason: MicReadyReason;
    timestamp: number;
}

/** `ravatar-ps-mic-state` — acknowledgement of a mute/unmute command. */
export interface MicStateMessage extends MicSnapshot {
    name: typeof PM_PS_MIC_STATE;
    requested: MicDesired;
    applied: boolean;
    timestamp: number;
}

const EMPTY_SNAPSHOT: MicSnapshot = {
    hasMicTrack: false,
    enabled: null,
    muted: null,
    readyState: null,
    label: null
};

/**
 * Reads the track of a sender into a plain object. Pure: never touches the DOM
 * beyond the passed sender and never throws on partially-formed senders.
 */
export function snapshotSender(sender: RTCRtpSender | null): MicSnapshot {
    const track = sender?.track;
    if (!track) {
        return { ...EMPTY_SNAPSHOT };
    }

    return {
        hasMicTrack: true,
        enabled: typeof track.enabled === 'boolean' ? track.enabled : null,
        muted: typeof track.muted === 'boolean' ? track.muted : null,
        readyState: typeof track.readyState === 'string' ? track.readyState : null,
        label: typeof track.label === 'string' ? track.label : null
    };
}

/** True when the observed track already matches the requested state. */
export function isApplied(requested: MicDesired, snapshot: MicSnapshot): boolean {
    return snapshot.hasMicTrack && snapshot.enabled === (requested === 'unmute');
}

/** Builds the `ravatar-ps-mic-ready` payload. Pure. */
export function buildReadyMessage(
    reason: MicReadyReason,
    snapshot: MicSnapshot,
    now: number
): MicReadyMessage {
    return {
        name: PM_PS_MIC_READY,
        reason,
        hasMicTrack: snapshot.hasMicTrack,
        enabled: snapshot.enabled,
        muted: snapshot.muted,
        readyState: snapshot.readyState,
        label: snapshot.label,
        timestamp: now
    };
}

/** Builds the `ravatar-ps-mic-state` payload. Pure. */
export function buildStateMessage(
    requested: MicDesired,
    snapshot: MicSnapshot,
    now: number
): MicStateMessage {
    return {
        name: PM_PS_MIC_STATE,
        requested,
        applied: isApplied(requested, snapshot),
        hasMicTrack: snapshot.hasMicTrack,
        enabled: snapshot.enabled,
        muted: snapshot.muted,
        readyState: snapshot.readyState,
        label: snapshot.label,
        timestamp: now
    };
}

export interface MicBridgeDeps {
    /** Resolves the current outgoing audio sender, or `null` when there is none. */
    getMicSender: () => RTCRtpSender | null;
    /** Applies the muted state (usually `stream.muteMicrophone()`). */
    mute: () => void;
    /** Applies the unmuted state (usually `stream.unmuteMicrophone(true)`). */
    unmute: () => void;
    /** Delivers a payload to the parent window. */
    post: (payload: object) => void;
    /** Clock injection point; defaults to `Date.now`. */
    now?: () => number;
}

/**
 * State machine for the widget <-> pixel microphone handshake.
 *
 * The desired state is sticky: once the widget has asked for mute or unmute, the
 * bridge re-applies it every time a track (re)appears, so a WebRTC reconnect that
 * hands us a brand new, enabled track cannot silently un-mute the microphone.
 *
 * Deliberately free of browser globals (apart from the injected callbacks) so the
 * whole state machine is unit-testable.
 */
export class MicBridge {
    private readonly deps: MicBridgeDeps;
    private currentDesired: MicDesired | null = null;

    constructor(deps: MicBridgeDeps) {
        this.deps = deps;
    }

    /** The last state requested by the widget, or `null` if none was requested yet. */
    public get desired(): MicDesired | null {
        return this.currentDesired;
    }

    /**
     * Handles an incoming postMessage `type`.
     *
     * @returns `true` when the type was a microphone command (and was handled),
     * `false` when the caller should keep looking for another handler.
     */
    public handleCommand(type: string): boolean {
        let requested: MicDesired;
        if (type === PM_PS_MIC_MUTE) {
            requested = 'mute';
        } else if (type === PM_PS_MIC_UNMUTE) {
            requested = 'unmute';
        } else {
            return false;
        }

        this.currentDesired = requested;
        this.applyDesired(requested);
        this.post(buildStateMessage(requested, this.snapshot(), this.now()));
        return true;
    }

    /**
     * Called when the library reports a connection milestone that implies a fresh
     * audio sender. Re-applies the remembered state before announcing readiness so
     * the payload the widget receives already reflects the desired state.
     */
    public handleTrackReady(reason: MicReadyReason): void {
        if (this.currentDesired !== null) {
            this.applyDesired(this.currentDesired);
        }

        this.post(buildReadyMessage(reason, this.snapshot(), this.now()));
    }

    private applyDesired(desired: MicDesired): void {
        try {
            if (desired === 'mute') {
                this.deps.mute();
            } else {
                this.deps.unmute();
            }
        } catch (error) {
            console.warn(`Failed to apply microphone state "${desired}":`, error);
        }
    }

    private snapshot(): MicSnapshot {
        try {
            return snapshotSender(this.deps.getMicSender());
        } catch (error) {
            console.warn('Failed to read microphone sender:', error);
            return { ...EMPTY_SNAPSHOT };
        }
    }

    private post(payload: object): void {
        try {
            this.deps.post(payload);
        } catch (error) {
            console.warn('Failed to post microphone message to parent:', error);
        }
    }

    private now(): number {
        return this.deps.now ? this.deps.now() : Date.now();
    }
}
