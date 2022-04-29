import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord, TCalCommand } from '../discord.model';

export const UNSET_EVENT: TCalCommand = {
    command: 'unset',
    desc: [['!dot cal unset <Day-Of-Week> <Time-(hh:mm)>', 'Entfernt einen Kalendereintrag']],
    callback: async (
        msg: Message<boolean>,
        args: Array<string>,
        discord: Discord
    ): Promise<void> => {
        const subArgs = msg.content.split(' ').slice(3);
        const [dayOfWeek, time] = subArgs;
        if (dayOfWeek.match(/[1-7]/) && time.match(/[0-9]{2}:[0-9]{2}/)) {
            await prismaClient.calendar.deleteMany({
                where: {
                    dayOfWeek: Number(dayOfWeek),
                    time
                }
            });
            await msg.reply(`Unset Event.`);
            await discord.updateCalendar();
        }
    }
};
