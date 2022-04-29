import { Calendar, GuildEvent } from '@prisma/client';
import { MessageEmbed } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';

export const getEmbedCalendar = async () => {
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
    const mapping: Array<{ day: string; items: string }> = [
        { day: 'Montag', items: '' },
        { day: 'Dienstag', items: '' },
        { day: 'Mittwoch', items: '' },
        { day: 'Donnerstag', items: '' },
        { day: 'Freitag', items: '' },
        { day: 'Samstag', items: '' },
        { day: 'Sonntag', items: '' }
    ];
    const currentDate = new Date();

    for (let z = 1; z <= 7; z++) {
        let list = '';
        const filteredCalendars = calendars.filter(calendar => calendar.dayOfWeek === z);
        for (const calendar of filteredCalendars) {
            list += _computeTimeIndicator(calendar, currentDate);
        }
        if (!filteredCalendars.length) {
            list += '-\t-\n';
        }
        mapping[z - 1].items = list;
    }
    return _computeEmbed(mapping, currentDate.getDay());
};

const _computeTimeIndicator = (
    calendar: Calendar & { event: GuildEvent },
    currentDate: Date
): string => {
    const dayOfWeek = currentDate.getDay();
    const [h, m] = calendar.time.split(':');
    const calHour = Number(h);
    const calMinute = Number(m);
    const dist = calendar.dayOfWeek - currentDate.getDay();
    const calDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + dist,
        calHour,
        calMinute,
        0,
        0
    );
    const dateDif = calDate.getTime() - currentDate.getTime();
    const lowerBorder = -Math.abs(1000 * 60 * 50);
    const upperBorder = 1000 * 60 * 15;
    if (
        (dayOfWeek === 0 ? 7 : dayOfWeek) === calendar.dayOfWeek &&
        dateDif >= lowerBorder &&
        dateDif <= upperBorder
    )
        return `\u15d2**${calendar.time}**\t${calendar.event.name}\n`;
    else return `**${calendar.time}**\t${calendar.event.name}\n`;
};

const _computeEmbed = (mapping: Array<{ day: string; items: string }>, dayOfWeek: number) => {
    const embed = new MessageEmbed().setColor('#0099ff').setTitle('Gilden Aktivitäten');
    for (let z = 1; z <= mapping.length; z++) {
        const map = mapping[z - 1];

        if (z === 6) embed.addField('\u2064', '\u2064', true);
        embed.addField(
            (dayOfWeek === (z === 7 ? 0 : z) ? '\u{1f7e2} ' : '') + map.day,
            map.items + '\u200b',
            true
        );
    }
    embed.addField('\u2064', '\u2064', true);
    embed.setTimestamp().setFooter({ text: 'Aktivitätten wiederholen sich wöchentlich' });
    return embed;
};
