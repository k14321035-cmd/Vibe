import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';
import { webrtcService } from '../lib/webrtc';
import VideoGrid from '../components/VideoGrid';
import ChatBox from '../components/ChatBox';
import GameArea from '../components/GameArea';
import { LogOut, Users, Gamepad2, ArrowLeft } from 'lucide-react';
import { User, Message, Room, GameType } from '../types';
import BottomNav from '../components/BottomNav';

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // ─── Core Room State ───────────────────────────────────────────────────────
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gameType, setGameType] = useState<GameType>(GameType.NONE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Media State ───────────────────────────────────────────────────────────
  // localStreamRef is a useRef so socket callbacks always have the latest value
  // (avoids stale closures). localStream state drives UI re-renders.
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);

  // ─── UI State ──────────────────────────────────────────────────────────────
  const [activeSidebar, setActiveSidebar] = useState<'CHAT' | 'GAME' | 'NONE'>('NONE');
  const [mediaRequests, setMediaRequests] = useState<{ userId: string; username: string; type: 'audio' | 'video' }[]>([]);

  const roomId = params.roomId || '';
  const socket = getSocket();

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Keeps both the ref and state in sync when we get a new local stream. */
  const setStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsMicOn(stream?.getAudioTracks()[0]?.enabled ?? false);
    setIsCamOn(stream?.getVideoTracks()[0]?.enabled ?? false);
  }, []);

  /**
   * Acquires a media stream with the given constraints.
   * If an existing stream exists, replaces tracks in all active peer connections
   * using RTCRtpSender.replaceTrack() — no re-connection needed.
   * If no connections exist yet, just stores the stream.
   */
  const acquireMedia = useCallback(async (video: boolean, audio: boolean) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('[Media] getUserMedia not supported');
      return;
    }
    try {
      // Stop old tracks cleanly
      localStreamRef.current?.getTracks().forEach(t => t.stop());

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio,
      });

      setStream(newStream);

      // Push new tracks to all existing peer connections
      const peerIds = webrtcService.getAllPeerIds();
      for (const peerId of peerIds) {
        await webrtcService.upgradeStream(peerId, newStream);
      }
    } catch (err) {
      console.error('[Media] Failed to acquire media:', err);
    }
  }, [setStream]);

  /** Signal helper — wraps socket.emit for WebRTC signaling. */
  const sendSignal = useCallback((to: string, type: 'offer' | 'answer' | 'ice-candidate', data: any) => {
    socket?.emit(`webrtc-${type}`, { to, [type === 'ice-candidate' ? 'candidate' : type]: data });
  }, [socket]);

  /**
   * OFFERER: Send offers to a remote peer when WE join the room.
   * The newcomer always initiates — existing peers just respond.
   */
  const connectToPeer = useCallback(async (remoteUserId: string) => {
    if (!socket || remoteUserId === currentUser?.id) return;
    console.log(`[WebRTC] Initiating to ${remoteUserId}`);
    await webrtcService.initiateConnection(
      remoteUserId,
      localStreamRef.current,
      (stream) => setRemoteStreams(prev => new Map(prev).set(remoteUserId, stream)),
      (type, data) => sendSignal(remoteUserId, type, data)
    );
  }, [socket, currentUser, sendSignal]);

  // ─── Room Initialization ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !roomId) { navigate('/lobby'); return; }

    const init = async () => {
      try {
        const { room: roomData } = await api.getRoom(roomId);
        setRoom(roomData);
        setMessages(roomData.messages ?? []);
        setGameType(roomData.activeGame ?? GameType.NONE);

        const isHost = roomData.hostId === currentUser.id;

        // Host gets camera/mic immediately; guests start in listen-only mode
        if (isHost) {
          await acquireMedia(true, true);
        }

        // Join the socket room — on success, connect to everyone already present
        socket?.emit('join-room', { roomId }, async (result: any) => {
          if (!result.success) {
            setError(result.error || 'Failed to join room');
            navigate('/lobby');
            return;
          }
          setParticipants(result.room.participants ?? []);
          setLoading(false); // Only mark ready after socket confirms join

          // Send offer to each existing participant
          for (const p of (result.room.participants ?? [])) {
            if (p.id !== currentUser.id) {
              await connectToPeer(p.id);
            }
          }
        });
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    init();

    return () => {
      // Use ref for cleanup — state is stale at mount time
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      socket?.emit('leave-room');
      webrtcService.closeAllPeerConnections();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUser?.id]);

  // ─── Socket Event Listeners ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg: Message) => setMessages(prev => [...prev, msg]);

    const onUserJoined = (data: any) => {
      setParticipants(data.onlineUsers);
      setMessages(prev => [...prev, data.message]);
      // The NEW user initiates to us; we just wait for their offer.
      // Nothing to do here — avoids race conditions.
    };

    const onUserLeft = (data: any) => {
      setParticipants(data.onlineUsers);
      setMessages(prev => [...prev, data.message]);
      webrtcService.closePeerConnection(data.userId);
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    const onGameStarted = (data: any) => setGameType(data.gameType);
    const onGameEnded = () => setGameType(GameType.NONE);

    // Full room state broadcast — received by new joiners immediately after join
    const onRoomState = (data: any) => {
      if (data.room) setRoom(data.room);
      if (data.messages?.length) {
        setMessages(data.messages.filter(Boolean));
      }
      if (data.participants) {
        setParticipants(data.participants);
      }
      if (data.activeGame) {
        setGameType(data.activeGame as GameType);
      }
      // If a game is active and has current data, re-emit it so GameArea renders
      if (data.gameData && data.activeGame && data.activeGame !== 'NONE') {
        socket.emit('_client_game_hydrate__noop'); // triggers nothing, just documentation
        // Directly dispatch game-started so GameArea picks it up
        socket.emit('game-started', { gameType: data.activeGame, gameData: data.gameData });
      }
    };

    const onMediaRequest = (data: { userId: string; username: string; type: 'audio' | 'video' }) => {
      setMediaRequests(prev => [...prev, data]);
    };

    const onPermissionsChanged = async (data: { userId: string; canSpeak?: boolean; canVideo?: boolean }) => {
      setParticipants(prev => prev.map(p => p.id === data.userId ? { ...p, ...data } : p));
      if (data.userId === currentUser?.id) {
        const needAudio = !!data.canSpeak;
        const needVideo = !!data.canVideo;
        if (needAudio || needVideo) await acquireMedia(needVideo, needAudio);
      }
    };

    // ── WebRTC Signaling ────────────────────────────────────────────────────

    const onOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received offer from:', data.from);

      // Check if we already have a connection for this peer (renegotiation)
      const existingPeerIds = webrtcService.getAllPeerIds();
      if (existingPeerIds.includes(data.from)) {
        // Renegotiation on existing connection
        await webrtcService.handleRenegotiationOffer(data.from, data.offer, (type, signalData) => {
          sendSignal(data.from, type, signalData);
        });
      } else {
        // New connection — ANSWERER path (2-phase: exchange offer/answer, then add tracks)
        await webrtcService.respondToOffer(
          data.from,
          data.offer,
          localStreamRef.current,   // use ref — never stale
          (stream) => setRemoteStreams(prev => new Map(prev).set(data.from, stream)),
          (type, signalData) => sendSignal(data.from, type, signalData)
        );
      }
    };

    const onAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      await webrtcService.handleAnswer(data.from, data.answer);
    };

    const onIce = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      await webrtcService.addIceCandidate(data.from, data.candidate);
    };

    socket.on('new-message', onMessage);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('game-started', onGameStarted);
    socket.on('game-ended', onGameEnded);
    socket.on('room-state', onRoomState);
    socket.on('media-permission-requested', onMediaRequest);
    socket.on('user-permissions-changed', onPermissionsChanged);
    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIce);

    return () => {
      socket.off('new-message', onMessage);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('game-started', onGameStarted);
      socket.off('game-ended', onGameEnded);
      socket.off('room-state', onRoomState);
      socket.off('media-permission-requested', onMediaRequest);
      socket.off('user-permissions-changed', onPermissionsChanged);
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIce);
    };
  }, [socket, currentUser?.id, sendSignal, acquireMedia]);

  // ─── Media Controls ────────────────────────────────────────────────────────

  const isHost = room?.hostId === currentUser?.id;

  const handleToggleMic = () => {
    const myPerms = participants.find(p => p.id === currentUser?.id);
    const hasPermission = isHost || !!myPerms?.canSpeak;

    if (hasPermission && localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
      }
    } else {
      socket?.emit('request-media-permission', { type: 'audio' });
    }
  };

  const handleToggleCam = () => {
    const myPerms = participants.find(p => p.id === currentUser?.id);
    const hasPermission = isHost || !!myPerms?.canVideo;

    if (hasPermission && localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsCamOn(track.enabled);
      }
    } else {
      socket?.emit('request-media-permission', { type: 'video' });
    }
  };

  // ─── Other Handlers ────────────────────────────────────────────────────────

  const handleLeaveRoom = () => {
    socket?.emit('leave-room');
    navigate('/lobby');
  };

  const handleSendMessage = (text: string) => {
    socket?.emit('send-message', { text }, (res: any) => {
      if (!res.success) console.error('[Chat] Failed to send message');
    });
  };

  const handleGameChange = (newGameType: GameType) => {
    socket?.emit('start-game', { gameType: newGameType }, (res: any) => {
      if (res.success) setGameType(newGameType);
    });
  };

  const handleRespondToMedia = (userId: string, type: 'audio' | 'video', allowed: boolean) => {
    socket?.emit('grant-media-permission', { userId, type, allowed });
    setMediaRequests(prev => prev.filter(r => !(r.userId === userId && r.type === type)));
  };

  // ─── Loading / Error States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-300">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !room || !currentUser) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-300 mb-4">{error || 'Room not found'}</p>
          <button onClick={() => navigate('/lobby')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const myParticipant = participants.find(p => p.id === currentUser.id);

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">

      {/* ── Host Media Request Toasts ─────────────────────────────────────── */}
      {isHost && mediaRequests.length > 0 && (
        <div className="fixed top-20 right-6 z-[60] flex flex-col gap-2 w-72">
          {mediaRequests.map((req, idx) => (
            <div key={`${req.userId}-${req.type}-${idx}`} className="bg-gray-900/95 backdrop-blur-xl border border-indigo-500/50 p-4 rounded-2xl shadow-2xl shadow-indigo-500/20 animate-float-in">
              <p className="text-sm font-medium mb-3">
                <span className="text-indigo-400 font-bold">{req.username}</span> wants to turn on their{' '}
                <span className="text-pink-400 font-semibold">{req.type === 'audio' ? '🎤 Mic' : '📷 Camera'}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => handleRespondToMedia(req.userId, req.type, true)} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">Allow</button>
                <button onClick={() => handleRespondToMedia(req.userId, req.type, false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-bold py-2 rounded-lg transition-colors">Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-4 md:px-6 py-3 bg-black/60 border-b border-white/5 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={handleLeaveRoom} title="Leave Room" className="hidden md:flex p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all hover:scale-110">
            <LogOut size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="font-bold text-base md:text-lg truncate text-indigo-100">{room.name}</h2>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400">
              <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded-full">
                <Users size={10} /> {participants.length}
              </span>
              {isHost && <span className="text-yellow-500 font-bold uppercase tracking-wider bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">HOST</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Non-host desktop media request buttons */}
          {!isHost && (
            <div className="hidden lg:flex gap-2">
              <button
                onClick={handleToggleMic}
                title={myParticipant?.canSpeak ? (isMicOn ? 'Mute' : 'Unmute') : 'Request Mic'}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${myParticipant?.canSpeak ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {myParticipant?.canSpeak ? (isMicOn ? 'Mic On' : 'Mic Off') : 'Ask Mic'}
              </button>
              <button
                onClick={handleToggleCam}
                title={myParticipant?.canVideo ? (isCamOn ? 'Camera Off' : 'Camera On') : 'Request Camera'}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${myParticipant?.canVideo ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {myParticipant?.canVideo ? (isCamOn ? 'Cam On' : 'Cam Off') : 'Ask Cam'}
              </button>
            </div>
          )}

          <div className="relative">
            <select
              value={gameType}
              title="Select Game"
              onChange={(e) => handleGameChange(e.target.value as GameType)}
              className="bg-gray-800 hover:bg-gray-700 text-white text-[10px] md:text-xs font-bold rounded-xl border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none pr-8"
            >
              <option value={GameType.NONE}>Chill Mode</option>
              <option value={GameType.QUIZ}>Trivia Quiz</option>
              <option value={GameType.TRUTH_DARE}>Truth/Dare</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Gamepad2 size={12} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Room Body ──────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <div className="flex-1 bg-black/40 pb-16 md:pb-0">
          <VideoGrid
            participants={participants.map(p => ({
              ...p,
              isHost: p.id === room.hostId,
            }))}
            currentUser={currentUser}
            localStream={localStream}
            remoteStreams={remoteStreams}
          />
        </div>

        {/* Sidebar */}
        <div className={`
          fixed inset-0 z-40 bg-gray-900 md:relative md:inset-auto md:flex md:w-96 md:bg-gray-900/50 md:border-l md:border-white/5 flex-col shrink-0 mobile-overlay
          ${activeSidebar !== 'NONE' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="flex md:hidden items-center justify-between p-4 border-b border-white/5">
            <h3 className="font-bold uppercase text-xs tracking-widest text-indigo-400">{activeSidebar}</h3>
            <button onClick={() => setActiveSidebar('NONE')} title="Close" className="p-2 text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </div>

          <div className={`flex-1 min-h-0 ${activeSidebar === 'GAME' || activeSidebar === 'NONE' ? 'flex' : 'hidden md:flex'} flex-col overflow-hidden`}>
            {/* Game Area — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto border-b border-white/5 scrollbar-hide">
              <GameArea gameType={gameType} currentUser={currentUser} onGameEnd={() => handleGameChange(GameType.NONE)} />
            </div>
            {/* Chat — desktop bottom half, scrollable */}
            <div className="h-64 md:h-72 shrink-0 overflow-hidden hidden md:flex flex-col border-t border-white/5">
              <ChatBox messages={messages} currentUser={currentUser} onSendMessage={handleSendMessage} />
            </div>
          </div>

          {/* Chat (Mobile tab) — scrollable */}
          <div className={`flex-1 min-h-0 overflow-hidden ${activeSidebar === 'CHAT' ? 'flex' : 'hidden'} flex-col`}>
            <ChatBox messages={messages} currentUser={currentUser} onSendMessage={handleSendMessage} />
          </div>
        </div>
      </div>

      <BottomNav
        mode="ROOM"
        activeTab={activeSidebar}
        onTabChange={(tab) => setActiveSidebar(tab as any)}
        canSpeak={isMicOn}
        canVideo={isCamOn}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleCam}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  );
}
