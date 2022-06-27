import { logger } from '@bits_devel/logger';
import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import {
    EMemberEvent,
    TCreateEvent,
    TEventIsDone,
    TMoveMember,
    TPartyIsDone,
    TRemoveEvent,
    TRemoveMemberByPartyNumber,
    TSwitchMembers,
    TUpdateEventDesc,
    TUpdateParytDesc
} from '../../models/member-event-factory';
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
            return discord.memberEventFactory
                .action<TCreateEvent>({
                    channelId: msg.channelId,
                    creatorId: msg.author.id,
                    dds: Number(dds),
                    free: Number(free),
                    name,
                    supps: Number(supps),
                    type: EMemberEvent.CREATE_EVENT,
                    roleNames: []
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + ADD_MEMBER_EVENT.desc[0] + '```';
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
            return discord.memberEventFactory
                .action<TRemoveEvent>({
                    eventId: Number(eventId),
                    type: EMemberEvent.REMOVE_EVENT,
                    actionUserId: msg.author.id
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + REMOVE_MEMBER_EVENT.desc[0] + '```';
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
            await discord.memberEventFactory
                .action<TUpdateEventDesc>({
                    type: EMemberEvent.UPDATE_EVENT_DESC,
                    description: desc,
                    eventId: Number(eventId),
                    actionUserId: msg.author.id
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + DESCRIPE_EVENT.desc[0] + '```';
                });
        } else {
            return 'Error:\n```' + DESCRIPE_EVENT.desc[0] + '```';
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
            await discord.memberEventFactory
                .action<TUpdateParytDesc>({
                    type: EMemberEvent.UPDATE_PARTY_DESC,
                    description: desc,
                    eventId: Number(eventId),
                    partyNumber: Number(partyNumber),
                    actionUserId: msg.author.id
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + DESCRIPE_EVENT_PARTY.desc[0] + '```';
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
            await discord.memberEventFactory
                .action<TSwitchMembers>({
                    type: EMemberEvent.SWITCH_MEMBERS,
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
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + SWITCH_MEMBERS_EVENT_PARTY.desc[0] + '```';
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
        if (Number(eventId) && Number(memberOne) && Number(partyOne) && Number(newPartyNumber)) {
            await discord.memberEventFactory
                .action<TMoveMember>({
                    type: EMemberEvent.MOVE_MEMBER,
                    eventId: Number(eventId),
                    member: {
                        memberNumber: Number(memberOne),
                        partyNumber: Number(partyOne)
                    },
                    newPartyNumber: Number(newPartyNumber),
                    actionUserId: msg.author.id
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + MOVE_MEMBER_EVENT_PARTY.desc[0] + '```';
                });
        } else {
            return 'Error:\n```' + MOVE_MEMBER_EVENT_PARTY.desc[0] + '```';
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
        if (Number(eventId) && Number(memberOne) && Number(partyOne)) {
            await discord.memberEventFactory
                .action<TRemoveMemberByPartyNumber>({
                    type: EMemberEvent.REMOVE_MEMBER_BY_PARTY_NUMBER,
                    eventId: Number(eventId),
                    memberNumber: Number(memberOne),
                    partyNumber: Number(partyOne),
                    actionUserId: msg.author.id
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + KICK_MEMBER_EVENT_PARTY.desc[0] + '```';
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
            await discord.memberEventFactory
                .action<TPartyIsDone>({
                    type: EMemberEvent.PARTY_IS_DONE,
                    eventId: Number(eventId),
                    partyNumber: Number(partyNumber),
                    actionUserId: msg.author.id
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + IS_DONE_EVENT_PARTY.desc[0] + '```';
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
            await discord.memberEventFactory
                .action<TEventIsDone>({
                    type: EMemberEvent.EVENT_IS_DONE,
                    eventId: Number(eventId),
                    actionUserId: msg.author.id
                })
                .catch(e => {
                    logger.error(e);
                    return 'Error:\n```' + IS_DONE_EVENT.desc[0] + '```';
                });
        } else {
            return 'Error:\n```' + IS_DONE_EVENT.desc[0] + '```';
        }
    }
};

export const EVENTS: TMemberEventCommand = {
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
                const eventMsg = discord.memberEventFactory.getEventMessage(event);
                message += `E-ID: ${event.id} - ${event.name} - ${
                    eventMsg ? eventMsg.url : 'NO_MESSAGE_URL'
                }\n\n`;
            }
            return message || 'WHERE EVENTS?!';
        } catch (e) {
            logger.error(e);
            return 'Error:\n```' + EVENTS.desc[0] + '```';
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
                }
            });
            let message = '';
            for (const eventLog of eventLogs) {
                message += `\`\`\`[${
                    eventLog.createdAt.toLocaleDateString() +
                    ' - ' +
                    eventLog.createdAt.toLocaleTimeString()
                }]\t${eventLog}\`\`\`\n`;
            }
            return message || 'NO_LOGS';
        } else {
            return 'Error:\n```' + LOGS_EVENT.desc[0] + '```';
        }
    }
};
