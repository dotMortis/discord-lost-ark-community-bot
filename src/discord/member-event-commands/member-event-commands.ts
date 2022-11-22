import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';

import { SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { LogMode } from '@prisma/client';
import { v4 } from 'uuid';
import { Discord } from '../discord.model';
import { SlashSubCommand } from '../event.types';

export const CREATE: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('create')
            .setDescription('Erstellen eines Events')
            .addIntegerOption(o =>
                o.setName('dds').setDescription('Anzahl der DDs pro Gruppe').setRequired(true)
            )
            .addIntegerOption(o =>
                o
                    .setName('supps')
                    .setDescription('Anzahl der Supporter pro Gruppe')
                    .setRequired(true)
            )
            .addIntegerOption(o =>
                o
                    .setName('free')
                    .setDescription('Anzahl der freien Plätze pro Gruppe')
                    .setRequired(true)
            )
            .addStringOption(o => o.setName('name').setDescription('Event name').setRequired(true)),
    cb: async (i: ChatInputCommandInteraction, discord: Discord) => {
        await discord.memberEventFactory.action<'CREATE_EVENT'>(
            {
                channelId: i.channelId,
                creatorId: i.user.id,
                dds: i.options.getInteger('dds', true),
                free: i.options.getInteger('free', true),
                name: i.options.getString('name', true),
                supps: i.options.getInteger('supps', true),
                type: 'CREATE_EVENT'
            },
            `CREATE_EVENT_${v4()}`
        );
    }
};

export const REMOVE: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('remove')
            .setDescription('Löschen eines Events')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord) => {
        const eventId = i.options.getInteger('eventid', true);
        await discord.memberEventFactory.action<'REMOVE_EVENT'>(
            {
                eventId,
                type: 'REMOVE_EVENT',
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const DESCRIPE_EVENT: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('desc')
            .setDescription('Setzt die Eventbeschreibung')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addStringOption(o =>
                o
                    .setName('description')
                    .setDescription('Beschreibung für das Event')
                    .setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void> => {
        const eventId = i.options.getInteger('eventid', true);
        await discord.memberEventFactory.action<'UPDATE_EVENT_DESC'>(
            {
                type: 'UPDATE_EVENT_DESC',
                description: i.options.getString('description', true),
                eventId,
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const RENAME: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('name')
            .setDescription('Event umbennen')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addStringOption(o =>
                o.setName('name').setDescription('Neuer Eventname').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);
        await discord.memberEventFactory.action<'UPDATE_EVENT_NAME'>(
            {
                type: 'UPDATE_EVENT_NAME',
                newEventName: i.options.getString('name', true),
                eventId,
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const DESCRIPE_EVENT_PARTY: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('descg')
            .setDescription('Setzt die Beschreibung einer Gruppe')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('partyid').setDescription('Nummer der Gruppe').setRequired(true)
            )
            .addStringOption(o =>
                o.setName('description').setDescription('Beschreibung der Gruppe').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);
        await discord.memberEventFactory.action<'UPDATE_PARTY_DESC'>(
            {
                type: 'UPDATE_PARTY_DESC',
                description: i.options.getString('description', true),
                eventId: eventId,
                partyNumber: i.options.getInteger('partyid', true),
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const SWITCH_MEMBERS_EVENT_PARTY: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('switch')
            .setDescription('Wechselt die Position zweier SPieler innerhalb eines Events')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('groupone').setDescription('Nummer der Gruppe1').setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('memberone').setDescription('Nummer des Member1').setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('grouptwo').setDescription('Nummer der Gruppe2').setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('membertwo').setDescription('Nummer des Member2').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);
        await discord.memberEventFactory.action<'SWITCH_MEMBERS'>(
            {
                type: 'SWITCH_MEMBERS',
                eventId,
                memberOne: {
                    memberNumber: i.options.getInteger('memberone', true),
                    partyNumber: i.options.getInteger('groupone', true)
                },
                memberTwo: {
                    memberNumber: i.options.getInteger('membertwo', true),
                    partyNumber: i.options.getInteger('grouptwo', true)
                },
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const MOVE_MEMBER_EVENT_PARTY: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('move')
            .setDescription('Schiebt einen Spieler innerhalb eines Events in eine andere Party')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addStringOption(o =>
                o
                    .setName('groupold')
                    .setDescription('e (Ersatzbank) oder Nummer der aktuellen Gruppe')
                    .setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('memberid').setDescription('Nummer des Members').setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('groupnew').setDescription('Nummer der neuen Gruppe').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);
        const partyNumber = i.options.getString('groupold', true);
        await discord.memberEventFactory.action<'MOVE_MEMBER'>(
            {
                type: 'MOVE_MEMBER',
                eventId,
                member: {
                    memberNumber: i.options.getInteger('memberid', true),
                    partyNumber: Number(partyNumber) || 'e'
                },
                newPartyNumber: i.options.getInteger('groupnew', true),
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const MOVE_MEMBER_EVENT_SPARE: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('spare')
            .setDescription('Schiebt einen Spieler innerhalb eines Events auf die Ersatzbank')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addIntegerOption(o =>
                o
                    .setName('groupid')
                    .setDescription('Nummer der aktuellen Gruppe des Members')
                    .setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('memberid').setDescription('Nummer des Members').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);
        await discord.memberEventFactory.action<'MOVE_MEMBER_TO_SPARE'>(
            {
                type: 'MOVE_MEMBER_TO_SPARE',
                eventId,
                member: {
                    memberNumber: i.options.getInteger('memberid', true),
                    partyNumber: i.options.getInteger('groupid', true)
                },
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const KICK_MEMBER_EVENT_PARTY: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('kick')
            .setDescription('Kickt einen Spieler aus einem Event')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addStringOption(o =>
                o
                    .setName('groupid')
                    .setDescription('e (Ersatzbank) oder Nummer der Gruppe')
                    .setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('memberid').setDescription('Nummer des Members').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);
        const partyNumber = i.options.getString('groupid', true);
        await discord.memberEventFactory.action<'REMOVE_MEMBER_BY_PARTY_NUMBER'>(
            {
                type: 'REMOVE_MEMBER_BY_PARTY_NUMBER',
                eventId: eventId,
                memberNumber: i.options.getInteger('memberid', true),
                partyNumber: Number(partyNumber) || 'e',
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const IS_DONE_EVENT_PARTY: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('donep')
            .setDescription('Setzt eine Party auf erledigt')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addIntegerOption(o =>
                o.setName('groupid').setDescription('Nummer der Gruppe').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);

        await discord.memberEventFactory.action<'PARTY_IS_DONE'>(
            {
                type: 'PARTY_IS_DONE',
                eventId,
                partyNumber: i.options.getInteger('groupid', true),
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const IS_DONE_EVENT: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('donee')
            .setDescription('Setzt ein Event auf erledigt')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const eventId = i.options.getInteger('eventid', true);
        await discord.memberEventFactory.action<'EVENT_IS_DONE'>(
            {
                type: 'EVENT_IS_DONE',
                eventId,
                actionUserId: i.user.id
            },
            eventId.toString()
        );
    }
};

export const LIST_EVENTS: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder.setName('list').setDescription('Sendet eine Liste aller Events'),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        const events = await prismaClient.event.findMany();
        let message = '';
        for (const event of events) {
            const eventMsg = await discord.memberEventFactory.getEventMessage(event);
            message += `E-ID: ${event.id} - ${event.name}\n${
                eventMsg ? eventMsg.url : 'NO_MESSAGE_URL'
            }\n\n`;
        }
        return message || 'WHERE EVENTS?!';
    }
};

export const LOGS_EVENT: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('logs')
            .setDescription('Sendet eine Liste aller Logs eines Events')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord) => {
        const eventId = i.options.getInteger('eventid', true);

        const eventLogs = await prismaClient.eventLog.findMany({
            where: {
                eventId
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        let message = '';
        for (const eventLog of eventLogs) {
            eventLog.message = discord.removeUserPingFromMessage(eventLog.message);
            message += `[${
                eventLog.createdAt.toLocaleDateString() +
                ' - ' +
                eventLog.createdAt.toLocaleTimeString()
            }]\n${eventLog.message}\n\n`;
        }

        await i.reply({
            files: [
                new AttachmentBuilder(Buffer.from(message), {
                    name: new Date().toISOString() + `_${eventId}.txt`
                })
            ],
            ephemeral: true
        });
        return false;
    }
};

export const LOG_MODE_EVENT: SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) =>
        builder
            .setName('logmode')
            .setDescription('Setzt den Logmodus für ein Event')
            .addIntegerOption(o =>
                o.setName('eventid').setDescription('Event ID').setRequired(true)
            )
            .addStringOption(o =>
                o.setName('mode').setDescription('Neuer Logmodus').setRequired(true).addChoices(
                    {
                        name: 'Silent',
                        value: LogMode.SILENT
                    },
                    {
                        name: 'No ping',
                        value: LogMode.NO_PING
                    },
                    {
                        name: 'Full',
                        value: LogMode.FULL
                    }
                )
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord) => {
        const eventId = i.options.getInteger('eventid', true);

        await discord.memberEventFactory.setLogMode(
            eventId,
            <LogMode>i.options.getString('mode', true),
            i.user.id
        );
    }
};
