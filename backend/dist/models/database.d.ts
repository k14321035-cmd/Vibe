export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
    bio: string;
    interests: string[];
    createdAt: number;
}
export interface Message {
    id: string;
    roomId: string;
    userId: string;
    username: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
}
export interface Room {
    id: string;
    name: string;
    hostId: string;
    participants: User[];
    messages: Message[];
    activeGame: 'NONE' | 'QUIZ' | 'TRUTH_DARE' | 'DRAWING';
    type: 'PUBLIC' | 'PRIVATE';
    topic: string;
    maxUsers: number;
    createdAt: number;
}
export interface PeerConnection {
    from: string;
    to: string;
    offer?: any;
    answer?: any;
}
export declare const database: {
    users: Map<string, User>;
    rooms: Map<string, Room>;
    messages: Map<string, Message[]>;
    peerConnections: Map<string, PeerConnection>;
};
export declare function initializeSampleData(): void;
//# sourceMappingURL=database.d.ts.map