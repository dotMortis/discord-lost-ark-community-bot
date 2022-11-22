import { prismaClient } from '../../db/prisma-client';
import { Discord } from '../discord.model';
import { TRoutine } from '../event.types';

let lastRun = 0;

export const MEMBER_EVENT_CLEAN_UP_ROUTINE: TRoutine = async (discord: Discord) => {
    if (lastRun > Date.now() - 1000 * 60 * 10) return;
    const events = await prismaClient.event.findMany();
    for (const event of events) {
        const eventMessage = await discord.memberEventFactory.getEventMessage(event);
        if (eventMessage && eventMessage.thread) {
            const maxAgeUnix = Date.now() - 1000 * 60 * 60 * 24;
            const messagesToDelete = Array.from(eventMessage.thread.messages.cache.values()).filter(
                message => {
                    const createdUnix = message.createdAt.getTime();
                    return (
                        message.author.id === discord.bot.user?.id &&
                        createdUnix < maxAgeUnix &&
                        message.content.startsWith('LOG:')
                    );
                }
            );
            await eventMessage.thread.bulkDelete(messagesToDelete);
        }
    }
    lastRun = Date.now();
};
