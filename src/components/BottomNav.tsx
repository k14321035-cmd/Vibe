import React from 'react';
import { LayoutGrid, PlusSquare, LogOut, Mic, MicOff, Video, VideoOff, MessageSquare, Gamepad2, ArrowLeft } from 'lucide-react';

interface BottomNavProps {
  mode: 'LOBBY' | 'ROOM';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  // Room specific
  canSpeak?: boolean;
  canVideo?: boolean;
  onToggleMic?: () => void;
  onToggleVideo?: () => void;
  onLeaveRoom?: () => void;
  onCreateRoom?: () => void;
  onLogout?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
  mode,
  activeTab,
  onTabChange,
  canSpeak,
  canVideo,
  onToggleMic,
  onToggleVideo,
  onLeaveRoom,
  onCreateRoom,
  onLogout
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-2 pb-safe z-50 md:hidden">
      {mode === 'LOBBY' ? (
        <>
          <button 
            onClick={() => onTabChange?.('ALL')}
            title="Rooms"
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'ALL' ? 'text-indigo-400' : 'text-gray-400'}`}
          >
            <LayoutGrid size={20} />
            <span className="text-[10px] uppercase font-bold">Rooms</span>
          </button>
          
          <button 
            onClick={onCreateRoom}
            title="Create Room"
            className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full -translate-y-4 shadow-lg shadow-indigo-500/20 text-white"
          >
            <PlusSquare size={24} />
          </button>

          <button 
            onClick={onLogout}
            title="Logout"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <LogOut size={20} />
            <span className="text-[10px] uppercase font-bold">Logout</span>
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={onToggleMic}
            title="Toggle Mic"
            className={`flex flex-col items-center gap-1 p-2 ${canSpeak ? 'text-green-400' : 'text-red-400'}`}
          >
            {canSpeak ? <Mic size={20} /> : <MicOff size={20} />}
            <span className="text-[10px] uppercase font-bold">Mic</span>
          </button>

          <button 
            onClick={onToggleVideo}
            title="Toggle Camera"
            className={`flex flex-col items-center gap-1 p-2 ${canVideo ? 'text-indigo-400' : 'text-gray-500'}`}
          >
            {canVideo ? <Video size={20} /> : <VideoOff size={20} />}
            <span className="text-[10px] uppercase font-bold">Cam</span>
          </button>

          <button 
            onClick={() => onTabChange?.('CHAT')}
            title="Chat"
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'CHAT' ? 'text-indigo-400' : 'text-gray-400'}`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] uppercase font-bold">Chat</span>
          </button>

          <button 
            onClick={() => onTabChange?.('GAME')}
            title="Games"
            className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'GAME' ? 'text-indigo-400' : 'text-gray-400'}`}
          >
            <Gamepad2 size={20} />
            <span className="text-[10px] uppercase font-bold">Play</span>
          </button>

          <button 
            onClick={onLeaveRoom}
            title="Leave Room"
            className="flex flex-col items-center gap-1 p-2 text-red-400"
          >
            <ArrowLeft size={20} />
            <span className="text-[10px] uppercase font-bold">Exit</span>
          </button>
        </>
      )}
    </div>
  );
};

export default BottomNav;
