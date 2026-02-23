import React, { useEffect, useRef } from 'react';
import { User } from '../types';
import { Mic, MicOff } from 'lucide-react';

interface VideoGridProps {
  participants: User[];
  currentUser: User;
  localStream: MediaStream | null;
  remoteStreams?: Map<string, MediaStream>;
}

interface VideoTileProps {
    user: any;
    stream: MediaStream | null;
    isLocal?: boolean;
    isHost?: boolean;
    className?: string;
}

const VideoTile: React.FC<VideoTileProps> = ({ user, stream, isLocal, isHost, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stream) return;

        video.srcObject = stream;

        // Re-attach if new tracks arrive on the same stream object reference
        const onTrackAdded = () => {
            video.srcObject = null;
            video.srcObject = stream;
        };
        stream.addEventListener('addtrack', onTrackAdded);
        return () => stream.removeEventListener('addtrack', onTrackAdded);
    }, [stream]);

    // Use stream content as source of truth for what's active
    const hasVideoTrack = !!(stream && stream.getVideoTracks().length > 0);
    const hasMic = isLocal
        ? !!(stream && stream.getAudioTracks().some(t => t.enabled))
        : !!(user.canSpeak || isHost);

    return (
        <div className={`relative bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-white/10 group ${className || 'aspect-video'}`}>

            {/* Always keep <video> in the DOM so srcObject is always attached.
                Hide via CSS when no video track — avoids black screen from conditional mount. */}
            <video
                ref={videoRef}
                autoPlay
                muted={isLocal}
                playsInline
                className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''} ${!hasVideoTrack ? 'hidden' : ''}`}
            />

            {/* Avatar overlay shown when camera is off */}
            {!hasVideoTrack && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                        <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                            alt={user.username}
                            className="w-20 h-20 rounded-full mx-auto mb-2 opacity-60"
                        />
                        <p className="text-xs text-gray-500">{stream ? 'Audio Only' : 'Camera Off'}</p>
                    </div>
                </div>
            )}

            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 flex justify-between items-end">
                <div>
                    <span className="text-white font-bold text-sm truncate flex items-center gap-2">
                        {user.username}
                        {isHost && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded uppercase">Host</span>}
                        {isLocal && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1 rounded uppercase">You</span>}
                    </span>
                </div>
                <div className="flex gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasMic ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {hasMic ? <Mic size={14} /> : <MicOff size={14} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const VideoGrid: React.FC<VideoGridProps> = ({ participants, currentUser, localStream, remoteStreams }) => {
  // Combine current user and remote participants
  const currentUserInList = participants.find(p => p.id === currentUser.id);
  const effectiveCurrentUser = currentUserInList ? { ...currentUser, ...currentUserInList } : currentUser;
  
  const displayUsers = [effectiveCurrentUser, ...participants.filter(p => p.id !== currentUser.id)];

  const hostUser = displayUsers.find(u => u.isHost);
  const otherUsers = displayUsers.filter(u => !u.isHost);

  // Check if any non-host user is actively sharing video
  const anyOtherSharingVideo = otherUsers.some(user => {
      const stream = user.id === currentUser.id ? localStream : remoteStreams?.get(user.id);
      return stream && stream.getVideoTracks().length > 0;
  });

  // Fallback if no host is found
  if (!hostUser) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 pb-20 md:pb-4 auto-rows-max content-start overflow-y-auto h-full scrollbar-hide">
        {displayUsers.map((user) => (
          <VideoTile 
              key={user.id}
              user={user}
              stream={user.id === currentUser.id ? localStream : (remoteStreams?.get(user.id) || null)}
              isLocal={user.id === currentUser.id}
              isHost={user.isHost}
          />
        ))}
      </div>
    );
  }

  // Host takes a prominent section (100% if no one else is sharing video, 50% if others are sharing )
  return (
    <div className="flex flex-col h-full overflow-hidden p-4 pb-20 md:pb-4 gap-3">
      {/* Host Section */}
      <div className={`${anyOtherSharingVideo ? "h-1/2 shrink-0" : "flex-1 shrink-0"} transition-all duration-300`}>
        <VideoTile
           key={hostUser.id}
           user={hostUser}
           stream={hostUser.id === currentUser.id ? localStream : (remoteStreams?.get(hostUser.id) || null)}
           isLocal={hostUser.id === currentUser.id}
           isHost={true}
           className="w-full h-full"
        />
      </div>

      {/* Others Section */}
      {otherUsers.length > 0 && (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className={`grid gap-3 auto-rows-max ${
              otherUsers.length === 1 ? 'grid-cols-1' :
              otherUsers.length === 2 ? 'grid-cols-2' :
              'grid-cols-2 md:grid-cols-3'
          }`}>
            {otherUsers.map((user) => (
              <VideoTile 
                  key={user.id}
                  user={user}
                  stream={user.id === currentUser.id ? localStream : (remoteStreams?.get(user.id) || null)}
                  isLocal={user.id === currentUser.id}
                  isHost={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;