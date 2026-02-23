import { Room } from '../models/room.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const mapUser = (user: any) => ({
  id: user._id?.toString() || user.id?.toString() || user.toString(),
  username: user.username || 'User',
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  interests: user.interests,
  canSpeak: user.canSpeak,
  canVideo: user.canVideo,
  createdAt: user.createdAt instanceof Date ? user.createdAt.getTime() : user.createdAt
});

const mapRoom = (room: any) => ({
  id: room._id.toString(),
  name: room.name,
  topic: room.topic,
  type: room.type,
  hostId: room.hostId.toString(),
  maxUsers: room.maxUsers,
  activeGame: room.activeGame,
  createdAt: room.createdAt,
  participants: (room.participants || []).map((p: any) => 
    typeof p === 'object' && p._id ? mapUser(p) : { id: p.toString() }
  ),
  messages: (room.messages || []).map((m: any) => ({
    id: m._id?.toString(),
    roomId: m.roomId,
    userId: m.userId,
    username: m.username,
    text: m.text,
    timestamp: m.timestamp,
    isSystem: m.isSystem
  }))
});

export const roomService = {
  // Get all rooms
  async getAllRooms(): Promise<any[]> {
    try {
      const rooms = await Room.find().populate('participants').lean();
      return rooms.map(mapRoom);
    } catch (error) {
      console.error('[RoomService] Error fetching rooms:', error);
      return [];
    }
  },

  // Get room by ID
  async getRoomById(roomId: string): Promise<any | null> {
    if (!isValidId(roomId)) return null;
    try {
      const room = await Room.findById(roomId).populate('participants').lean();
      return room ? mapRoom(room) : null;
    } catch (error) {
      console.error(`[RoomService] Error fetching room ${roomId}:`, error);
      return null;
    }
  },

  // Create new room
  async createRoom(name: string, hostId: string, topic: string, type: 'PUBLIC' | 'PRIVATE' = 'PUBLIC', maxUsers: number = 10): Promise<any> {
    try {
      const room = new Room({
        name,
        hostId,
        participants: [],
        messages: [],
        activeGame: 'NONE',
        type,
        topic,
        maxUsers,
      });
      await room.save();
      return mapRoom(room);
    } catch (error) {
      console.error('[RoomService] Error creating room:', error);
      throw error;
    }
  },

  // Add user to room
  async addUserToRoom(roomId: string, user: any): Promise<any | null> {
    if (!isValidId(roomId) || !isValidId(user.id)) return null;
    try {
      const room = await Room.findOneAndUpdate(
        { 
          _id: roomId, 
          $expr: { $lt: [{ $size: "$participants" }, "$maxUsers"] } 
        },
        { $addToSet: { participants: user.id } },
        { new: true }
      ).populate('participants').lean();

      if (!room) {
        const found = await Room.findById(roomId).populate('participants').lean();
        return found ? mapRoom(found) : null;
      }

      // Ensure host exists
      if (!room.hostId) {
          await Room.findByIdAndUpdate(roomId, { hostId: user.id });
          room.hostId = user.id;
      }

      return mapRoom(room);
    } catch (error) {
      console.error(`[RoomService] Error adding user to room ${roomId}:`, error);
      return null;
    }
  },

  // Remove user from room
  async removeUserFromRoom(roomId: string, userId: string): Promise<any | null> {
    if (!isValidId(roomId) || !isValidId(userId)) return null;
    try {
      const room: any = await Room.findByIdAndUpdate(
        roomId,
        { $pull: { participants: userId } },
        { new: true }
      ).populate('participants').lean();
      
      if (!room) return null;

      // Reassign host if the host left and there are still participants
      if (room.hostId.toString() === userId && room.participants && room.participants.length > 0) {
        const newHostId = room.participants[0]._id?.toString() || room.participants[0].id?.toString() || room.participants[0].toString();
        await Room.findByIdAndUpdate(roomId, { hostId: newHostId });
        room.hostId = newHostId;
      }

      return mapRoom(room);
    } catch (error) {
      console.error(`[RoomService] Error removing user from room ${roomId}:`, error);
      return null;
    }
  },

  // Add message to room
  async addMessageToRoom(roomId: string, userId: string, username: string, text: string, isSystem: boolean = false): Promise<any | null> {
    if (!isValidId(roomId)) return null;
    try {
      const room = await Room.findById(roomId);
      if (!room) return null;

      const messageContent = {
        roomId,
        userId,
        username,
        text,
        timestamp: Date.now(),
        isSystem,
      };

      room.messages.push(messageContent as any);
      await room.save();
      
      // Return the saved message with its ID
      const savedMessage = room.messages[room.messages.length - 1];
      return {
          id: savedMessage._id?.toString(),
          ...messageContent
      };
    } catch (error) {
      console.error(`[RoomService] Error adding message to room ${roomId}:`, error);
      return null;
    }
  },

  // Get room messages
  async getRoomMessages(roomId: string): Promise<any[]> {
    if (!isValidId(roomId)) return [];
    try {
      const room = await Room.findById(roomId).select('messages').lean();
      if (!room) return [];
      return (room.messages || []).slice(-50).map((m: any) => ({
          id: m._id?.toString(),
          roomId: m.roomId,
          userId: m.userId,
          username: m.username,
          text: m.text,
          timestamp: m.timestamp,
          isSystem: m.isSystem
      }));
    } catch (error) {
      console.error(`[RoomService] Error getting messages for room ${roomId}:`, error);
      return [];
    }
  },

  // Update active game
  async updateActiveGame(roomId: string, gameType: 'NONE' | 'QUIZ' | 'TRUTH_DARE' | 'DRAWING'): Promise<any | null> {
    if (!isValidId(roomId)) return null;
    try {
      const room = await Room.findByIdAndUpdate(roomId, { activeGame: gameType }, { new: true }).lean();
      return room ? mapRoom(room) : null;
    } catch (error) {
      console.error(`[RoomService] Error updating game for room ${roomId}:`, error);
      return null;
    }
  },

  async deleteRoom(roomId: string): Promise<boolean> {
    if (!isValidId(roomId)) return false;
    try {
      const result = await Room.findByIdAndDelete(roomId);
      return !!result;
    } catch (error) {
      console.error(`[RoomService] Error deleting room ${roomId}:`, error);
      return false;
    }
  },

  // Update user permissions
  async updateUserPermissions(roomId: string, userId: string, permissions: { canSpeak?: boolean; canVideo?: boolean }): Promise<any | null> {
    if (!isValidId(roomId) || !isValidId(userId)) return null;
    try {
      await User.findByIdAndUpdate(userId, permissions);
      const room = await Room.findById(roomId).populate('participants').lean();
      return room ? mapRoom(room) : null;
    } catch (error) {
      console.error(`[RoomService] Error updating permissions for user ${userId} in room ${roomId}:`, error);
      return null;
    }
  }
};
