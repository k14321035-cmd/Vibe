const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
  };
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
  };
}

export const api = {
  async register(username: string, email: string, password: string, avatarUrl: string): Promise<RegisterResponse> {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, avatarUrl }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Registration failed');
    }

    return response.json();
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }

    return response.json();
  },

  async getMe(token: string) {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  async getRooms() {
    const response = await fetch(`${BACKEND_URL}/api/rooms`);
    if (!response.ok) throw new Error('Failed to get rooms');
    return response.json();
  },

  async getRoom(roomId: string) {
    const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
    if (!response.ok) throw new Error('Failed to get room');
    return response.json();
  },

  async createRoom(token: string, name: string, topic: string, type: string = 'PUBLIC') {
    const response = await fetch(`${BACKEND_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, topic, type }),
    });

    if (!response.ok) throw new Error('Failed to create room');
    return response.json();
  },

  async getRoomMessages(roomId: string) {
    const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/messages`);
    if (!response.ok) throw new Error('Failed to get messages');
    return response.json();
  },
};
