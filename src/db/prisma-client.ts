import { PrismaClient } from '@prisma/client';
import { staticConfig } from '../config/static-config';

const PRISMA_CLIENT = new PrismaClient({
    log: staticConfig().loggingLevel
});

export const prismaClient = PRISMA_CLIENT;

export const connectPrismaClient = () => PRISMA_CLIENT.$connect();
