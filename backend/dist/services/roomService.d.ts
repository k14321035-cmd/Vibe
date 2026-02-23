export declare const roomService: {
    getAllRooms(): Promise<any[]>;
    getRoomById(roomId: string): Promise<any | null>;
    createRoom(name: string, hostId: string, topic: string, type?: "PUBLIC" | "PRIVATE", maxUsers?: number): Promise<any>;
    addUserToRoom(roomId: string, user: any): Promise<any | null>;
    removeUserFromRoom(roomId: string, userId: string): Promise<any | null>;
    addMessageToRoom(roomId: string, userId: string, username: string, text: string, isSystem?: boolean): Promise<any | null>;
    getRoomMessages(roomId: string): Promise<any[]>;
    updateActiveGame(roomId: string, gameType: "NONE" | "QUIZ" | "TRUTH_DARE" | "DRAWING"): Promise<any | null>;
    deleteRoom(roomId: string): Promise<boolean>;
    updateUserPermissions(roomId: string, userId: string, permissions: {
        canSpeak?: boolean;
        canVideo?: boolean;
    }): Promise<any | null>;
};
//# sourceMappingURL=roomService.d.ts.map