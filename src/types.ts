export enum GameType {
  NONE = 'NONE',
  QUIZ = 'QUIZ',
  TRUTH_DARE = 'TRUTH_DARE',
  DRAWING = 'DRAWING'
}

export enum RoomType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  bio: string;
  interests: string[];
  isHost?: boolean;
  canSpeak?: boolean;
  canVideo?: boolean;
}

export interface Message {
  id: string;
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
  activeGame: GameType;
  type: RoomType;
  topic: string;
  maxUsers: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;
  emoji?: string;
}

export interface GameState {
  isActive: boolean;
  type: GameType;
  data: any; // Flexible for different games
  scores: Record<string, number>;
}