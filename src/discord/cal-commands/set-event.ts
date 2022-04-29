import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord, TCalCommand } from '../discord.model';

export const SET_EVENT: TCalCommand = {
    command: 'set',
    desc: [
        ['!dot cal set <Day-Of-Week> <Time-(hh:mm)> <Event-ID>', 'Erstellt einen Kalendereintrag']
    ],
    callback: async (
        msg: Message<boolean>,
        args: Array<string>,
        discord: Discord
    ): Promise<void> => {
        const subArgs = msg.content.split(' ').slice(3);
        const [dayOfWeek, time, eventId] = subArgs;
        if (dayOfWeek.match(/[1-7]/) && time.match(/[0-9]{2}:[0-9]{2}/) && Number(eventId)) {
            const event = await prismaClient.guildEvent.findUnique({
                where: {
                    id: Number(eventId)
                },
                select: {
                    id: true
                }
            });
            if (!event) await msg.reply('Event not found!');
            else {
                await prismaClient.calendar.create({
                    data: {
                        guildEventId: event.id,
                        dayOfWeek: Number(dayOfWeek),
                        time
                    }
                });
                await msg.reply(`Set Event.`);
                await discord.updateCalendar();
            }
        }
    }
};
