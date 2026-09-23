import { PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';

/**
 * Thin subclass of {@link PixelStreaming} that exposes the outgoing microphone
 * sender. `_webRtcController` is `protected` on the base class, so a subclass is
 * the only way to reach the peer connection without patching the library.
 */
export class RavatarPixelStreaming extends PixelStreaming {
    /**
     * @returns the RTCRtpSender the library's own mute/unmute would act on: the
     * sender of a transceiver that can send audio (direction `sendrecv` or
     * `sendonly`, carrying an audio track), mirroring
     * `RTCUtils.canTransceiverSendAudio`. `null` when the peer connection, the
     * transceiver or the track is not (yet) available, so a snapshot never
     * describes a track the library would not touch.
     */
    public getMicSender(): RTCRtpSender | null {
        try {
            const transceivers =
                this._webRtcController?.peerConnectionController?.peerConnection?.getTransceivers();
            if (!transceivers) {
                return null;
            }

            for (const transceiver of transceivers) {
                const canSend =
                    transceiver?.direction === 'sendrecv' || transceiver?.direction === 'sendonly';
                if (canSend && transceiver.sender?.track?.kind === 'audio') {
                    return transceiver.sender;
                }
            }

            return null;
        } catch (_error) {
            return null;
        }
    }
}
