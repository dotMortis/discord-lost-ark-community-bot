import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord, TCalCommand } from '../discord.model';

export const REMOVE_EVENT: TCalCommand = {
    command: 'remove',
    desc: [['!dot cal remove <Event-ID>', 'Löscht ein Event endültig.']],
    callback: async (
        msg: Message<boolean>,
        args: Array<string>,
        discord: Discord
    ): Promise<void> => {
        const subArgs = msg.content.split(' ').slice(3);
        const eventId = subArgs.shift();
        if (Number(eventId)) {
            const deletedEvent = await prismaClient.guildEvent.delete({
                where: {
                    id: Number(eventId)
                }
            });
            if (!deletedEvent) await msg.reply('Not found!');
            else {
                await msg.reply(`Deleted Event: "${deletedEvent.name}" <${deletedEvent.id}>`);
                await discord.updateCalendar();
            }
        }
    }
};
