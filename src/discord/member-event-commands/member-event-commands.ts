import { Message } from 'discord.js';
import {
    EMemberEvent,
    TCreateEvent,
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
            '!event create <dds:supps:free(3:1:0)> <name>',
            'Erstellt ein Event mit eindeutigem Namen.'
        ]
    ],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, classMapping] = args;
        if (!classMapping) return;
        const [dds = 0, supps = 0, free = 0] = classMapping.split(':');
        const name = args.slice(3).join(' ');
        if (name) {
            await discord.memberEventFactory.action<TCreateEvent>({
                channelId: msg.channelId,
                creatorId: msg.author.id,
                dds: Number(dds),
                free: Number(free),
                name,
                supps: Number(supps),
                type: EMemberEvent.CREATE_EVENT
            });
        }
    }
};

export const REMOVE_MEMBER_EVENT: TMemberEventCommand = {
    command: 'remove',
    desc: [['!event remove <eventId>', 'Löscht ein Event.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, eventId] = args;
        if (Number(eventId)) {
            await discord.memberEventFactory.action<TRemoveEvent>({
                eventId: Number(eventId),
                type: EMemberEvent.REMOVE_EVENT
            });
        }
    }
};

export const DESCRIPE_EVENT: TMemberEventCommand = {
    command: 'desc',
    desc: [['!event desc <eventId> <description>', 'Setzt die Beschreibung eines Events.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, eventId] = args;
        const desc = args.slice(3).join(' ');
        if (Number(eventId)) {
            await discord.memberEventFactory.action<TUpdateEventDesc>({
                type: EMemberEvent.UPDATE_EVENT_DESC,
                description: desc,
                eventId: Number(eventId)
            });
        }
    }
};

export const DESCRIPE_EVENT_PARTY: TMemberEventCommand = {
    command: 'descp',
    desc: [['!event descp <eventId> <partyNumber> <name>', 'Setzt die Beschreibung einer Party.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, eventId, partyNumber] = args;
        if (!eventId || !partyNumber) return;
        const desc = args.slice(4).join(' ');
        if (Number(eventId) && Number(partyNumber)) {
            await discord.memberEventFactory.action<TUpdateParytDesc>({
                type: EMemberEvent.UPDATE_PARTY_DESC,
                description: desc,
                eventId: Number(eventId),
                partyNumber: Number(partyNumber)
            });
        }
    }
};

export const SWITCH_MEMBERS_EVENT_PARTY: TMemberEventCommand = {
    command: 'switch',
    desc: [
        [
            '!event switch <eventId> <#:#>',
            'Tauscht die Plätze zweier Spieler innerhalb eines Events.'
        ]
    ],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, eventId, switchStr1, switchStr2] = args;
        console.log('ARGS', args);

        if (!(eventId && switchStr1 && switchStr2)) return;
        const [partyOne, memberOne] = switchStr1.split(':');
        const [partyTwo, memberTwo] = switchStr2.split(':');
        if (
            Number(eventId) &&
            Number(memberOne) &&
            Number(memberTwo) &&
            Number(partyOne) &&
            Number(partyTwo)
        ) {
            await discord.memberEventFactory.action<TSwitchMembers>({
                type: EMemberEvent.SWITCH_MEMBERS,
                eventId: Number(eventId),
                memberOne: {
                    memberNumber: Number(memberOne),
                    partyNumber: Number(partyOne)
                },
                memberTwo: {
                    memberNumber: Number(memberTwo),
                    partyNumber: Number(partyTwo)
                }
            });
        }
    }
};

export const KICK_MEMBER_EVENT_PARTY: TMemberEventCommand = {
    command: 'kick',
    desc: [['!event kick <eventId> <#:#>', 'Kickt einen Spieler aus einem Event.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, eventId, kickStr] = args;
        if (!(eventId && kickStr)) return;
        const [partyOne, memberOne] = kickStr.split(':');
        if (Number(eventId) && Number(memberOne) && Number(partyOne)) {
            await discord.memberEventFactory.action<TRemoveMemberByPartyNumber>({
                type: EMemberEvent.REMOVE_MEMBER_BY_PARTY_NUMBER,
                eventId: Number(eventId),
                memberNumber: Number(memberOne),
                partyNumber: Number(partyOne)
            });
        }
    }
};
