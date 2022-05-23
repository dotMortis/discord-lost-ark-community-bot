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
    return r?.value == null ? undefined : r.value;
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
    if (r == null) throw new Error('Couldnt set config');
    return r.value || '';
};
