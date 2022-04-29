import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { TCalCommand } from '../discord.model';

export const ADD_EVENT: TCalCommand = {
    command: 'add',
    desc: [['!dot cal add <Event-Name>', 'Erstellt ein Event mit eindeutigem Namen.']],
    callback: async (msg: Message<boolean>): Promise<void> => {
        const args = msg.content.split(' ').slice(3);
        const name = args.join(' ');
        if (name.length) {
            const duplicate = await prismaClient.guildEvent.findUnique({
                where: {
                    name
                },
                select: {
                    id: true
                }
            });
            if (duplicate) await msg.reply('Already exists!');
            else {
                const newEvent = await prismaClient.guildEvent.create({
                    data: {
                        name
                    }
                });
                await msg.reply(`Created Event: "${newEvent.name}" <${newEvent.id}>`);
            }
        }
    }
};
