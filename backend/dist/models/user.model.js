import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neutral' },
    bio: { type: String, default: '' },
    interests: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    isHost: { type: Boolean, default: false },
    canSpeak: { type: Boolean, default: false },
    canVideo: { type: Boolean, default: false },
});
export const User = mongoose.model('User', userSchema);
//# sourceMappingURL=user.model.js.map