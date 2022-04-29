import { prismaClient } from '../db/prisma-client';

export const GetConfig = async (key: string): Promise<string | undefined> => {
    const r = await prismaClient.config.findFirst({
        where: {
            key
        },
        select: {
            value: true
        }
    });
    return r?.value;
};

export const SetConfig = async (key: string, value: string): Promise<string> => {
    const r = await prismaClient.config.upsert({
        where: {
            key
        },
        create: {
            key,
            value
        },
        update: {
            value
        }
    });
    return r.value;
};
