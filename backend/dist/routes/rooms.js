import { Router } from 'express';
import { roomService } from '../services/roomService.js';
import { authService } from '../services/authService.js';
const router = Router();
// Middleware: verify token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const decoded = authService.verifyToken(token);
    if (!decoded) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
    req.userId = decoded.userId;
    next();
};
// Factory: accepts io so we can broadcast real-time events from REST routes
export function createRoomRouter(io) {
    // Get all rooms (public — no auth needed for lobby browsing)
    router.get('/', async (req, res) => {
        const rooms = await roomService.getAllRooms();
        res.json({ rooms });
    });
    // Get room by ID
    router.get('/:roomId', async (req, res) => {
        const room = await roomService.getRoomById(req.params.roomId);
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }
        res.json({ room });
    });
    // Create room — broadcast to all lobby clients so they update instantly
    router.post('/', verifyToken, async (req, res) => {
        const { name, topic, type, maxUsers } = req.body;
        if (!name || !topic) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        try {
            const room = await roomService.createRoom(name, req.userId, topic, type || 'PUBLIC', maxUsers || 10);
            // Broadcast to ALL connected clients so every lobby auto-updates
            io.emit('room-created', { room });
            res.status(201).json({ room });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Get room messages
    router.get('/:roomId/messages', async (req, res) => {
        const messages = await roomService.getRoomMessages(req.params.roomId);
        res.json({ messages });
    });
    return router;
}
// Keep a default export for backwards compat (unused now but safe)
export default router;
//# sourceMappingURL=rooms.js.map