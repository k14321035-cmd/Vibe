import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import { initSocket, closeSocket, getSocket } from '../lib/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, avatarUrl: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user on mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Verify token and get user details
          const response = await api.getMe(token);
          setUser(response.user);
          
          // Only initialize socket if user validation succeeds
          if (!getSocket()) {
            initSocket(token);
          }
        } catch (err) {
          console.error("Session expired or invalid:", err);
          setToken(null);
          setUser(null);
          localStorage.removeItem('authToken');
          closeSocket();
        }
      } else {
          // No token, ensure clean state
          setUser(null);
          closeSocket();
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.login(email, password);
      setToken(response.token);
      setUser(response.user as User);
      localStorage.setItem('authToken', response.token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, avatarUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.register(username, email, password, avatarUrl);
      setToken(response.token);
      setUser(response.user as User);
      localStorage.setItem('authToken', response.token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const randomId = Math.floor(Math.random() * 10000);
      const username = `Guest_${randomId}`;
      const email = `guest${randomId}@example.com`;
      const password = `guest${randomId}`;
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

      const response = await api.register(username, email, password, avatarUrl);
      setToken(response.token);
      setUser(response.user as User);
      localStorage.setItem('authToken', response.token);
      initSocket(response.token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    closeSocket();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
