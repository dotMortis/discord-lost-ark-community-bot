import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord, TCalCommand } from '../discord.model';

export const UPDATE_EVENT: TCalCommand = {
    command: 'update',
    desc: [['!dot cal update <Event-ID> <Event-Name>', 'Aktualisiert den Namen eines Events']],
    callback: async (
        msg: Message<boolean>,
        args: Array<string>,
        discord: Discord
    ): Promise<void> => {
        const subArgs = msg.content.split(' ').slice(3);
        const eventId = subArgs.shift();
        const newName = subArgs.join(' ');
        if (Number(eventId) && newName.length) {
            const duplicate = await prismaClient.guildEvent.findUnique({
                where: {
                    id: Number(eventId)
                },
                select: {
                    id: true
                }
            });
            if (!duplicate) await msg.reply('Not found!');
            else {
                const newEvent = await prismaClient.guildEvent.update({
                    where: {
                        id: duplicate.id
                    },
                    data: {
                        name: newName
                    }
                });
                await msg.reply(`Updated Event: "${newEvent.name}" <${newEvent.id}>`);
                await discord.updateCalendar();
            }
        }
    }
};
