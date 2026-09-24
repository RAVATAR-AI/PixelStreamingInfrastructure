import { PM_PS_MIC_MUTE, PM_PS_MIC_READY, PM_PS_MIC_STATE, PM_PS_MIC_UNMUTE } from './constants';
import {
    MicBridge,
    MicReadyMessage,
    MicStateMessage,
    buildReadyMessage,
    buildStateMessage,
    isApplied,
    snapshotSender
} from './micBridge';

interface FakeTrack {
    kind: string;
    enabled: boolean;
    muted: boolean;
    readyState: string;
    label: string;
}

function makeTrack(overrides: Partial<FakeTrack> = {}): FakeTrack {
    return {
        kind: 'audio',
        enabled: true,
        muted: false,
        readyState: 'live',
        label: 'Fake Microphone',
        ...overrides
    };
}

function makeSender(track: FakeTrack | null): RTCRtpSender {
    return { track } as unknown as RTCRtpSender;
}

/**
 * Builds a bridge whose mute/unmute flip the fake track the way the library does
 * (`sender.track.enabled = !muted`), plus the recording harness around it.
 */
function makeHarness(options: { track?: FakeTrack | null; now?: number } = {}) {
    const state = { track: options.track === undefined ? makeTrack() : options.track };
    const posted: object[] = [];
    const calls: string[] = [];

    const bridge = new MicBridge({
        getMicSender: () => (state.track ? makeSender(state.track) : null),
        mute: () => {
            calls.push('mute');
            if (state.track) {
                state.track.enabled = false;
            }
        },
        unmute: () => {
            calls.push('unmute');
            if (state.track) {
                state.track.enabled = true;
            }
        },
        post: (payload: object) => {
            posted.push(payload);
        },
        now: () => options.now ?? 1000
    });

    return { bridge, posted, calls, state };
}

describe('snapshotSender', () => {
    it('reads an audio track into a plain snapshot', () => {
        const snapshot = snapshotSender(
            makeSender(makeTrack({ enabled: false, muted: true, readyState: 'live', label: 'Mic A' }))
        );

        expect(snapshot).toEqual({
            hasMicTrack: true,
            enabled: false,
            muted: true,
            readyState: 'live',
            label: 'Mic A'
        });
    });

    it('returns an empty snapshot when there is no sender', () => {
        expect(snapshotSender(null)).toEqual({
            hasMicTrack: false,
            enabled: null,
            muted: null,
            readyState: null,
            label: null
        });
    });

    it('returns an empty snapshot when the sender has no track', () => {
        expect(snapshotSender(makeSender(null))).toEqual({
            hasMicTrack: false,
            enabled: null,
            muted: null,
            readyState: null,
            label: null
        });
    });
});

describe('isApplied', () => {
    const withTrack = (enabled: boolean) => snapshotSender(makeSender(makeTrack({ enabled })));

    it('is true for mute when the track is disabled', () => {
        expect(isApplied('mute', withTrack(false))).toBe(true);
        expect(isApplied('mute', withTrack(true))).toBe(false);
    });

    it('is true for unmute when the track is enabled', () => {
        expect(isApplied('unmute', withTrack(true))).toBe(true);
        expect(isApplied('unmute', withTrack(false))).toBe(false);
    });

    it('is false for both when there is no track', () => {
        const empty = snapshotSender(null);
        expect(isApplied('mute', empty)).toBe(false);
        expect(isApplied('unmute', empty)).toBe(false);
    });
});

describe('message builders', () => {
    it('builds a ready payload with the protocol field names', () => {
        const payload = buildReadyMessage(
            'webrtc-connected',
            snapshotSender(makeSender(makeTrack({ enabled: false }))),
            42
        );

        expect(payload).toEqual({
            name: PM_PS_MIC_READY,
            reason: 'webrtc-connected',
            hasMicTrack: true,
            enabled: false,
            muted: false,
            readyState: 'live',
            label: 'Fake Microphone',
            timestamp: 42
        });
    });

    it('builds a state payload and derives `applied`', () => {
        const payload = buildStateMessage('unmute', snapshotSender(makeSender(makeTrack())), 7);

        expect(payload.name).toBe(PM_PS_MIC_STATE);
        expect(payload.requested).toBe('unmute');
        expect(payload.applied).toBe(true);
        expect(payload.timestamp).toBe(7);
    });
});

describe('MicBridge.handleCommand', () => {
    it('ignores unrelated message types and returns false', () => {
        const { bridge, posted, calls } = makeHarness();

        expect(bridge.handleCommand('ravatar-session-start')).toBe(false);
        expect(bridge.handleCommand('')).toBe(false);
        expect(posted).toHaveLength(0);
        expect(calls).toHaveLength(0);
        expect(bridge.desired).toBeNull();
    });

    it('applies mute then unmute and acks each with an applied state message', () => {
        const { bridge, posted, calls } = makeHarness();

        expect(bridge.handleCommand(PM_PS_MIC_MUTE)).toBe(true);
        expect(bridge.desired).toBe('mute');

        expect(bridge.handleCommand(PM_PS_MIC_UNMUTE)).toBe(true);
        expect(bridge.desired).toBe('unmute');

        expect(calls).toEqual(['mute', 'unmute']);
        expect(posted).toHaveLength(2);

        const [muteAck, unmuteAck] = posted as MicStateMessage[];
        expect(muteAck).toMatchObject({
            name: PM_PS_MIC_STATE,
            requested: 'mute',
            applied: true,
            hasMicTrack: true,
            enabled: false
        });
        expect(unmuteAck).toMatchObject({
            name: PM_PS_MIC_STATE,
            requested: 'unmute',
            applied: true,
            hasMicTrack: true,
            enabled: true
        });
    });

    it('acks with hasMicTrack false when there is no track yet, but remembers the request', () => {
        const { bridge, posted } = makeHarness({ track: null });

        expect(bridge.handleCommand(PM_PS_MIC_UNMUTE)).toBe(true);
        expect(bridge.desired).toBe('unmute');
        expect(posted).toHaveLength(1);
        expect(posted[0]).toMatchObject({
            name: PM_PS_MIC_STATE,
            requested: 'unmute',
            applied: false,
            hasMicTrack: false,
            enabled: null
        });
    });

    it('survives a throwing mute() and still acks', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const posted: object[] = [];
        const track = makeTrack();
        const bridge = new MicBridge({
            getMicSender: () => makeSender(track),
            mute: () => {
                throw new Error('mute exploded');
            },
            unmute: () => {
                throw new Error('unmute exploded');
            },
            post: (payload: object) => {
                posted.push(payload);
            },
            now: () => 5
        });

        expect(() => bridge.handleCommand(PM_PS_MIC_MUTE)).not.toThrow();
        expect(() => bridge.handleCommand(PM_PS_MIC_UNMUTE)).not.toThrow();
        expect(bridge.desired).toBe('unmute');
        expect(posted).toHaveLength(2);
        // The track never flipped, so the mute ack reports `applied: false`.
        expect(posted[0]).toMatchObject({ requested: 'mute', applied: false, enabled: true });
        expect(posted[1]).toMatchObject({ requested: 'unmute', applied: true, enabled: true });
        expect(warn).toHaveBeenCalled();

        warn.mockRestore();
    });
});

describe('MicBridge.handleTrackReady', () => {
    it('re-applies a remembered mute onto a fresh enabled track before announcing ready', () => {
        const { bridge, posted, calls, state } = makeHarness();

        bridge.handleCommand(PM_PS_MIC_MUTE);
        posted.length = 0;
        calls.length = 0;

        // A reconnect hands us a brand new track that defaults to enabled.
        state.track = makeTrack({ enabled: true, label: 'Reconnected Mic' });

        bridge.handleTrackReady('webrtc-connected');

        expect(calls).toEqual(['mute']);
        expect(state.track.enabled).toBe(false);
        expect(posted).toHaveLength(1);

        const ready = posted[0] as MicReadyMessage;
        expect(ready).toMatchObject({
            name: PM_PS_MIC_READY,
            reason: 'webrtc-connected',
            hasMicTrack: true,
            enabled: false,
            label: 'Reconnected Mic'
        });
    });

    it('does not touch the microphone when nothing was requested yet', () => {
        const { bridge, posted, calls, state } = makeHarness();

        bridge.handleTrackReady('video-initialized');

        expect(calls).toHaveLength(0);
        expect(state.track?.enabled).toBe(true);
        expect(posted).toHaveLength(1);
        expect(posted[0]).toMatchObject({
            name: PM_PS_MIC_READY,
            reason: 'video-initialized',
            hasMicTrack: true,
            enabled: true
        });
    });

    it('announces readiness with hasMicTrack false when no track exists', () => {
        const { bridge, posted } = makeHarness({ track: null });

        bridge.handleTrackReady('webrtc-connected');

        expect(posted).toHaveLength(1);
        expect(posted[0]).toMatchObject({
            name: PM_PS_MIC_READY,
            hasMicTrack: false,
            enabled: null,
            readyState: null
        });
    });
});
