import mongoose from 'mongoose';
export declare const User: mongoose.Model<{
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
    bio: string;
    interests: string[];
    createdAt: NativeDate;
    isHost: boolean;
    canSpeak: boolean;
    canVideo: boolean;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
    bio: string;
    interests: string[];
    createdAt: NativeDate;
    isHost: boolean;
    canSpeak: boolean;
    canVideo: boolean;
}, {}, mongoose.DefaultSchemaOptions> & {
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
    bio: string;
    interests: string[];
    createdAt: NativeDate;
    isHost: boolean;
    canSpeak: boolean;
    canVideo: boolean;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
    bio: string;
    interests: string[];
    createdAt: NativeDate;
    isHost: boolean;
    canSpeak: boolean;
    canVideo: boolean;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
    bio: string;
    interests: string[];
    createdAt: NativeDate;
    isHost: boolean;
    canSpeak: boolean;
    canVideo: boolean;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string;
    bio: string;
    interests: string[];
    createdAt: NativeDate;
    isHost: boolean;
    canSpeak: boolean;
    canVideo: boolean;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=user.model.d.ts.map