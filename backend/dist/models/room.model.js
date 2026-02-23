import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    isSystem: { type: Boolean, default: false },
});
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [messageSchema],
    activeGame: {
        type: String,
        enum: ['NONE', 'QUIZ', 'TRUTH_DARE', 'DRAWING'],
        default: 'NONE'
    },
    type: {
        type: String,
        enum: ['PUBLIC', 'PRIVATE'],
        default: 'PUBLIC'
    },
    topic: { type: String, default: 'General' },
    maxUsers: { type: Number, default: 10 },
    createdAt: { type: Number, default: Date.now },
});
export const Room = mongoose.model('Room', roomSchema);
//# sourceMappingURL=room.model.js.map