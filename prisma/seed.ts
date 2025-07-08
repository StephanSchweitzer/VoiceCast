import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const password = await hash('test', 12);

    const user = await prisma.user.upsert({
        where: { email: 'test@test.com' },
        update: {},
        create: {
            email: 'test@test.com',
            name: 'Test User',
            password,
            voices: {
                create: [
                    {
                        name: 'Soothing Voice',
                        description: 'A calm and relaxing voice',
                        audioSample: 'https://example.com/sample1.mp3',
                        isPublic: true
                    },
                    {
                        name: 'Energetic Voice',
                        description: 'An upbeat voice for advertisements',
                        audioSample: 'https://example.com/sample2.mp3',
                        isPublic: false
                    }
                ]
            }
        }
    });

    console.log({ user });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });