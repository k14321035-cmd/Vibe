export declare const authService: {
    generateToken(userId: string): string;
    verifyToken(token: string): {
        userId: string;
    } | null;
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
    register(username: string, email: string, password: string, avatarUrl?: string): Promise<{
        user: any;
        token: string;
    } | null>;
    login(email: string, password: string): Promise<{
        user: any;
        token: string;
    } | null>;
    getUserById(userId: string): Promise<any | null>;
};
//# sourceMappingURL=authService.d.ts.map