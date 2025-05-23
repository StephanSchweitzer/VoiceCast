import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json();

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase(),
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash the password
        const hashedPassword = await hash(password, 12);

        // Create the user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase(),
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        return NextResponse.json(
            {
                message: 'User created successfully',
                user,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration error:', error);

        // Handle Prisma known errors
        if (error instanceof Error) {
            // Check for unique constraint violation
            if (error.message.includes('Unique constraint')) {
                return NextResponse.json(
                    { error: 'User with this email already exists' },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}