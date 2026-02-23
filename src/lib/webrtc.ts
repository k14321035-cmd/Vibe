/**
 * Clean WebRTC service with two distinct signaling paths:
 *  - OFFERER path: `initiateConnection` → auto-negotiates via onnegotiationneeded
 *  - ANSWERER path: `respondToOffer` → handles offer, sends answer, then adds tracks
 *
 * ICE candidates are queued per peer and flushed automatically after
 * setRemoteDescription, eliminating the "remote description was null" race.
 */

const pcs = new Map<string, RTCPeerConnection>();
// ICE candidate queue: holds candidates that arrived before remote description was set
const iceQueues = new Map<string, RTCIceCandidateInit[]>();

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

type OnStreamFn = (stream: MediaStream) => void;
type OnSignalFn = (type: 'offer' | 'answer' | 'ice-candidate', data: any) => void;

/** Apply any queued ICE candidates for this peer after remote description is set. */
async function flushIceQueue(userId: string) {
  const pc = pcs.get(userId);
  const queue = iceQueues.get(userId) ?? [];
  if (!pc || queue.length === 0) return;

  console.log(`[WebRTC] Flushing ${queue.length} queued ICE candidates for ${userId}`);
  for (const candidate of queue) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WebRTC] Queued ICE candidate error:', err);
    }
  }
  iceQueues.set(userId, []); // clear after flushing
}

function buildPC(
  userId: string,
  onStream: OnStreamFn,
  onSignal: OnSignalFn
): RTCPeerConnection {
  // Close any existing connection cleanly
  if (pcs.has(userId)) {
    pcs.get(userId)!.close();
    pcs.delete(userId);
  }
  iceQueues.set(userId, []); // fresh queue for this peer

  const pc = new RTCPeerConnection(ICE);
  pcs.set(userId, pc);

  // Build a stable MediaStream per remote peer
  const remoteStream = new MediaStream();

  pc.ontrack = (event) => {
    console.log(`[WebRTC] Track from ${userId}:`, event.track.kind);
    const stream = event.streams[0];
    if (stream) {
      onStream(stream);
    } else {
      if (!remoteStream.getTrackById(event.track.id)) {
        remoteStream.addTrack(event.track);
      }
      onStream(remoteStream);
    }
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) onSignal('ice-candidate', e.candidate);
  };

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    console.log(`[WebRTC] ${userId}: ${state}`);
    if (state === 'failed') {
      pc.close();
      pcs.delete(userId);
      iceQueues.delete(userId);
    }
  };

  return pc;
}

export const webrtcService = {
  /**
   * OFFERER path — call this when YOU are initiating the connection.
   * Adds local tracks. onnegotiationneeded automatically fires the offer.
   */
  async initiateConnection(
    remoteUserId: string,
    localStream: MediaStream | null,
    onStream: OnStreamFn,
    onSignal: OnSignalFn
  ) {
    const pc = buildPC(remoteUserId, onStream, onSignal);

    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(await pc.createOffer());
        onSignal('offer', pc.localDescription);
        console.log(`[WebRTC] Offer sent to ${remoteUserId}`);
      } catch (err) {
        console.error('[WebRTC] onnegotiationneeded error:', err);
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    } else {
      try {
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(await pc.createOffer());
        onSignal('offer', pc.localDescription);
      } catch (err) {
        console.error('[WebRTC] Manual offer error:', err);
      }
    }
  },

  /**
   * ANSWERER path — call this when you RECEIVE an offer.
   * Two-phase strategy:
   *   Phase 1 – Accept offer, send answer (no local tracks yet)
   *   Phase 2 – Add local tracks to established connection → onnegotiationneeded renegotiates
   */
  async respondToOffer(
    remoteUserId: string,
    offer: RTCSessionDescriptionInit,
    localStream: MediaStream | null,
    onStream: OnStreamFn,
    onSignal: OnSignalFn
  ) {
    const pc = buildPC(remoteUserId, onStream, onSignal);

    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(await pc.createOffer());
        onSignal('offer', pc.localDescription);
        console.log(`[WebRTC] Renegotiation offer sent to ${remoteUserId}`);
      } catch (err) {
        console.error('[WebRTC] Renegotiation error:', err);
      }
    };

    // Phase 1: set remote description and answer
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIceQueue(remoteUserId); // flush any candidates that arrived early
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    onSignal('answer', pc.localDescription);
    console.log(`[WebRTC] Answer sent to ${remoteUserId}`);

    // Phase 2: add local tracks after answer → triggers renegotiation
    if (localStream) {
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    }
  },

  /** Handle an incoming answer (offerer side). */
  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit) {
    const pc = pcs.get(userId);
    if (!pc) return;
    try {
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushIceQueue(userId); // flush any candidates that arrived before answer
      }
    } catch (err) {
      console.error('[WebRTC] handleAnswer error:', err);
    }
  },

  /** Handle an incoming offer for RENEGOTIATION on an existing connection. */
  async handleRenegotiationOffer(
    userId: string,
    offer: RTCSessionDescriptionInit,
    onSignal: OnSignalFn
  ) {
    const pc = pcs.get(userId);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIceQueue(userId); // flush any queued candidates
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      onSignal('answer', pc.localDescription);
    } catch (err) {
      console.error('[WebRTC] handleRenegotiationOffer error:', err);
    }
  },

  /** Add or queue an ICE candidate. Queued if remote description not yet set. */
  async addIceCandidate(userId: string, candidate: RTCIceCandidateInit) {
    const pc = pcs.get(userId);
    if (!pc) return;

    // If no remote description yet, queue for later
    if (!pc.remoteDescription) {
      const queue = iceQueues.get(userId) ?? [];
      queue.push(candidate);
      iceQueues.set(userId, queue);
      console.log(`[WebRTC] Queued ICE candidate for ${userId} (remote desc not ready)`);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WebRTC] addIceCandidate error:', err);
    }
  },

  /**
   * Replace tracks in existing connections with tracks from a new stream.
   * Uses replaceTrack (no renegotiation). For new track kinds, addTrack triggers onnegotiationneeded.
   */
  async upgradeStream(userId: string, newStream: MediaStream) {
    const pc = pcs.get(userId);
    if (!pc) return;
    for (const track of newStream.getTracks()) {
      const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
      if (sender) {
        await sender.replaceTrack(track);
      } else {
        pc.addTrack(track, newStream);
      }
    }
  },

  getAllPeerIds(): string[] {
    return [...pcs.keys()];
  },

  closePeerConnection(userId: string) {
    pcs.get(userId)?.close();
    pcs.delete(userId);
    iceQueues.delete(userId);
  },

  closeAllPeerConnections() {
    pcs.forEach(pc => pc.close());
    pcs.clear();
    iceQueues.clear();
  },
};
