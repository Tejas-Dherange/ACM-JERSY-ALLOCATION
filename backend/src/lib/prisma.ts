import { PrismaClient } from '@prisma/client';

// Global singleton to avoid multiple Prisma instances
// Critical for production: prevents connection pool exhaustion
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        errorFormat: 'pretty',
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Export disconnect for graceful shutdown
export const disconnectPrisma = async () => {
    await prisma.$disconnect();
    console.log('[Prisma] Disconnected');
};
