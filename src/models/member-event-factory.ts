import { logger } from '@bits_devel/logger';
import { Class, Event, Party, PartyMember, Role } from '@prisma/client';
import { path as rootPath } from 'app-root-path';
import { TextChannel } from 'discord.js';
import EventEmitter from 'events';
import path from 'path';
import { v4 } from 'uuid';
import { prismaClient } from '../db/prisma-client';
import { Discord } from '../discord/discord.model';

export const NUMERIC_EMOTES = {
    one: {
        unicode: '1️⃣',
        hex: '31efb88fe283a3'
    },
    two: {
        unicode: '2️⃣',
        hex: '32efb88fe283a3'
    },
    three: {
        unicode: '3️⃣',
        hex: '33efb88fe283a3'
    },
    four: {
        unicode: '4️⃣',
        hex: '34efb88fe283a3'
    },
    five: {
        unicode: '5️⃣',
        hex: '35efb88fe283a3'
    },
    six: {
        unicode: '6️⃣',
        hex: '36efb88fe283a3'
    }
};

export class MemberEventFactory extends EventEmitter {
    private _runAgain: boolean;
    private _isRunning: boolean;
    private _actionQueue: Array<{
        uid: string;
        data:
            | TCreateEvent
            | TRemoveEvent
            | TUpdateEventDesc
            | TUpdateParytDesc
            | TAddMember
            | TRemoveMemberByUserId
            | TRemoveMemberByPartyNumber
            | TSwitchMembers;
    }>;
    private readonly _eventIdReg: RegExp;
    private readonly _joinEventReg: RegExp;
    private readonly _discord: Discord;

    constructor(discord: Discord) {
        super();
        this._isRunning = false;
        this._eventIdReg = new RegExp(/E-ID:( +|\t)(?<id>[0-9]+)/);
        this._joinEventReg = new RegExp(/E-ID:( +|\t)(?<id>1)\nChar-Nummer:(.+|\t)(?<char>[0-9]+)/);
        this._actionQueue = new Array<{
            uid: string;
            data:
                | TCreateEvent
                | TRemoveEvent
                | TUpdateEventDesc
                | TUpdateParytDesc
                | TAddMember
                | TRemoveMemberByUserId
                | TRemoveMemberByPartyNumber
                | TSwitchMembers;
        }>();
        this._discord = discord;
        this.on('ACTION', async data => {
            try {
                this._actionQueue.push(data);
                await this._updateEvents();
            } catch (error: any) {
                logger.error(error);
            }
        });
    }

    public on<ACTION_DATA extends typeof this._actionQueue[number]['data']>(
        eventName: 'ACTION',
        cb: (data: { data: ACTION_DATA; uid: string }) => void
    ): this {
        return super.on(eventName, cb);
    }

    public emit<ACTION_DATA extends typeof this._actionQueue[number]['data']>(
        eventName: 'ACTION',
        data: { data: ACTION_DATA; uid: string }
    ): boolean {
        return super.emit(eventName, data);
    }

    public async action<ACTION_DATA extends typeof this._actionQueue[number]['data']>(
        actionData: ACTION_DATA
    ): Promise<void> {
        const currUid = v4();
        this.emit('ACTION', { data: actionData, uid: currUid });
        return new Promise<void>((res, rej) => {
            const cb = (uid: string, data: ACTION_DATA, error?: Error) => {
                if (uid === currUid) {
                    this.removeListener(actionData.type, cb);
                    if (error) rej();
                    else res();
                }
            };
            this.onActionEnd(actionData.type, cb);
        });
    }

    public emitActionEnd<ACTION_DATA extends typeof this._actionQueue[number]['data']>(
        action: ACTION_DATA['type'],
        data: { uid: string; data: ACTION_DATA; error?: Error }
    ): boolean {
        return super.emit(action, data);
    }

    public onActionEnd<ACTION_DATA extends typeof this._actionQueue[number]['data']>(
        action: ACTION_DATA['type'],
        cb: (uid: string, data: ACTION_DATA, error?: Error) => void
    ): this {
        return super.on(action, cb);
    }

    public async init(): Promise<void> {
        await this._initClassIcons();
        await this._fetchAllMessages();
        this._discord.bot.on('messageReactionAdd', async (reaction, user) => {
            try {
                if (user.id === this._discord.bot.user?.id) return;
                if (reaction.message.guildId && reaction.emoji.name) {
                    const iconHex = Buffer.from(reaction.emoji.name).toString('hex');
                    const charNumber = this._iconToNumber(iconHex);
                    if (charNumber != null) {
                        const regResult = reaction.message.content?.match(this._eventIdReg);
                        if (regResult?.groups?.id) {
                            const event = await this._getEventFromId(Number(regResult.groups.id));
                            const newMessage = await user.send(
                                `${event.name}\nE-ID:\t${
                                    event.id
                                }\nChar-Nummer:\t${this._iconToNumber(
                                    iconHex
                                )}\nBitte reagieren mit der Klasse, welche hinzugefügt werden soll.`
                            );
                            const classes = await prismaClient.class.findMany();
                            const reactPromise = Promise.all(
                                classes.map(laClass =>
                                    laClass.iconId ? newMessage.react(laClass.iconId) : undefined
                                )
                            );
                            await reactPromise;
                        }
                    }
                } else if (reaction.emoji.name) {
                    const regResult = reaction.message.content?.match(this._joinEventReg);
                    if (regResult?.groups) {
                        const { id: eventId, char: charNumber } = regResult.groups;
                        await this._addMember(
                            Number(eventId),
                            reaction.emoji.name,
                            Number(charNumber),
                            user.id
                        );
                    }
                }
            } catch (e) {
                logger.error(e);
            } finally {
                if (user.id !== this._discord.bot.user?.id && !reaction.message.guildId)
                    await reaction.message.delete();
            }
        });
        this._discord.bot.on('messageReactionRemove', async (reaction, user) => {
            try {
                if (user.id === this._discord.bot.user?.id) return;
                const charNumber = this._iconToNumber(
                    Buffer.from(reaction.emoji?.name || '').toString('hex')
                );
                if (charNumber != null) {
                    const regResult = reaction.message.content?.match(this._eventIdReg);
                    if (regResult) {
                        await user.send('Test remove');
                    }
                }
            } catch (e) {
                logger.error(e);
            }
        });
        await this.updateAllEvents();
    }

    public async updateAllEvents(): Promise<void> {
        const events = await prismaClient.event.findMany({});
        for (const event of events) {
            await this._updateEvent(event.id);
        }
    }

    private async _createEvent(
        creatorId: string,
        dds: number,
        supps: number,
        free: number,
        name: string,
        channelId: string
    ): Promise<number> {
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
                }
            }
        });
        return event.id;
    }

    private async _removeEvent(eventId: number): Promise<number> {
        const event = await prismaClient.event.delete({
            where: {
                id: eventId
            }
        });
        const channel = <TextChannel>this._discord.guild.channels.cache.get(event.channelId);
        if (event?.messageId) {
            const message = channel.messages.cache.get(event.messageId);
            await message?.delete();
        }
        return eventId;
    }

    private async _updateEventDesc(eventId: number, description: string): Promise<number> {
        await prismaClient.event.update({
            where: {
                id: eventId
            },
            data: {
                description
            }
        });
        return eventId;
    }

    private async _updateParytDesc(
        eventId: number,
        partyNumber: number,
        description: string
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
        return eventId;
    }

    private async _addMember(
        eventId: number,
        classIcon: string,
        charNumber: number,
        userId: string
    ): Promise<number> {
        const event = await this._getEventFromId(eventId);
        const laClass = await this._getClassFromIcon(classIcon);
        const maxMembers = event.dds + event.free + event.supps;
        const maxRoleCount = this._getRoleCounts(event, laClass);
        if (maxRoleCount < 1) return eventId;
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
                !isUserInParty &&
                party.partyMembers.length < maxMembers &&
                currRoleCount < maxRoleCount
            ) {
                await this._addMemberToParty(party, laClass, charNumber, userId);
                isAdded = true;
                break;
            }
        }
        if (!isAdded) {
            const newParty = await this._createParty(eventId);
            await this._addMemberToParty(
                { ...newParty, partyMembers: new Array<PartyMember>() },
                laClass,
                charNumber,
                userId
            );
        }
        return eventId;
    }

    private async _removeMemberByUserId(
        eventId: number,
        charNumber: number,
        userId: string
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
        return eventId;
    }

    private async _removeMemberByPartyNumber(
        eventId: number,
        memberNumber: number,
        partyNumber: number
    ): Promise<number> {
        const party = await this._getPartyByNumber(eventId, partyNumber, true);
        const partyMember = party?.partyMembers.find(member => member.memberNo === memberNumber);
        if (partyMember) {
            await prismaClient.partyMember.delete({
                where: {
                    uid: partyMember.uid
                }
            });
        }
        return eventId;
    }

    private async _switchMembers(
        eventId: number,
        memberOne: { memberNumber: number; partyNumber: number },
        memberTwo: { memberNumber: number; partyNumber: number }
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
        for (let z = 0; z < partys.length; z++) {
            const party = partys[z];
            if (z + 1 === memberOne.partyNumber) {
                partyMemberOne = party.partyMembers.find(
                    member => member.memberNo === memberOne.memberNumber
                );
            }
            if (z + 1 === memberTwo.partyNumber) {
                partyMemberTwo = party.partyMembers.find(
                    member => member.memberNo === memberTwo.memberNumber
                );
            }
            if (partyMemberOne && partyMemberTwo) {
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

                break;
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
        do {
            let actionData: typeof this._actionQueue[number] | undefined;
            while ((actionData = this._actionQueue.shift())) {
                try {
                    let eventId: number | undefined;
                    const { uid, data } = actionData;
                    switch (data.type) {
                        case EMemberEvent.ADD_MEMBER: {
                            eventId = await this._addMember(
                                data.eventId,
                                data.classIcon,
                                data.charNumber,
                                data.userId
                            );
                            break;
                        }
                        case EMemberEvent.CREATE_EVENT: {
                            eventId = await this._createEvent(
                                data.creatorId,
                                data.dds,
                                data.supps,
                                data.free,
                                data.name,
                                data.channelId
                            );
                            break;
                        }
                        case EMemberEvent.REMOVE_EVENT: {
                            eventId = await this._removeEvent(data.eventId);
                            break;
                        }
                        case EMemberEvent.REMOVE_MEMBER_BY_PARTY_NUMBER: {
                            eventId = await this._removeMemberByPartyNumber(
                                data.eventId,
                                data.memberNumber,
                                data.partyNumber
                            );
                            break;
                        }
                        case EMemberEvent.REMOVE_MEMBER_BY_USER_ID: {
                            eventId = await this._removeMemberByUserId(
                                data.eventId,
                                data.charNumber,
                                data.userId
                            );
                            break;
                        }
                        case EMemberEvent.SWITCH_MEMBERS: {
                            eventId = await this._switchMembers(
                                data.eventId,
                                data.memberOne,
                                data.memberTwo
                            );
                            break;
                        }
                        case EMemberEvent.UPDATE_EVENT_DESC: {
                            eventId = await this._updateEventDesc(data.eventId, data.description);
                            break;
                        }
                        case EMemberEvent.UPDATE_PARTY_DESC: {
                            eventId = await this._updateParytDesc(
                                data.eventId,
                                data.partyNumber,
                                data.description
                            );
                            break;
                        }
                        default:
                            throw new Error('Not implemented');
                    }
                    this.emitActionEnd(data.type, actionData);
                    if (eventId != null) await this._updateEvent(eventId);
                } catch (error: any) {
                    this.emitActionEnd(actionData.data.type, { ...actionData, error });
                }
            }
        } while (this._runAgain);
        this._isRunning = false;
    }

    private async _updateEvent(eventId: number): Promise<void> {
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
                }
            }
        });
        if (!event) return;
        let msg = `${event.name}\nE-ID:\t${event.id}`;
        for (let partyIndex = 1; partyIndex <= event.partys.length; partyIndex++) {
            const party = event.partys[partyIndex - 1];
            msg += `\nGroup ${partyIndex}:`;
            for (let memberIndex = 1; memberIndex <= party.partyMembers.length; memberIndex++) {
                const member = party.partyMembers[memberIndex - 1];
                msg += `\n\t${member.memberNo} <:${member.class.icon}:${member.class.iconId}> <@${member.userId}>`;
            }
        }
        const channel = <TextChannel>this._discord.guild.channels.cache.get(event.channelId);
        if (event.messageId) {
            const message = channel.messages.cache.get(event.messageId);
            if (message) await message.edit(msg);
            else {
                const newMessage = await channel.send(msg);
                await prismaClient.event.update({
                    where: {
                        id: eventId
                    },
                    data: {
                        messageId: newMessage.id
                    }
                });
                for (const emote of Object.values(NUMERIC_EMOTES)) {
                    await newMessage.react(emote.unicode);
                }
            }
        } else {
            const newMessage = await channel.send(msg);
            await prismaClient.event.update({
                where: {
                    id: eventId
                },
                data: {
                    messageId: newMessage.id
                }
            });
            for (const emote of Object.values(NUMERIC_EMOTES)) {
                await newMessage.react(emote.unicode);
            }
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
                id: eventId
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

    private _iconToNumber(reactCharNumberIcon: string): number | null {
        switch (reactCharNumberIcon) {
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

    private async _initClassIcons(): Promise<void> {
        const emojis = await this._discord.guild.emojis.fetch();
        const classes = await prismaClient.class.findMany();
        for (const laClass of classes) {
            const name = laClass.icon.toLocaleLowerCase();
            let emoji = emojis.find(emoji => emoji.name === name);
            if (!emoji) {
                emoji = await this._discord.guild.emojis.create(
                    path.resolve(
                        rootPath,
                        'assets',
                        'images',
                        'class-icons',
                        `${laClass.name.toLocaleLowerCase()}.png`
                    ),
                    name
                );
            }
            if (emoji.id !== laClass.iconId) {
                await prismaClient.class.update({
                    where: {
                        uid: laClass.uid
                    },
                    data: {
                        iconId: emoji.id
                    }
                });
            }
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
}

export enum EMemberEvent {
    CREATE_EVENT = 'CREATE_EVENT',
    REMOVE_EVENT = 'REMOVE_EVENT',
    UPDATE_EVENT_DESC = 'UPDATE_EVENT_DESC',
    UPDATE_PARTY_DESC = 'UPDATE_PARTY_DESC',
    ADD_MEMBER = 'ADD_MEMBER',
    REMOVE_MEMBER_BY_USER_ID = 'REMOVE_MEMBER_BY_USER_ID',
    REMOVE_MEMBER_BY_PARTY_NUMBER = 'REMOVE_MEMBER_BY_PARTY_NUMBER',
    SWITCH_MEMBERS = 'SWITCH_MEMBERS'
}

export type TCreateEvent = {
    type: EMemberEvent.CREATE_EVENT;
    creatorId: string;
    dds: number;
    supps: number;
    free: number;
    name: string;
    channelId: string;
};
export type TRemoveEvent = {
    type: EMemberEvent.REMOVE_EVENT;
    eventId: number;
};
export type TUpdateEventDesc = {
    type: EMemberEvent.UPDATE_EVENT_DESC;
    eventId: number;
    description: string;
};
export type TUpdateParytDesc = {
    type: EMemberEvent.UPDATE_PARTY_DESC;
    eventId: number;
    partyNumber: number;
    description: string;
};
export type TAddMember = {
    type: EMemberEvent.ADD_MEMBER;
    eventId: number;
    classIcon: string;
    charNumber: number;
    userId: string;
};
export type TRemoveMemberByUserId = {
    type: EMemberEvent.REMOVE_MEMBER_BY_USER_ID;
    eventId: number;
    charNumber: number;
    userId: string;
};
export type TRemoveMemberByPartyNumber = {
    type: EMemberEvent.REMOVE_MEMBER_BY_PARTY_NUMBER;
    eventId: number;
    memberNumber: number;
    partyNumber: number;
};
export type TSwitchMembers = {
    type: EMemberEvent.SWITCH_MEMBERS;
    eventId: number;
    memberOne: { memberNumber: number; partyNumber: number };
    memberTwo: { memberNumber: number; partyNumber: number };
};
