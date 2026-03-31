import admin from "firebase-admin";

export type AuthUser = { 
    userId: string;
};

export class AuthService {


    constructor(serviceAccount: any) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    static decodeSeviceAccountJsonBase64(base64: string): any {
        const serviceAccount = JSON.parse(
            Buffer.from(base64, "base64url").toString("utf-8")
        );
        return serviceAccount;
    }

    async verifyIdToken(idToken: string): Promise<AuthUser|null> {
        try {
            const decoded = await admin.auth().verifyIdToken(idToken);
            const authUser: AuthUser = { 
                userId: decoded.sub
            };
            return authUser;
        }
        catch(err: any) {
            return null;
        }
    }

    extractIdTokenFromHeader(header: any): string | null {
        if (typeof header !== "string") {
            return null;
        }
        const authHeader = header as string;
        if (authHeader.length < 7) {
            return null;
        }
        const idToken = authHeader.slice(7).trim();
        if (idToken.length === 0) {
            return null;
        }
        return idToken;
    }

} 