import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const mapUser = (user) => ({
    id: user._id?.toString() || user.id?.toString() || user.toString(),
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    interests: user.interests,
    canSpeak: user.canSpeak,
    canVideo: user.canVideo,
    createdAt: user.createdAt instanceof Date ? user.createdAt.getTime() : user.createdAt
});
export const authService = {
    // Generate JWT token
    generateToken(userId) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    },
    // Verify JWT token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        }
        catch (err) {
            return null;
        }
    },
    // Hash password
    async hashPassword(password) {
        return bcryptjs.hash(password, 10);
    },
    // Compare password
    async comparePassword(password, hash) {
        return bcryptjs.compare(password, hash);
    },
    // Register user
    async register(username, email, password, avatarUrl = '') {
        try {
            // Check if user exists
            const existing = await User.findOne({ $or: [{ email }, { username }] });
            if (existing)
                return null;
            const passwordHash = await this.hashPassword(password);
            const user = new User({
                username,
                email,
                passwordHash,
                avatarUrl: avatarUrl || undefined,
                bio: 'Just joined VibeZone!',
            });
            await user.save();
            const token = this.generateToken(user._id.toString());
            return {
                user: mapUser(user),
                token
            };
        }
        catch (error) {
            console.error('[AuthService] Error during registration:', error);
            return null;
        }
    },
    // Login user
    async login(email, password) {
        try {
            const user = await User.findOne({ email });
            if (!user)
                return null;
            const isPasswordValid = await this.comparePassword(password, user.passwordHash);
            if (!isPasswordValid)
                return null;
            const token = this.generateToken(user._id.toString());
            return {
                user: mapUser(user),
                token
            };
        }
        catch (error) {
            console.error('[AuthService] Error during login:', error);
            return null;
        }
    },
    // Get user by ID
    async getUserById(userId) {
        if (!isValidId(userId))
            return null;
        try {
            const user = await User.findById(userId);
            if (!user)
                return null;
            return mapUser(user);
        }
        catch (error) {
            console.error(`[AuthService] Error fetching user ${userId}:`, error);
            return null;
        }
    },
};
//# sourceMappingURL=authService.js.map