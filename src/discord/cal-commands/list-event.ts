import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { TCalCommand } from '../discord.model';

export const LIST_CALENDAR: TCalCommand = {
    command: 'list',
    desc: [
        ['!dot cal list cal', 'Listed alle Kalendereinträge'],
        ['!dot cal list events', 'Listed alle Events']
    ],
    callback: async (msg: Message<boolean>, args: Array<string>): Promise<void> => {
        let list = '';
        if (args[3] === 'events') {
            const events = await prismaClient.guildEvent.findMany({ orderBy: { id: 'asc' } });
            for (const event of events) list += `[${event.id}]\t${event.name}\n`;
        } else {
            const calendars = await prismaClient.calendar.findMany({
                orderBy: [
                    {
                        dayOfWeek: 'asc'
                    },
                    {
                        time: 'asc'
                    }
                ],
                include: {
                    event: true
                }
            });
            const dayoFweekMapping = [
                'Montag:\n',
                'Dienstag:\n',
                'Mittwoch:\n',
                'Donnerstag:\n',
                'Freitag:\n',
                'Samstag:\n',
                'Sonntag:\n'
            ];
            for (let z = 1; z <= 7; z++) {
                const filteredCalendars = calendars.filter(calendar => calendar.dayOfWeek === z);
                list += dayoFweekMapping[z - 1];
                for (const calendar of filteredCalendars) {
                    list += `\t[${calendar.event.id}]\t${calendar.time}\t${calendar.event.name}\n`;
                }
                if (!filteredCalendars.length) {
                    list += '-\t-\t-\n';
                }
                list += '\n';
            }
        }

        await msg.reply(list);
    }
};
