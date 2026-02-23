// In-memory storage
export const database = {
    users: new Map(),
    rooms: new Map(),
    messages: new Map(),
    peerConnections: new Map(),
};
// Initialize with sample data
export function initializeSampleData() {
    const sampleRooms = [
        {
            id: '1',
            name: "Chill Beats & Study 📚",
            hostId: 'system',
            participants: [],
            messages: [],
            activeGame: 'NONE',
            type: 'PUBLIC',
            topic: 'Studying',
            maxUsers: 8,
            createdAt: Date.now(),
        },
        {
            id: '2',
            name: "Friday Quiz Night 🧠",
            hostId: 'system',
            participants: [],
            messages: [],
            activeGame: 'QUIZ',
            type: 'PUBLIC',
            topic: 'Trivia',
            maxUsers: 10,
            createdAt: Date.now(),
        },
        {
            id: '3',
            name: "Truth or Dare Area 😈",
            hostId: 'system',
            participants: [],
            messages: [],
            activeGame: 'TRUTH_DARE',
            type: 'PUBLIC',
            topic: 'Party',
            maxUsers: 6,
            createdAt: Date.now(),
        },
    ];
    sampleRooms.forEach(room => {
        database.rooms.set(room.id, room);
        database.messages.set(room.id, []);
    });
}
//# sourceMappingURL=database.js.map