import { logger } from '@bits_devel/logger';
import { Class, Event, EventRole, Party, PartyMember, Role } from '@prisma/client';
import {
    Emoji,
    Message,
    MessageEmbed,
    PartialMessage,
    TextChannel,
    ThreadChannel
} from 'discord.js';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { prismaClient } from '../../db/prisma-client';
import { Discord } from '../../discord/discord.model';
import { getEmbedMemberEvent } from '../../discord/embeds/member-event.embed';
import { CustomEmojiFactory } from '../custom-emoji/custom-emoji-factory.model';
import { TCustomEmojiName } from '../custom-emoji/custom-emoji.collection';
import { NUMERIC_EMOTES } from '../numeric-emots.collection';
import { TMemberEvent, TMemberEventName, TMemberEvents } from './member-event.types';

export class MemberEventFactory extends EventEmitter {
    //#region member variables
    private _isInit: boolean;
    private _runAgain: boolean;
    private _isRunning: boolean;
    private _actionQueue: Array<{
        uid: string;
        data: TMemberEvent;
    }>;
    private readonly _eventIdReg: RegExp;
    private readonly _discord: Discord;
    private readonly _customEmojiFactory: CustomEmojiFactory;
    //#endregion

    //#region constructor
    constructor(discord: Discord, emojiFactory: CustomEmojiFactory) {
        super();
        this._isInit = false;
        this._runAgain = this._isRunning = false;
        this._eventIdReg = new RegExp(/E-ID:( +|\t)(?<id>[0-9]+)/);
        this._actionQueue = new Array<{
            uid: string;
            data: TMemberEvent;
        }>();
        this._discord = discord;
        this._customEmojiFactory = emojiFactory;
        this.on('ACTION', async data => {
            try {
                this._actionQueue.push(data);
                await this._updateEvents();
            } catch (error: any) {
                logger.error(error);
            }
        });
    }
    //#endregion

    //#region events emitter
    public on<ACTION_DATA_NAME extends TMemberEventName>(
        eventName: 'ACTION',
        cb: (data: { data: TMemberEvents[ACTION_DATA_NAME]; uid: string }) => void
    ): this {
        return super.on(eventName, cb);
    }

    public emit<ACTION_DATA_NAME extends TMemberEventName>(
        eventName: 'ACTION',
        data: { data: TMemberEvents[ACTION_DATA_NAME]; uid: string }
    ): boolean {
        return super.emit(eventName, data);
    }

    public async action<ACTION_DATA_NAME extends TMemberEventName>(
        actionData: TMemberEvents[ACTION_DATA_NAME]
    ): Promise<void> {
        this._isInitCheck();
        const currUid = v4();
        this.emit('ACTION', { data: actionData, uid: currUid });
        return new Promise<void>((res, rej) => {
            const cb = (uid: string, data: TMemberEvents[ACTION_DATA_NAME], error?: Error) => {
                if (uid === currUid) {
                    this.removeListener(actionData.type, cb);
                    if (error) rej();
                    else res();
                }
            };
            this.onActionEnd(actionData.type, cb);
        });
    }

    public emitActionEnd<ACTION_DATA_NAME extends TMemberEventName>(
        action: TMemberEvents[ACTION_DATA_NAME]['type'],
        data: { uid: string; data: TMemberEvents[ACTION_DATA_NAME]; error?: Error }
    ): boolean {
        this._isInitCheck();
        return super.emit(action, data.uid, data.data, data.error);
    }

    public onActionEnd<ACTION_DATA_NAME extends TMemberEventName>(
        action: TMemberEvents[ACTION_DATA_NAME]['type'],
        cb: (uid: string, data: TMemberEvents[ACTION_DATA_NAME], error?: Error) => void
    ): this {
        return super.on(action, cb);
    }
    //#endregion

    //#region public func
    public async init(): Promise<void> {
        await this._fetchAllMessages();
        this._discord.bot.on('messageReactionAdd', async (reaction, user) => {
            let relevatnReaction = false;
            try {
                if (user.id === this._discord.bot.user?.id) return;
                if (reaction.message.guildId && reaction.emoji.name) {
                    const laClass = await this._getClassFromIcon(reaction.emoji.name).catch(
                        _ => null
                    );
                    if (laClass != null) {
                        const eventId = this._getEventIdFromMessage(reaction.message);
                        if (eventId) {
                            const event = await this._getEventFromId(eventId);
                            relevatnReaction = true;
                            await this.action<'ADD_MEMBER'>({
                                classIcon: reaction.emoji.name,
                                eventId: event.id,
                                type: 'ADD_MEMBER',
                                userId: user.id,
                                actionUserId: user.id
                            });
                        }
                    } else if (Buffer.from(reaction.emoji.name).toString('hex') === 'f09f9aab') {
                        const eventId = this._getEventIdFromMessage(reaction.message);
                        if (eventId) {
                            const event = await this._getEventFromId(eventId);
                            relevatnReaction = true;
                            let msg = `${event.name}\nE-ID:\t${event.id}\nBitte reagieren mit der Nummer des zu löschenden Characters.`;
                            const partyMembersOfUser = new Array<
                                PartyMember & { class: Class; partyNumber: number }
                            >();
                            for (
                                let partyCount = 0;
                                partyCount < event.partys.length;
                                partyCount++
                            ) {
                                const party = event.partys[partyCount];
                                for (const partyMember of party.partyMembers) {
                                    if (partyMember.userId === user.id)
                                        partyMembersOfUser.push({
                                            ...partyMember,
                                            partyNumber: partyCount + 1
                                        });
                                }
                            }
                            if (!partyMembersOfUser.length) return;
                            partyMembersOfUser.sort((a, b) => a.charNo - b.charNo);
                            partyMembersOfUser.forEach(partyMember => {
                                msg += `\n#${partyMember.charNo} ${this.toIconString(
                                    partyMember.class
                                )} - Party ${partyMember.partyNumber}`;
                            });
                            const newMessage = await user.send(msg);
                            await this._setReactions(newMessage, 'numbers', 6);
                        }
                    }
                } else if (reaction.emoji) {
                    const eventId = this._getEventIdFromMessage(reaction.message);
                    const charNumber = this._iconToNumber(reaction.emoji);
                    if (eventId && charNumber != null) {
                        const event = await this._getEventFromId(eventId);
                        relevatnReaction = true;
                        await this.action<'REMOVE_MEMBER_BY_USER_ID'>({
                            charNumber,
                            eventId: event.id,
                            type: 'REMOVE_MEMBER_BY_USER_ID',
                            userId: user.id,
                            actionUserId: user.id
                        });
                    }
                }
            } catch (e) {
                logger.error(e);
            } finally {
                if (user.id !== this._discord.bot.user?.id && !reaction.message.guildId)
                    await reaction.message.delete();
                else if (user.id !== this._discord.bot.user?.id && relevatnReaction)
                    await reaction.users.remove(user.id);
            }
        });
        await this.updateAllEvents();
        this._isInit = true;
    }

    public async updateAllEvents(): Promise<void> {
        this._isInitCheck();
        const events = await prismaClient.event.findMany({});
        for (const event of events) {
            await this._updateEvent(event.id, true);
        }
    }

    public toIconString(laClass: Class): string | undefined {
        const customEmoji = this._customEmojiFactory.fromName(<TCustomEmojiName>laClass.icon);
        return customEmoji?.toIconString();
    }

    public async getEventMessage(event: Event): Promise<Message<boolean> | undefined> {
        this._isInitCheck();
        const currChannel = <TextChannel>this._discord.guild.channels.cache.get(event.channelId);
        const message = currChannel?.messages.cache.get(event.messageId || '');
        await message?.thread?.fetch();
        return message;
    }
    //#endregion

    //#region private func
    private async _createEvent(
        creatorId: string,
        dds: number,
        supps: number,
        free: number,
        name: string,
        channelId: string,
        roleNames: string[]
    ): Promise<number> {
        const roles = new Array<{ name: string; id: string }>();
        for (const roleName of roleNames) {
            const role = this._discord.guild.roles.cache.find(role => role.name === roleName);
            if (role) {
                roles.push({
                    name: roleName,
                    id: role.id
                });
            }
        }
        const event = await prismaClient.event.create({
            data: {
                creatorId,
                dds,
                supps,
                free,
                name,
                channelId,
                partys: {
                    create: {}
                },
                roles: {
                    createMany: {
                        data: roles,
                        skipDuplicates: true
                    }
                }
            }
        });
        await this._createEventRole(event.id);
        return event.id;
    }

    private async _setPartyIsDone(
        eventId: number,
        partyNumber: number,
        actionUserId: string
    ): Promise<number> {
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId
            },
            include: {
                partys: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
        if (event) {
            const { partys } = event;
            for (let z = 0; z < partys.length; z++) {
                if (z + 1 === partyNumber) {
                    await prismaClient.party.update({
                        where: {
                            id: partys[z].id
                        },
                        data: {
                            isDone: !partys[z].isDone
                        }
                    });
                    break;
                }
            }
            const message = await this.getEventMessage(event);
            if (message?.thread) {
                await this._createLog(
                    eventId,
                    message.thread,
                    `<@${actionUserId}> hat "Group ${partyNumber}" abgeschlossen`
                );
            }
        }
        return eventId;
    }

    private async _setEventIsDone(eventId: number, actionUserId: string): Promise<number> {
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId
            }
        });
        if (event) {
            await prismaClient.event.update({
                where: {
                    id: event.id
                },
                data: {
                    isDone: !event.isDone
                }
            });
            const message = await this.getEventMessage(event);
            if (message?.thread) {
                await this._createLog(
                    eventId,
                    message.thread,
                    `<@${actionUserId}> hat das Event abgeschlossen`
                );
            }
        }
        return eventId;
    }

    private async _removeEvent(eventId: number, actionUserId: string): Promise<number> {
        const event = await prismaClient.event.delete({
            where: {
                id: eventId
            }
        });
        await this._removeEventRole(event.id);
        if (event) {
            const message = await this.getEventMessage(event);
            const thread = await message?.thread?.fetch();
            if (thread) {
                await this._createLog(eventId, thread, `<@${actionUserId}> hat das Event gelöscht`);
                await thread?.delete();
                await message?.delete();
            }
        }
        return eventId;
    }

    private async _updateEventDesc(
        eventId: number,
        description: string,
        actionUserId: string
    ): Promise<number> {
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId
            }
        });
        if (event) {
            await prismaClient.event.update({
                where: {
                    id: eventId
                },
                data: {
                    description
                }
            });
            const message = await this.getEventMessage(event);
            if (message?.thread) {
                await this._createLog(
                    eventId,
                    message.thread,
                    `<@${actionUserId}> hat die Event Beschreibung geändert`
                );
            }
        }
        return eventId;
    }

    private async _updateParytDesc(
        eventId: number,
        partyNumber: number,
        description: string,
        actionUserId: string
    ): Promise<number> {
        const party = await this._getPartyByNumber(eventId, partyNumber, false);
        if (party) {
            await prismaClient.party.update({
                where: {
                    id: party.id
                },
                data: {
                    description
                }
            });
        }
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId
            }
        });
        if (event && party) {
            const message = await this.getEventMessage(event);
            if (message?.thread) {
                await this._createLog(
                    eventId,
                    message.thread,
                    `<@${actionUserId}> hat die "Group ${partyNumber}" Beschreibung geändert`
                );
            }
        }

        return eventId;
    }

    private async _addMember(
        eventId: number,
        classIcon: string,
        userId: string,
        actionUserId: string
    ): Promise<number> {
        const event = await this._getEventFromId(eventId);
        const laClass = await this._getClassFromIcon(classIcon);
        const maxMembers = event.dds + event.free + event.supps;
        const maxRoleCount = this._getRoleCounts(event, laClass);
        let currentUserCount = 0;
        const charNumbers = new Array<number>();
        for (const party of event.partys) {
            currentUserCount += party.partyMembers.filter(member => {
                const result = member.userId === userId;
                if (result) charNumbers.push(member.charNo);
                return result;
            }).length;
        }
        if (maxRoleCount < 1 || currentUserCount === 6) {
            return eventId;
        }
        charNumbers.sort((a, b) => a - b);
        let newCharNumber = charNumbers.length ? 0 : 1;
        for (let z = 1; z <= charNumbers.length; z++) {
            if (z !== charNumbers[z - 1]) {
                newCharNumber = z;
                break;
            } else {
                newCharNumber = z + 1;
            }
        }
        let isAdded = false;
        for (const party of event.partys) {
            const currRoleCount = party.partyMembers.filter(
                member => member.class.role === laClass.role
            ).length;
            const isUserInParty =
                party.partyMembers.findIndex(member => {
                    return member.userId === userId;
                }) > -1;
            if (
                !party.isDone &&
                !isUserInParty &&
                party.partyMembers.length < maxMembers &&
                currRoleCount < maxRoleCount
            ) {
                await this._addMemberToParty(party, laClass, newCharNumber, userId);
                isAdded = true;
                break;
            }
        }
        if (!isAdded) {
            const newParty = await this._createParty(eventId);
            await this._addMemberToParty(
                { ...newParty, partyMembers: new Array<PartyMember>() },
                laClass,
                newCharNumber,
                userId
            );
        }
        await this._addEventRoleToUser(event.id, userId);
        const message = await this.getEventMessage(event);
        if (message?.thread) {
            await this._createLog(
                eventId,
                message.thread,
                userId === actionUserId
                    ? `<@${actionUserId}> hat seinen Character #${newCharNumber} angemeldet`
                    : `<@${actionUserId}> hat Character #${newCharNumber} für <@${userId}> angemeldet`
            );
        }
        return eventId;
    }

    private async _removeMemberByUserId(
        eventId: number,
        charNumber: number,
        userId: string,
        actionUserId: string
    ): Promise<number> {
        await prismaClient.partyMember.deleteMany({
            where: {
                party: {
                    eventId
                },
                charNo: charNumber,
                userId
            }
        });
        const memberChars = await prismaClient.partyMember.findMany({
            where: {
                party: {
                    eventId
                },
                userId
            }
        });
        if (!memberChars.length) await this._removeEventRoleFromUser(eventId, userId);
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId
            }
        });
        if (event) {
            const message = await this.getEventMessage(event);
            if (message?.thread) {
                await this._createLog(
                    eventId,
                    message.thread,
                    userId === actionUserId
                        ? `<@${actionUserId}> hat seinen Character #${charNumber} abgemeldet`
                        : `<@${actionUserId}> hat Character #${charNumber} von <@${userId}> abgemeldet`
                );
            }
        }
        return eventId;
    }

    private async _removeMemberByPartyNumber(
        eventId: number,
        memberNumber: number,
        partyNumber: number,
        actionUserId: string
    ): Promise<number> {
        const party = await this._getPartyByNumber(eventId, partyNumber, true);
        const partyMember = party?.partyMembers.find(member => member.memberNo === memberNumber);
        if (partyMember) {
            await prismaClient.partyMember.delete({
                where: {
                    uid: partyMember.uid
                }
            });
            const memberChars = await prismaClient.partyMember.findMany({
                where: {
                    party: {
                        eventId
                    },
                    userId: partyMember.userId
                }
            });
            if (!memberChars.length) {
                await this._removeEventRoleFromUser(eventId, partyMember.userId);
            }
            const event = await prismaClient.event.findFirst({
                where: {
                    id: eventId
                }
            });
            if (event) {
                const message = await this.getEventMessage(event);
                if (message?.thread) {
                    await this._createLog(
                        eventId,
                        message.thread,
                        partyMember.userId === actionUserId
                            ? `<@${actionUserId}> hat seinen Character #${partyMember.charNo} abgemeldet`
                            : `<@${actionUserId}> hat Character #${partyMember.charNo} von <@${partyMember.userId}> abgemeldet`
                    );
                }
            }
        }
        return eventId;
    }

    private async _switchMembers(
        eventId: number,
        memberOne: { memberNumber: number; partyNumber: number },
        memberTwo: { memberNumber: number; partyNumber: number },
        actionUserId: string
    ): Promise<number> {
        const partys = await prismaClient.party.findMany({
            where: {
                eventId
            },
            include: {
                partyMembers: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        let partyMemberOne: PartyMember | undefined;
        let partyMemberTwo: PartyMember | undefined;
        let partyOne: (Party & { partyMembers: PartyMember[] }) | null = null;
        let partyTwo: (Party & { partyMembers: PartyMember[] }) | null = null;
        for (let z = 0; z < partys.length; z++) {
            const party = partys[z];
            if (z + 1 === memberOne.partyNumber) {
                partyMemberOne = party.partyMembers.find(
                    member => member.memberNo === memberOne.memberNumber
                );
                partyOne = party;
            }
            if (z + 1 === memberTwo.partyNumber) {
                partyMemberTwo = party.partyMembers.find(
                    member => member.memberNo === memberTwo.memberNumber
                );
                partyTwo = party;
            }
            if (partyMemberOne && partyMemberTwo && partyOne && partyTwo) {
                const duplicateMemberOne = partyOne.partyMembers.find(
                    member => member.userId === partyMemberTwo?.userId
                );
                if (duplicateMemberOne && partyMemberOne.userId !== duplicateMemberOne.userId) {
                    return eventId;
                }
                const duplicateMemberTwo = partyTwo.partyMembers.find(
                    member => member.userId === partyMemberOne?.userId
                );
                if (duplicateMemberTwo && partyMemberTwo.userId !== duplicateMemberTwo.userId) {
                    return eventId;
                }

                await prismaClient.partyMember.delete({
                    where: {
                        uid: partyMemberOne.uid
                    }
                });
                await prismaClient.partyMember.update({
                    where: {
                        uid: partyMemberTwo.uid
                    },
                    data: {
                        partyId: partyMemberOne.partyId,
                        memberNo: partyMemberOne.memberNo
                    }
                });
                await prismaClient.partyMember.create({
                    data: {
                        ...partyMemberOne,
                        partyId: partyMemberTwo.partyId,
                        memberNo: partyMemberTwo.memberNo
                    }
                });
                const event = await prismaClient.event.findFirst({
                    where: {
                        id: eventId
                    }
                });
                if (event) {
                    const message = await this.getEventMessage(event);
                    if (message?.thread) {
                        await this._createLog(
                            eventId,
                            message.thread,
                            `<@${actionUserId}> hat [<@${partyMemberOne.userId}> Group #${memberOne.partyNumber} Member #${memberOne.memberNumber}] mit [<@${partyMemberTwo.userId}> Group #${memberTwo.partyNumber} Member #${memberTwo.memberNumber}] getauscht`
                        );
                    }
                }
                break;
            }
        }
        return eventId;
    }

    private async _moveMember(
        eventId: number,
        member: { memberNumber: number; partyNumber: number },
        newPartyNumber: number,
        actionUserId: string
    ): Promise<number> {
        const partys = await prismaClient.party.findMany({
            where: {
                eventId
            },
            include: {
                partyMembers: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        let partyToMove: (Party & { partyMembers: PartyMember[] }) | null = null;
        let partyMemberToMove: PartyMember | undefined;
        for (let z = 0; z < partys.length; z++) {
            const party = partys[z];
            if (z + 1 === member.partyNumber) {
                partyMemberToMove = party.partyMembers.find(
                    partyMember => partyMember.memberNo === member.memberNumber
                );
            }
            if (z + 1 === newPartyNumber) {
                partyToMove = party;
            }
            if (partyToMove && partyMemberToMove) {
                const duplicatePartyMember = partyToMove.partyMembers.find(
                    partyMember => partyMember.userId === partyMemberToMove?.userId
                );
                if (duplicatePartyMember) return eventId;
                partyToMove.partyMembers.sort((a, b) => a.memberNo - b.memberNo);
                let memberNo = 1;
                for (const partyMember of partyToMove.partyMembers) {
                    if (partyMember.memberNo !== memberNo) break;
                    memberNo++;
                }
                await prismaClient.partyMember.update({
                    where: {
                        uid: partyMemberToMove.uid
                    },
                    data: {
                        partyId: partyToMove.id,
                        memberNo
                    }
                });
                const event = await prismaClient.event.findFirst({
                    where: {
                        id: eventId
                    }
                });
                if (event) {
                    const message = await this.getEventMessage(event);
                    if (message?.thread) {
                        await this._createLog(
                            eventId,
                            message.thread,
                            `<@${actionUserId}> hat [<@${partyMemberToMove.userId}> Group #${member.partyNumber} Member #${member.memberNumber}] nach Group #${newPartyNumber} geschoben`
                        );
                    }
                }
                break;
            }
        }
        return eventId;
    }

    private async _renameEvent(
        eventId: number,
        newEventName: string,
        actionUserId: string
    ): Promise<number> {
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId
            }
        });
        if (event) {
            await prismaClient.event.update({
                where: {
                    id: event.id
                },
                data: {
                    name: newEventName
                }
            });
            const eventMsg = await this.getEventMessage(event);
            const thread = eventMsg?.thread;
            if (thread) {
                await thread.setName(newEventName);
                await this._createLog(
                    eventId,
                    thread,
                    `<@${actionUserId}> hat das Event umbenannt`
                );
            }
        }
        return eventId;
    }

    private async _updateEvents(): Promise<void> {
        if (this._isRunning) {
            this._runAgain = this._isRunning;
            return;
        }
        this._isRunning = true;
        let isRerun = false;
        do {
            isRerun = this._runAgain;
            let actionData: typeof this._actionQueue[number] | undefined;
            while ((actionData = this._actionQueue.shift())) {
                try {
                    let eventId: number | undefined;
                    const { uid, data } = actionData;
                    switch (data.type) {
                        case 'ADD_MEMBER': {
                            eventId = await this._addMember(
                                data.eventId,
                                data.classIcon,
                                data.userId,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'CREATE_EVENT': {
                            eventId = await this._createEvent(
                                data.creatorId,
                                data.dds,
                                data.supps,
                                data.free,
                                data.name,
                                data.channelId,
                                data.roleNames
                            );
                            break;
                        }
                        case 'REMOVE_EVENT': {
                            eventId = await this._removeEvent(data.eventId, data.actionUserId);
                            break;
                        }
                        case 'REMOVE_MEMBER_BY_PARTY_NUMBER': {
                            eventId = await this._removeMemberByPartyNumber(
                                data.eventId,
                                data.memberNumber,
                                data.partyNumber,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'REMOVE_MEMBER_BY_USER_ID': {
                            eventId = await this._removeMemberByUserId(
                                data.eventId,
                                data.charNumber,
                                data.userId,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'SWITCH_MEMBERS': {
                            eventId = await this._switchMembers(
                                data.eventId,
                                data.memberOne,
                                data.memberTwo,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'UPDATE_EVENT_DESC': {
                            eventId = await this._updateEventDesc(
                                data.eventId,
                                data.description,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'UPDATE_PARTY_DESC': {
                            eventId = await this._updateParytDesc(
                                data.eventId,
                                data.partyNumber,
                                data.description,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'MOVE_MEMBER': {
                            eventId = await this._moveMember(
                                data.eventId,
                                data.member,
                                data.newPartyNumber,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'PARTY_IS_DONE': {
                            eventId = await this._setPartyIsDone(
                                data.eventId,
                                data.partyNumber,
                                data.actionUserId
                            );
                            break;
                        }
                        case 'EVENT_IS_DONE': {
                            eventId = await this._setEventIsDone(data.eventId, data.actionUserId);
                            break;
                        }
                        case 'UPDATE_EVENT_NAME': {
                            eventId = await this._renameEvent(
                                data.eventId,
                                data.newEventName,
                                data.actionUserId
                            );
                            break;
                        }
                        default:
                            throw new Error('Not implemented');
                    }
                    this.emitActionEnd(data.type, actionData);
                    if (eventId != null) await this._updateEvent(eventId, false);
                } catch (error: any) {
                    this.emitActionEnd(actionData.data.type, { ...actionData, error });
                    logger.error(error);
                }
            }
            if (isRerun) this._runAgain = isRerun = false;
        } while (this._runAgain);
        this._isRunning = false;
    }

    private async _updateEvent(eventId: number, fetchEvent: boolean): Promise<void> {
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId
            },
            include: {
                partys: {
                    include: {
                        partyMembers: {
                            include: {
                                class: true
                            },
                            orderBy: {
                                memberNo: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                roles: true
            }
        });
        if (!event) return;

        const embed = await getEmbedMemberEvent(event, this);

        const channel = <TextChannel>this._discord.guild.channels.cache.get(event.channelId);
        if (event.messageId) {
            const message = await this.getEventMessage(event);
            if (message) {
                await message.edit({ content: null, embeds: [embed] });
                if (fetchEvent) {
                    await message.thread?.messages.fetch();
                    const role = this._discord.guild.roles.cache.find(
                        role => `event_${eventId}` === role.name
                    );
                    if (!role) {
                        await this._createEventRole(eventId);
                    }
                    for (const member of event.partys.map(party => party.partyMembers).flat()) {
                        await this._addEventRoleToUser(eventId, member.userId);
                    }
                }
            } else await this._createEventMessage(event, channel, embed);
        } else await this._createEventMessage(event, channel, embed);
    }

    private async _createEventMessage(
        event: Event & {
            roles: EventRole[];
            partys: (Party & {
                partyMembers: (PartyMember & {
                    class: Class;
                })[];
            })[];
        },
        channel: TextChannel,
        embed: MessageEmbed
    ): Promise<void> {
        const newMessage = await channel.send({ embeds: [embed] });
        await prismaClient.event.update({
            where: {
                id: event.id
            },
            data: {
                messageId: newMessage.id
            }
        });
        const thread = await newMessage.startThread({
            name: event.name,
            autoArchiveDuration: 'MAX'
        });
        const newThreadMessage = await thread.send(`E-ID:\t${event.id}`);
        let threadMsg = '';
        for (const role of event.roles) {
            threadMsg += `<@&${role.id}> `;
        }
        if (threadMsg) thread.send(threadMsg);
        await this._setReactions(newMessage, 'classes');
        await this._setReactions(newThreadMessage, 'classes');
        const eventLogs = await prismaClient.eventLog.findMany({
            where: {
                eventId: event.id
            }
        });
        for (const eventLog of eventLogs) {
            await thread.send(eventLog.message);
        }
    }

    private async _getClassFromIcon(classIcon: string): Promise<Class> {
        const laClass = await prismaClient.class.findUnique({
            where: {
                icon: classIcon
            }
        });
        if (laClass == null) throw new Error('Not found');
        return laClass;
    }

    private async _getEventFromId(eventId: number): Promise<
        Event & {
            partys: (Party & {
                partyMembers: (PartyMember & {
                    class: Class;
                })[];
            })[];
        }
    > {
        const event = await prismaClient.event.findFirst({
            where: {
                id: eventId,
                isDone: false
            },
            include: {
                partys: {
                    include: {
                        partyMembers: {
                            include: {
                                class: true
                            }
                        }
                    }
                }
            }
        });
        if (event == null) throw new Error('Not found');
        return event;
    }

    private _getRoleCounts(event: Event, laClass: Class): number {
        switch (laClass.role) {
            case Role.DD: {
                return event.dds + event.free;
            }
            case Role.SUPP: {
                return event.supps + event.free;
            }
        }
    }

    private async _createParty(eventId: number): Promise<Party> {
        return prismaClient.party.create({
            data: {
                eventId
            }
        });
    }

    private async _addMemberToParty(
        party: Party & { partyMembers: PartyMember[] },
        laClass: Class,
        charNumber: number,
        userId: string
    ): Promise<void> {
        party.partyMembers.sort((a, b) => a.memberNo - b.memberNo);
        let memberNo = 1;
        for (const partyMember of party.partyMembers) {
            if (partyMember.memberNo !== memberNo) break;
            memberNo++;
        }

        await prismaClient.partyMember.create({
            data: {
                charNo: charNumber,
                memberNo,
                userId,
                classUid: laClass.uid,
                partyId: party.id
            }
        });
    }

    private async _getPartyByNumber(
        eventId: number,
        partyNumber: number,
        includeParyMember: false
    ): Promise<Party | undefined>;
    private async _getPartyByNumber(
        eventId: number,
        partyNumber: number,
        includeParyMember: true
    ): Promise<(Party & { partyMembers: PartyMember[] }) | undefined>;
    private async _getPartyByNumber(
        eventId: number,
        partyNumber: number,
        includeParyMember: boolean
    ): Promise<Party | undefined> {
        const partys = await prismaClient.party.findMany({
            where: {
                eventId
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                partyMembers: includeParyMember
            },
            take: 1,
            skip: partyNumber - 1
        });
        return partys[0];
    }

    private _iconToNumber(emoji: Emoji): number | null {
        const hex = Buffer.from(emoji.name || '').toString('hex');
        switch (hex) {
            case NUMERIC_EMOTES.one.hex:
                return 1;
            case NUMERIC_EMOTES.two.hex:
                return 2;
            case NUMERIC_EMOTES.three.hex:
                return 3;
            case NUMERIC_EMOTES.four.hex:
                return 4;
            case NUMERIC_EMOTES.five.hex:
                return 5;
            case NUMERIC_EMOTES.six.hex:
                return 6;
            default:
                return null;
        }
    }

    private async _fetchAllMessages(): Promise<void> {
        const channelIds = await prismaClient.event.findMany({
            distinct: 'channelId',
            select: {
                channelId: true
            }
        });
        for (const event of channelIds) {
            const channels = await this._discord.guild.channels.fetch();
            const channel = <TextChannel>channels.get(event.channelId);
            if (channel) await channel.messages.fetch();
        }
    }

    private async _setReactions(message: Message, type: 'classes'): Promise<void>;
    private async _setReactions(message: Message, type: 'numbers', count: number): Promise<void>;
    private async _setReactions(
        message: Message,
        type: 'classes' | 'numbers',
        count?: number
    ): Promise<void> {
        if (type === 'classes') {
            const classes = await prismaClient.class.findMany();
            const reactPromise = Promise.all([
                ...classes.map(laClass => {
                    const customEmoji = this._customEmojiFactory.fromName(
                        <TCustomEmojiName>laClass.icon
                    );
                    customEmoji ? message.react(customEmoji.id) : undefined;
                }),
                message.react('🚫')
            ]);
            await reactPromise;
        } else {
            const reactPromise = Promise.all(
                Object.values(NUMERIC_EMOTES)
                    .slice(0, count)
                    .map(val => message.react(val.unicode))
            );
            await reactPromise;
        }
    }

    private _getEventIdFromMessage(message: Message<boolean> | PartialMessage): number | null {
        let regResult = message.content?.match(this._eventIdReg);
        if (!regResult) {
            regResult = message.embeds[0]?.description?.match(this._eventIdReg) || null;
        }
        const eventId = Number(regResult?.groups?.id);
        return eventId || null;
    }

    private async _createEventRole(eventId: number): Promise<void> {
        await this._discord.guild.roles.create({
            name: `event_${eventId}`
        });
    }

    private async _removeEventRole(eventId: number): Promise<void> {
        const role = this._discord.guild.roles.cache.find(role => role.name === `event_${eventId}`);
        if (role) await role.delete();
    }

    private async _addEventRoleToUser(eventId: number, userId: string): Promise<void> {
        const role = this._discord.guild.roles.cache.find(role => role.name === `event_${eventId}`);
        if (role) {
            const user = this._discord.guild.members.cache.get(userId);
            await user?.roles.add(role);
        }
    }

    private async _removeEventRoleFromUser(eventId: number, userId: string): Promise<void> {
        const role = this._discord.guild.roles.cache.find(role => role.name === `event_${eventId}`);
        if (role) await this._discord.guild.members.cache.get(userId)?.roles.remove(role);
    }

    private async _createLog(
        eventId: number,
        thread: ThreadChannel,
        message: string
    ): Promise<void> {
        await prismaClient.eventLog.create({
            data: {
                message,
                eventId
            }
        });
        await thread.send(message);
    }

    private _isInitCheck(): void {
        if (!this._isInit) throw new Error('MemberEventFactory not initialized');
    }
    //#endregion
}
