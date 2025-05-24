import { prisma } from './db';
import bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role || 'user', // Include role from database
                    isAdmin: user.role === 'admin', // Derive isAdmin from role
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.isAdmin = user.isAdmin;
            } else if (token.id) {
                // Refresh user data from database on subsequent requests
                // This ensures role changes are reflected without re-login
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true }
                });

                if (dbUser) {
                    token.role = dbUser.role || 'user';
                    token.isAdmin = dbUser.role === 'admin';
                }
            }
            return token;
        },
        async session({ session, token }: { session: any; token: JWT }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.isAdmin = token.isAdmin;
            }
            return session;
        }
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
        signOut: '/',
        error: '/login',
    },
    debug: process.env.NODE_ENV === 'development',
};