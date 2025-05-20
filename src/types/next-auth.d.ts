import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: string;
            isAdmin?: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        name?: string | null;
        email: string;
        image?: string | null;
        role?: string;
        isAdmin?: boolean;
    }


    interface JWT {
        id: string;
        role?: string;
        isAdmin?: boolean;
    }
}