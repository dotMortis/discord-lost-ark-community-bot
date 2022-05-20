import { logger } from '@bits_devel/logger';
import { Class, Event, Party, PartyMember, Role } from '@prisma/client';
import { path as rootPath } from 'app-root-path';
import { TextChannel } from 'discord.js';
import EventEmitter from 'events';
import path from 'path';
import { prismaClient } from '../db/prisma-client';
import { Discord } from '../discord/discord.model';

export type TMemberEvent = 'UPDATE';

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
    private _updateEventIds: Array<number>;
    private readonly _eventIdReg: RegExp;
    private readonly _joinEventReg: RegExp;
    private readonly _discord: Discord;

    constructor(discord: Discord) {
        super();
        this._isRunning = false;
        this._eventIdReg = new RegExp(/E-ID:( +|\t)(?<id>[0-9]+)/);
        this._joinEventReg = new RegExp(/E-ID:( +|\t)(?<id>1)\nChar-Nummer:(.+|\t)(?<char>[0-9]+)/);
        this._updateEventIds = new Array<number>();
        this._discord = discord;
        this.on('UPDATE', async (eventId: number) => {
            try {
                this._updateEventIds.push(eventId);
                await this._updateEvents();
            } catch (error: any) {
                logger.error(error);
            }
        });
    }

    public emit(eventName: TMemberEvent, eventId: number): boolean {
        return super.emit(eventName, eventId);
    }

    public on(eventName: TMemberEvent, cb: (eventId: number) => void) {
        return super.on(eventName, cb);
    }

    public async init(): Promise<void> {
        await this._initClassIcons();
        await this._fetchAllMessages();
        this._discord.bot.on('messageReactionAdd', async (reaction, user) => {
            try {
                if (user.id === this._discord.bot.user.id) return;
                if (reaction.message.guildId) {
                    const iconHex = Buffer.from(reaction.emoji.name).toString('hex');
                    console.log(iconHex);
                    const charNumber = this._iconToNumber(iconHex);
                    console.log(charNumber);
                    if (charNumber != null) {
                        const regResult = reaction.message.content.match(this._eventIdReg);
                        console.log(regResult);

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
                                classes.map(laClass => newMessage.react(laClass.iconId))
                            );
                            await reactPromise;
                        }
                    }
                } else {
                    const regResult = reaction.message.content.match(this._joinEventReg);
                    if (regResult) {
                        const { id: eventId, char: charNumber } = regResult.groups;
                        await this.addMember(
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
                if (user.id !== this._discord.bot.user.id && !reaction.message.guildId)
                    await reaction.message.delete();
            }
        });
        this._discord.bot.on('messageReactionRemove', async (reaction, user) => {
            try {
                if (user.id === this._discord.bot.user.id) return;
                const charNumber = this._iconToNumber(
                    Buffer.from(reaction.emoji.name).toString('hex')
                );
                if (charNumber != null) {
                    const regResult = reaction.message.content.match(this._eventIdReg);
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

    public async createEvent(
        creatorId: string,
        dds: number,
        supps: number,
        free: number,
        name: string,
        channelId: string
    ): Promise<void> {
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
        this.emit('UPDATE', event.id);
    }

    public async removeEvent(eventId: number): Promise<void> {
        const event = await prismaClient.event.delete({
            where: {
                id: eventId
            }
        });
        const channel = <TextChannel>this._discord.guild.channels.cache.get(event.channelId);
        const message = channel.messages.cache.get(event.messageId);
        await message.delete();
    }

    public async updateEventDesc(eventId: number, description: string): Promise<void> {
        await prismaClient.event.update({
            where: {
                id: eventId
            },
            data: {
                description
            }
        });
        this.emit('UPDATE', eventId);
    }

    public async updateParytDesc(
        eventId: number,
        partyNumber: number,
        description: string
    ): Promise<void> {
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
            this.emit('UPDATE', eventId);
        }
    }

    public async addMember(
        eventId: number,
        classIcon: string,
        charNumber: number,
        userId: string
    ): Promise<void> {
        const event = await this._getEventFromId(eventId);
        const laClass = await this._getClassFromIcon(classIcon);
        const maxMembers = event.dds + event.free + event.supps;
        const maxRoleCount = this._getRoleCounts(event, laClass);
        if (maxRoleCount < 1) return;
        let isAdded = false;
        for (const party of event.partys) {
            const currRoleCount = party.partyMembers.filter(
                member => member.class.role === laClass.role
            ).length;
            const isUserInParty =
                party.partyMembers.findIndex(member => {
                    console.log(member.userId, userId);

                    return member.userId === userId;
                }) > -1;
            console.log(isUserInParty);
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
        this.emit('UPDATE', eventId);
    }

    public async removeMemberByUserId(
        eventId: number,
        charNumber: number,
        userId: string
    ): Promise<void> {
        await prismaClient.partyMember.deleteMany({
            where: {
                party: {
                    eventId
                },
                charNo: charNumber,
                userId
            }
        });
        this.emit('UPDATE', eventId);
    }

    public async removeMemberByPartyNumber(
        eventId: number,
        memberNumber: number,
        partyNumber: number
    ): Promise<void> {
        const party = await this._getPartyByNumber(eventId, partyNumber, true);
        const partyMember = party?.partyMembers.find(member => member.memberNo === memberNumber);
        if (partyMember) {
            await prismaClient.partyMember.delete({
                where: {
                    uid: partyMember.uid
                }
            });
            this.emit('UPDATE', eventId);
        }
    }

    public async switchMembers(
        eventId: number,
        memberOne: { memberNumber: number; partyNumber: number },
        memberTwo: { memberNumber: number; partyNumber: number }
    ): Promise<void> {
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
                this.emit('UPDATE', eventId);
                break;
            }
        }
    }

    public async updateAllEvents(): Promise<void> {
        const events = await prismaClient.event.findMany();
        for (const event of events) {
            this.emit('UPDATE', event.id);
        }
    }

    private async _updateEvents() {
        if (this._isRunning) {
            this._runAgain = this._isRunning;
            return;
        }
        this._isRunning = true;
        do {
            let eventId: number;
            while ((eventId = this._updateEventIds.shift())) {
                await this._updateEvent(eventId);
            }
        } while (this._runAgain);
        this._isRunning = false;
    }

    private async _updateEvent(eventId: number) {
        console.log('_updateEvent', eventId);

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
                    console.log(emote);
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
                console.log(emote);
                await newMessage.react(emote.unicode);
            }
        }
    }

    private _getClassFromIcon(classIcon: string) {
        return prismaClient.class.findUnique({
            where: {
                icon: classIcon
            }
        });
    }

    private _getEventFromId(eventId: number) {
        return prismaClient.event.findFirst({
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
        console.log({
            charNo: charNumber,
            memberNo,
            userId,
            classUid: laClass.uid,
            partyId: party.id
        });

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
