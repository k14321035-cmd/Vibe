import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

const MOCK_AVATARS = [
  "https://picsum.photos/id/64/200/200",
  "https://picsum.photos/id/177/200/200",
  "https://picsum.photos/id/338/200/200",
  "https://picsum.photos/id/449/200/200",
  "https://picsum.photos/id/550/200/200",
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, register, guestLogin, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(MOCK_AVATARS[0]);
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/lobby');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password, selectedAvatar);
      }
      navigate('/lobby');
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 mb-2">
            VibeZone
          </h1>
          <p className="text-gray-300">Your digital hangout spot.</p>
        </div>

        {(error || localError) && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{error || localError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Choose your Vibe</label>
                <div className="flex justify-center gap-3">
                  {MOCK_AVATARS.slice(0, 4).map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative rounded-full overflow-hidden w-14 h-14 transition-all ${
                        selectedAvatar === url ? 'ring-4 ring-indigo-500 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g., GamerX"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-lg font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setLocalError(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
          
          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => guestLogin()}
              disabled={loading}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-gray-300 transition-colors"
            >
              Enter as Guest (No Login)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
