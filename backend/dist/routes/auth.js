import { Router } from 'express';
import { authService } from '../services/authService.js';
const router = Router();
// Register
router.post('/register', async (req, res) => {
    const { username, email, password, avatarUrl } = req.body;
    if (!username || !email || !password) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    const result = await authService.register(username, email, password, avatarUrl);
    if (!result) {
        res.status(400).json({ error: 'User already exists' });
        return;
    }
    res.json({
        token: result.token,
        user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            avatarUrl: result.user.avatarUrl,
            bio: result.user.bio,
            interests: result.user.interests,
        },
    });
});
// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Missing email or password' });
        return;
    }
    const result = await authService.login(email, password);
    if (!result) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    res.json({
        token: result.token,
        user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            avatarUrl: result.user.avatarUrl,
        },
    });
});
// Get current user
router.get('/me', async (req, res) => {
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
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json({
        user: {
            id: user.id || user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
        },
    });
});
export default router;
//# sourceMappingURL=auth.js.map