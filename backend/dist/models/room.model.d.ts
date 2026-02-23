import mongoose from 'mongoose';
export declare const Room: mongoose.Model<{
    type: "PUBLIC" | "PRIVATE";
    name: string;
    createdAt: number;
    hostId: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    messages: mongoose.Types.DocumentArray<{
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }> & {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }>;
    activeGame: "NONE" | "QUIZ" | "TRUTH_DARE" | "DRAWING";
    topic: string;
    maxUsers: number;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "PUBLIC" | "PRIVATE";
    name: string;
    createdAt: number;
    hostId: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    messages: mongoose.Types.DocumentArray<{
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }> & {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }>;
    activeGame: "NONE" | "QUIZ" | "TRUTH_DARE" | "DRAWING";
    topic: string;
    maxUsers: number;
}, {}, mongoose.DefaultSchemaOptions> & {
    type: "PUBLIC" | "PRIVATE";
    name: string;
    createdAt: number;
    hostId: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    messages: mongoose.Types.DocumentArray<{
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }> & {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }>;
    activeGame: "NONE" | "QUIZ" | "TRUTH_DARE" | "DRAWING";
    topic: string;
    maxUsers: number;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    type: "PUBLIC" | "PRIVATE";
    name: string;
    createdAt: number;
    hostId: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    messages: mongoose.Types.DocumentArray<{
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }> & {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }>;
    activeGame: "NONE" | "QUIZ" | "TRUTH_DARE" | "DRAWING";
    topic: string;
    maxUsers: number;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "PUBLIC" | "PRIVATE";
    name: string;
    createdAt: number;
    hostId: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    messages: mongoose.Types.DocumentArray<{
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }> & {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }>;
    activeGame: "NONE" | "QUIZ" | "TRUTH_DARE" | "DRAWING";
    topic: string;
    maxUsers: number;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    type: "PUBLIC" | "PRIVATE";
    name: string;
    createdAt: number;
    hostId: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    messages: mongoose.Types.DocumentArray<{
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }> & {
        username: string;
        text: string;
        userId: string;
        roomId: string;
        timestamp: number;
        isSystem: boolean;
    }>;
    activeGame: "NONE" | "QUIZ" | "TRUTH_DARE" | "DRAWING";
    topic: string;
    maxUsers: number;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=room.model.d.ts.map