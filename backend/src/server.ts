import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { setupSocketEvents } from './events/socketEvents.js';
import authRoutes from './routes/auth.js';
import { createRoomRouter } from './routes/rooms.js';

import mongoose from 'mongoose';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibezone';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB 🍃'))
  .catch(err => console.error('MongoDB connection error:', err));
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://172.20.10.2:3000',
  'http://172.20.10.2:5173'
];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Socket.io events
setupSocketEvents(io);

// Routes (after io is ready so rooms router can broadcast)
app.use('/api/auth', authRoutes);
app.use('/api/rooms', createRoomRouter(io));

// Chrome DevTools probe — prevents 404 in dev
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.json({ devtools: true });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 VibeZone Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
});
