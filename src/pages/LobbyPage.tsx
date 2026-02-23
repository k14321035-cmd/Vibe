import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { Plus, Video, LogOut, UserCircle, Loader } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import AdBanner from '../components/AdBanner';
import AdNative from '../components/AdNative';
import AdInterstitial from '../components/AdInterstitial';

interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  participants: Array<{ id: string; username: string }>;
  messageCount: number;
  activeGame: string;
  type: string;
  topic: string;
  maxUsers: number;
  createdAt: number;
}

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user, token, logout, guestLogin, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', topic: '', type: 'PUBLIC' });
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [adDestination, setAdDestination] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    loadRooms();

    // ── Real-time socket updates (authenticated users have a socket) ──
    const socket = getSocket();
    if (socket) {
      const onRoomCreated = (data: { room: RoomInfo }) => {
        setRooms(prev => {
          // Avoid duplicates
          if (prev.find(r => r.id === data.room.id)) return prev;
          return [data.room, ...prev];
        });
      };
      const onRoomDeleted = (data: { roomId: string }) => {
        setRooms(prev => prev.filter(r => r.id !== data.roomId));
      };
      const onUserJoined = () => {
        // Refresh participant counts when someone joins a room
        loadRooms();
      };

      socket.on('room-created', onRoomCreated);
      socket.on('room-deleted', onRoomDeleted);
      socket.on('user-joined', onUserJoined);

      return () => {
        socket.off('room-created', onRoomCreated);
        socket.off('room-deleted', onRoomDeleted);
        socket.off('user-joined', onUserJoined);
      };
    }

    // ── Polling fallback for unauthenticated users (no socket) ──
    const interval = setInterval(loadRooms, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await api.getRooms();
      setRooms(response.rooms);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'GAMES', label: 'Games' },
    { id: 'PEACE', label: 'Peace' },
    { id: 'ENJOYMENT', label: 'Enjoyment' },
  ];

  const filteredRooms = rooms.filter(room => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'GAMES') return room.activeGame !== 'NONE';
    if (selectedCategory === 'PEACE') {
        const topic = room.topic.toLowerCase();
        return topic.includes('chill') || topic.includes('lofi') || topic.includes('study') || topic.includes('relax') || topic.includes('peace');
    }
    if (selectedCategory === 'ENJOYMENT') {
        const topic = room.topic.toLowerCase();
        return topic.includes('party') || topic.includes('music') || topic.includes('dance') || topic.includes('fun') || topic.includes('enjoy');
    }
    return true;
  });

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) { setShowAuthGate(true); return; }
    try {
      const response = await api.createRoom(token, newRoomData.name, newRoomData.topic, newRoomData.type);
      setShowCreateRoom(false);
      setNewRoomData({ name: '', topic: '', type: 'PUBLIC' });
      const newRoomId = response.id || response.room?.id;
      if (newRoomId) navigate(`/room/${newRoomId}`);
      else loadRooms();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleJoinRoom = (roomId: string) => {
    if (!user) {
      setPendingRoomId(roomId);
      setShowAuthGate(true);
      return;
    }
    // Show interstitial ad before navigating
    setAdDestination(`/room/${roomId}`);
    setShowAd(true);
  };

  const handleAdSkip = () => {
    if (adDestination) navigate(adDestination);
    setShowAd(false);
    setAdDestination(null);
  };

  const handleGuestAccess = async () => {
    setGuestLoading(true);
    try {
      await guestLogin();
      // After guest login, navigate to pending room or just continue browsing
      if (pendingRoomId) {
        navigate(`/room/${pendingRoomId}`);
      } else {
        setShowAuthGate(false);
        setShowCreateRoom(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans">

      {/* ── Interstitial Ad (before joining a room) ─── */}
      {showAd && (
        <AdInterstitial
          onClose={() => { setShowAd(false); setAdDestination(null); }}
          onSkip={handleAdSkip}
        />
      )}

      {/* Auth Gate Modal */}
      {showAuthGate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-indigo-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-indigo-500/20 animate-float-in">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Video size={28} />
            </div>
            <h3 className="text-2xl font-bold text-center mb-2">Join the Vibe</h3>
            <p className="text-gray-400 text-center text-sm mb-6">Sign in to join rooms and connect with others.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold rounded-xl mb-3 hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              Sign In / Register
            </button>
            <button
              onClick={handleGuestAccess}
              disabled={guestLoading}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {guestLoading ? <Loader size={16} className="animate-spin" /> : <UserCircle size={18} />}
              {guestLoading ? 'Joining...' : 'Continue as Guest'}
            </button>
            <button onClick={() => { setShowAuthGate(false); setPendingRoomId(null); }} className="w-full mt-3 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center bg-black/30 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center">
            <Video size={20} />
          </div>
          <h1 className="text-xl font-bold">VibeZone</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-full px-4 py-2">
                <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full border border-indigo-500/50" />
                <span className="font-medium text-sm">{user.username}</span>
              </div>
              <button onClick={handleLogout} title="Logout" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowAuthGate(true)} className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-semibold transition-all">
                Sign In
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 pb-24 md:pb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Live Rooms</h2>
            <p className="text-gray-400 text-sm md:text-base">Join a party or create your own hangout.</p>
          </div>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1"
          >
            <Plus size={20} /> Create Room
          </button>
        </div>

        {/* Category Navigation */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                        selectedCategory === cat.id
                            ? 'bg-white text-gray-900 shadow-lg shadow-white/10'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {cat.label}
                </button>
            ))}
        </div>

        {/* ── Banner Ad ─────────────────────────────────────── */}
        <AdBanner size="medium" className="mb-8" />

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="mb-8 p-4 md:p-6 bg-gray-900/50 border border-indigo-500/30 rounded-2xl animate-float-in">
            <h3 className="text-lg font-bold mb-4">Create a New Room</h3>
            <form onSubmit={handleCreateRoom} className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Room name..."
                value={newRoomData.name}
                onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
              <input
                type="text"
                placeholder="Topic..."
                value={newRoomData.topic}
                onChange={(e) => setNewRoomData({ ...newRoomData, topic: e.target.value })}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
              <select
                value={newRoomData.type}
                title="Room Type"
                onChange={(e) => setNewRoomData({ ...newRoomData, type: e.target.value })}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="px-6 py-3 hover:bg-gray-800 rounded-xl transition-colors text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">{error}</div>}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No rooms available yet.</p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold"
            >
              <Plus size={20} /> Create the First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.flatMap((room, index) => {
              const card = (
                <div
                  key={room.id}
                  className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/5 hover:border-indigo-500/50 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        room.activeGame !== 'NONE'
                          ? 'bg-pink-500/20 text-pink-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {room.activeGame !== 'NONE' ? '🎮 Game' : '💬 Chilling'}
                    </span>
                    {room.type === 'PRIVATE' && <span className="text-yellow-400 text-xs">🔒 Private</span>}
                  </div>

                  <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-300 transition-colors">{room.name}</h3>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-xs bg-gray-700 px-3 py-1 rounded-full text-gray-300">#{room.topic}</span>
                    {room.activeGame === 'QUIZ' && (
                      <span className="text-xs bg-purple-900/50 px-3 py-1 rounded-full text-purple-300">🧠 Quiz</span>
                    )}
                    {room.activeGame === 'TRUTH_DARE' && (
                      <span className="text-xs bg-pink-900/50 px-3 py-1 rounded-full text-pink-300">🎭 Truth/Dare</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="flex -space-x-2">
                        {room.participants.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 border-2 border-gray-800 flex items-center justify-center text-xs font-bold"
                            title={p.username}
                          >
                            {p.username[0]}
                          </div>
                        ))}
                      </div>
                      {room.participants.length > 0 && <span>{room.participants.length}+ online</span>}
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all"
                    >
                      Join
                    </button>
                  </div>
                </div>
              );

              // Insert a native ad card after every 3rd room card (index 2, 5, 8 …)
              if ((index + 1) % 3 === 0) {
                return [
                  card,
                  <AdNative key={`ad-native-${index}`} />,
                ];
              }
              return [card];
            })}
          </div>
        )}
      </main>
      <BottomNav 
        mode="LOBBY" 
        activeTab={selectedCategory}
        onTabChange={setSelectedCategory}
        onCreateRoom={() => setShowCreateRoom(true)}
        onLogout={handleLogout}
      />
    </div>
  );
}
