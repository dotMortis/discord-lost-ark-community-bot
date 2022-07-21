import { logger } from '@bits_devel/logger';
import { Message, MessageAttachment } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';

import { LogMode } from '@prisma/client';
import { Discord, TMemberEventCommand } from '../discord.model';

export const ADD_MEMBER_EVENT: TMemberEventCommand = {
    command: 'create',
    desc: [
        [
            '!event create <dds:supps:free> <name>',
            'Erstellt ein Event mit eindeutigem Namen im ausgeführten Channel (!event create 3:1:0 My Event)'
        ]
    ],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, classMapping] = args;
        if (!classMapping) return 'Error:\n```' + ADD_MEMBER_EVENT.desc[0] + '```';
        const [dds = 0, supps = 0, free = 0] = classMapping.split(':');
        const name = args.slice(3).join(' ');
        if (name) {
            await discord.memberEventFactory.action<'CREATE_EVENT'>({
                channelId: msg.channelId,
                creatorId: msg.author.id,
                dds: Number(dds),
                free: Number(free),
                name,
                supps: Number(supps),
                type: 'CREATE_EVENT'
            });
        } else {
            return 'Error:\n```' + ADD_MEMBER_EVENT.desc[0] + '```';
        }
    }
};

export const REMOVE_MEMBER_EVENT: TMemberEventCommand = {
    command: 'remove',
    desc: [['!event remove <eventId>', 'Löscht ein Event']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId] = args;
        if (Number(eventId)) {
            await discord.memberEventFactory.action<'REMOVE_EVENT'>({
                eventId: Number(eventId),
                type: 'REMOVE_EVENT',
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + REMOVE_MEMBER_EVENT.desc[0] + '```';
        }
    }
};

export const DESCRIPE_EVENT: TMemberEventCommand = {
    command: 'desc',
    desc: [['!event desc <eventId> <description>', 'Setzt die Beschreibung eines Events']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId] = args;
        const desc = args.slice(3).join(' ');
        if (Number(eventId)) {
            await discord.memberEventFactory.action<'UPDATE_EVENT_DESC'>({
                type: 'UPDATE_EVENT_DESC',
                description: desc,
                eventId: Number(eventId),
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + DESCRIPE_EVENT.desc[0] + '```';
        }
    }
};

export const RENAME_EVENT: TMemberEventCommand = {
    command: 'name',
    desc: [['!event name <eventId> <newName>', 'Benennt ein Event um']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId] = args;
        const newEventName = args.slice(3).join(' ');
        if (Number(eventId)) {
            await discord.memberEventFactory.action<'UPDATE_EVENT_NAME'>({
                type: 'UPDATE_EVENT_NAME',
                newEventName,
                eventId: Number(eventId),
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + RENAME_EVENT.desc[0] + '```';
        }
    }
};

export const DESCRIPE_EVENT_PARTY: TMemberEventCommand = {
    command: 'descp',
    desc: [['!event descp <eventId> <partyId> <name>', 'Setzt die Beschreibung einer Party']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId, partyNumber] = args;
        if (!eventId || !partyNumber) return 'Error:\n```' + DESCRIPE_EVENT_PARTY.desc[0] + '```';
        const desc = args.slice(4).join(' ');
        if (Number(eventId) && Number(partyNumber)) {
            await discord.memberEventFactory.action<'UPDATE_PARTY_DESC'>({
                type: 'UPDATE_PARTY_DESC',
                description: desc,
                eventId: Number(eventId),
                partyNumber: Number(partyNumber),
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + DESCRIPE_EVENT_PARTY.desc[0] + '```';
        }
    }
};

export const SWITCH_MEMBERS_EVENT_PARTY: TMemberEventCommand = {
    command: 'switch',
    desc: [
        [
            '!event switch <eventId> <partyId1:memberId1> <partyId2:memberId2>',
            'Tauscht die Plätze zweier Spieler innerhalb eines Events'
        ]
    ],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId, switchStr1, switchStr2] = args;
        if (!(eventId && switchStr1 && switchStr2))
            return 'Error:\n```' + SWITCH_MEMBERS_EVENT_PARTY.desc[0] + '```';
        const [partyOne, memberOne] = switchStr1.split(':');
        const [partyTwo, memberTwo] = switchStr2.split(':');
        if (
            Number(eventId) &&
            Number(memberOne) &&
            Number(memberTwo) &&
            Number(partyOne) &&
            Number(partyTwo)
        ) {
            await discord.memberEventFactory.action<'SWITCH_MEMBERS'>({
                type: 'SWITCH_MEMBERS',
                eventId: Number(eventId),
                memberOne: {
                    memberNumber: Number(memberOne),
                    partyNumber: Number(partyOne)
                },
                memberTwo: {
                    memberNumber: Number(memberTwo),
                    partyNumber: Number(partyTwo)
                },
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + SWITCH_MEMBERS_EVENT_PARTY.desc[0] + '```';
        }
    }
};

export const MOVE_MEMBER_EVENT_PARTY: TMemberEventCommand = {
    command: 'move',
    desc: [
        [
            '!event move <eventId> <partyIdOld:memberId> <partyIdNew>',
            'Schiebt einen Spieler innerhalb eines Events in eine andere Party'
        ]
    ],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId, switchStr, newPartyNumber] = args;
        if (!(eventId && switchStr)) return 'Error:\n```' + MOVE_MEMBER_EVENT_PARTY.desc[0] + '```';
        const [partyOne, memberOne] = switchStr.split(':');
        if (
            Number(eventId) &&
            Number(memberOne) &&
            (partyOne.match(/^e$/i) || Number(partyOne)) &&
            Number(newPartyNumber)
        ) {
            await discord.memberEventFactory.action<'MOVE_MEMBER'>({
                type: 'MOVE_MEMBER',
                eventId: Number(eventId),
                member: {
                    memberNumber: Number(memberOne),
                    partyNumber: Number(partyOne) || <'e'>partyOne.toLowerCase()
                },
                newPartyNumber: Number(newPartyNumber),
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + MOVE_MEMBER_EVENT_PARTY.desc[0] + '```';
        }
    }
};

export const MOVE_MEMBER_EVENT_SPARE: TMemberEventCommand = {
    command: 'spare',
    desc: [
        [
            '!event spare <eventId> <partyId:memberId>',
            'Schiebt einen Spieler innerhalb eines Events auf die Ersatzbank'
        ]
    ],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId, switchStr] = args;
        if (!(eventId && switchStr)) return 'Error:\n```' + MOVE_MEMBER_EVENT_SPARE.desc[0] + '```';
        const [partyNumber, memberNumber] = switchStr.split(':');
        if (Number(eventId) && Number(memberNumber) && Number(partyNumber)) {
            await discord.memberEventFactory.action<'MOVE_MEMBER_TO_SPARE'>({
                type: 'MOVE_MEMBER_TO_SPARE',
                eventId: Number(eventId),
                member: {
                    memberNumber: Number(memberNumber),
                    partyNumber: Number(partyNumber)
                },
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + MOVE_MEMBER_EVENT_SPARE.desc[0] + '```';
        }
    }
};

export const KICK_MEMBER_EVENT_PARTY: TMemberEventCommand = {
    command: 'kick',
    desc: [['!event kick <eventId> <partyId:memberId>', 'Kickt einen Spieler aus einem Event']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId, kickStr] = args;
        if (!(eventId && kickStr)) return 'Error:\n```' + KICK_MEMBER_EVENT_PARTY.desc[0] + '```';
        const [partyOne, memberOne] = kickStr.split(':');
        if (Number(eventId) && Number(memberOne) && (partyOne.match(/^e$/i) || Number(partyOne))) {
            await discord.memberEventFactory.action<'REMOVE_MEMBER_BY_PARTY_NUMBER'>({
                type: 'REMOVE_MEMBER_BY_PARTY_NUMBER',
                eventId: Number(eventId),
                memberNumber: Number(memberOne),
                partyNumber: Number(partyOne) || <'e'>partyOne.toLowerCase(),
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + KICK_MEMBER_EVENT_PARTY.desc[0] + '```';
        }
    }
};

export const IS_DONE_EVENT_PARTY: TMemberEventCommand = {
    command: 'party_done',
    desc: [['!event party_done <eventId> <partyId>', 'Setzt eine Party auf erledigt']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId, partyNumber] = args;
        if (Number(eventId) && Number(partyNumber)) {
            await discord.memberEventFactory.action<'PARTY_IS_DONE'>({
                type: 'PARTY_IS_DONE',
                eventId: Number(eventId),
                partyNumber: Number(partyNumber),
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + IS_DONE_EVENT_PARTY.desc[0] + '```';
        }
    }
};

export const IS_DONE_EVENT: TMemberEventCommand = {
    command: 'event_done',
    desc: [['!event event_done <eventId>', 'Setzt ein Event auf erledigt']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId] = args;
        if (Number(eventId)) {
            await discord.memberEventFactory.action<'EVENT_IS_DONE'>({
                type: 'EVENT_IS_DONE',
                eventId: Number(eventId),
                actionUserId: msg.author.id
            });
        } else {
            return 'Error:\n```' + IS_DONE_EVENT.desc[0] + '```';
        }
    }
};

export const LIST_EVENTS: TMemberEventCommand = {
    command: 'list',
    desc: [['!event list', 'Sendet eine Liste aller Events']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        try {
            const events = await prismaClient.event.findMany();
            let message = '';
            for (const event of events) {
                const eventMsg = await discord.memberEventFactory.getEventMessage(event);
                message += `E-ID: ${event.id} - ${event.name}\n${
                    eventMsg ? eventMsg.url : 'NO_MESSAGE_URL'
                }\n\n`;
            }
            return message || 'WHERE EVENTS?!';
        } catch (e) {
            logger.error(e);
            return 'Error:\n```' + LIST_EVENTS.desc[0] + '```';
        }
    }
};

export const LOGS_EVENT: TMemberEventCommand = {
    command: 'logs',
    desc: [['!event logs <eventId>', 'Sendet eine Liste aller Logs eines Events']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        const [trigger, command, eventId] = args;
        if (Number(eventId)) {
            const eventLogs = await prismaClient.eventLog.findMany({
                where: {
                    eventId: Number(eventId)
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

            await msg.reply({
                files: [
                    new MessageAttachment(
                        Buffer.from(message),
                        new Date().toISOString() + `_${eventId}.txt`
                    )
                ]
            });
        } else {
            return 'Error:\n```' + LOGS_EVENT.desc[0] + '```';
        }
    }
};

export const LOG_MODE_EVENT: TMemberEventCommand = {
    command: 'logmode',
    desc: [['!event logmode <eventId> <FULL|SILENT|NO_PING>', 'Setzt den Logmodus für ein Event']],
    callback: async (
        msg: Message<boolean>,
        args: string[],
        discord: Discord
    ): Promise<void | string> => {
        let [trigger, command, eventId, mode] = args;
        mode = mode?.toUpperCase();
        if (Number(eventId) && mode in LogMode) {
            await discord.memberEventFactory.setLogMode(
                Number(eventId),
                <LogMode>mode,
                msg.author.id
            );
        } else {
            return 'Error:\n```' + LOG_MODE_EVENT.desc[0] + '```';
        }
    }
};
