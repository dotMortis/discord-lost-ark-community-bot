import { logger } from '@bits_devel/logger';
import { EmbedBuilder } from '@discordjs/builders';
import { BaseClass, Class, Event, LogMode, Party, PartyMember, Role } from '@prisma/client';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Emoji,
    Events,
    Interaction,
    Message,
    PartialMessage,
    TextChannel,
    ThreadAutoArchiveDuration
} from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord } from '../../discord/discord.model';
import { getEmbedMemberEvent } from '../../discord/embeds/member-event.embed';
import { CustomEmojiFactory } from '../custom-emoji/custom-emoji-factory.model';
import { TCustomEmojiName } from '../custom-emoji/custom-emoji.collection';
import { NUMERIC_EMOTES } from '../numeric-emots.collection';
import { ActionQueue, TActionQueueData } from './action-queue';
import { BTN_EVENT_ACTION, TActionresult, TMemberEvents } from './member-event.types';

export class MemberEventFactory extends ActionQueue<TMemberEvents> {
    //#region member variables
    private readonly _eventIdReg: RegExp;
    private readonly _discord: Discord;
    private readonly _customEmojiFactory: CustomEmojiFactory;
    //#endregion

    //#region constructor
    constructor(discord: Discord) {
        super();
        this._eventIdReg = new RegExp(/E-ID:( +|\t)(?<id>[0-9]+)/);
        this._discord = discord;
        this._customEmojiFactory = discord.customEmojiFactory;
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
                            await this.action<'ADD_MEMBER'>(
                                {
                                    classIcon: reaction.emoji.name,
                                    eventId: event.id,
                                    type: 'ADD_MEMBER',
                                    userId: user.id,
                                    actionUserId: user.id
                                },
                                eventId.toString()
                            );
                        }
                    } else if (Buffer.from(reaction.emoji.name).toString('hex') === 'f09f9aab') {
                        const eventId = this._getEventIdFromMessage(reaction.message);
                        if (eventId) {
                            const event = await this._getEventFromId(eventId);
                            const spareParty = await this._getSparePartyFromEventId(eventId);
                            relevatnReaction = true;
                            let msg = `${event.name}\nE-ID:\t${event.id}\nBitte reagieren mit der Nummer des zu löschenden Characters.`;
                            const partyMembersOfUser = new Array<
                                PartyMember & { class: Class; partyNumber: number | string }
                            >();
                            for (
                                let partyIndex = 0;
                                partyIndex < event.partys.length;
                                partyIndex++
                            ) {
                                const party = event.partys[partyIndex];
                                for (const partyMember of party.partyMembers) {
                                    if (partyMember.userId === user.id)
                                        partyMembersOfUser.push({
                                            ...partyMember,
                                            partyNumber: partyIndex + 1
                                        });
                                }
                            }
                            for (const partyMember of spareParty.partyMembers) {
                                if (partyMember.userId === user.id)
                                    partyMembersOfUser.push({
                                        ...partyMember,
                                        partyNumber: 'Ersatzbank'
                                    });
                            }
                            if (!partyMembersOfUser.length) return;
                            partyMembersOfUser.sort((a, b) => a.charNo - b.charNo);
                            partyMembersOfUser.forEach(partyMember => {
                                msg += `\n#${partyMember.charNo} ${this.toIconString(
                                    partyMember.class
                                )} - Group ${partyMember.partyNumber}`;
                            });
                            const newMessage = await user.send(msg);
                            //await this._setReactions(newMessage, 'numbers', 6);
                        }
                    }
                } else if (reaction.emoji) {
                    const eventId = this._getEventIdFromMessage(reaction.message);
                    const charNumber = this._iconToNumber(reaction.emoji);
                    if (eventId && charNumber != null) {
                        const event = await this._getEventFromId(eventId);
                        relevatnReaction = true;
                        await this.action<'REMOVE_MEMBER_BY_USER_ID'>(
                            {
                                charNumber,
                                eventId: event.id,
                                type: 'REMOVE_MEMBER_BY_USER_ID',
                                userId: user.id,
                                actionUserId: user.id
                            },
                            eventId.toString()
                        );
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
        this._discord.bot.on(Events.InteractionCreate, async (i: Interaction) => {
            if (i.isButton() && i.customId.startsWith('E-ID')) {
                const [eventIdStr, action, value] = i.customId.split(':');

                if (action === BTN_EVENT_ACTION.APPLY) {
                    const classes = await prismaClient.class.findMany({
                        select: {
                            base: true
                        },
                        distinct: 'base'
                    });
                    const row = new ActionRowBuilder<ButtonBuilder>();
                    for (const baseClass of classes) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setLabel(baseClass.base)
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId(
                                    eventIdStr + ':' + BTN_EVENT_ACTION.CLASS + ':' + baseClass.base
                                )
                        );
                    }
                    await i.reply({
                        content: 'Wähle deine Basisklasse!',
                        components: [row],
                        ephemeral: true
                    });
                } else if (action === BTN_EVENT_ACTION.REMOVE) {
                    if (!value) {
                        const eventId = Number(eventIdStr.substring(4));
                        const event = await this._getEventFromId(eventId);
                        const spareParty = await this._getSparePartyFromEventId(eventId);
                        const partyMembersOfUser = new Array<
                            PartyMember & { class: Class; partyNumber: number | string }
                        >();
                        for (let partyIndex = 0; partyIndex < event.partys.length; partyIndex++) {
                            const party = event.partys[partyIndex];
                            for (const partyMember of party.partyMembers) {
                                if (partyMember.userId === i.user.id)
                                    partyMembersOfUser.push({
                                        ...partyMember,
                                        partyNumber: partyIndex + 1
                                    });
                            }
                        }
                        for (const partyMember of spareParty.partyMembers) {
                            if (partyMember.userId === i.user.id)
                                partyMembersOfUser.push({
                                    ...partyMember,
                                    partyNumber: 'Ersatzbank'
                                });
                        }
                        if (!partyMembersOfUser.length) return;
                        partyMembersOfUser.sort((a, b) => a.charNo - b.charNo);
                        const rows = new Array<ActionRowBuilder<ButtonBuilder>>();
                        let count = 1;
                        let ab = new ActionRowBuilder<ButtonBuilder>();
                        for (const partyMember of partyMembersOfUser) {
                            ab.addComponents(
                                new ButtonBuilder()
                                    .setLabel(
                                        '#' + partyMember.charNo + ' - ' + partyMember.class.name
                                    )
                                    .setStyle(ButtonStyle.Primary)
                                    .setCustomId(
                                        eventIdStr +
                                            ':' +
                                            BTN_EVENT_ACTION.REMOVE +
                                            ':' +
                                            partyMember.charNo
                                    )
                            );
                            if (count === 5) {
                                rows.push(ab);
                                ab = new ActionRowBuilder<ButtonBuilder>();
                                count = 1;
                            } else {
                                count++;
                            }
                        }
                        if (count != 1) rows.push(ab);
                        await i.reply({
                            content: 'Welchen Character möchtest du entfernen?',
                            ephemeral: true,
                            components: rows
                        });
                    } else {
                        const eventId = Number(eventIdStr.substring(4));
                        await this.action<'REMOVE_MEMBER_BY_USER_ID'>(
                            {
                                charNumber: Number(value),
                                eventId,
                                type: 'REMOVE_MEMBER_BY_USER_ID',
                                userId: i.user.id,
                                actionUserId: i.user.id
                            },
                            eventId.toString()
                        );
                        await i.update({ content: 'Done!', components: [] });
                    }
                } else if (action === BTN_EVENT_ACTION.CLASS) {
                    const subClasses = await prismaClient.class.findMany({
                        where: {
                            base: <BaseClass>value
                        }
                    });
                    const rows = new Array<ActionRowBuilder<ButtonBuilder>>();
                    let count = 1;
                    let ab = new ActionRowBuilder<ButtonBuilder>();
                    for (const subClass of subClasses) {
                        ab.addComponents(
                            new ButtonBuilder()
                                .setLabel(subClass.name)
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId(
                                    eventIdStr +
                                        ':' +
                                        BTN_EVENT_ACTION.SUBCLASS +
                                        ':' +
                                        subClass.name
                                )
                        );
                        if (count === 5) {
                            rows.push(ab);
                            ab = new ActionRowBuilder<ButtonBuilder>();
                            count = 1;
                        } else {
                            count++;
                        }
                    }
                    if (count != 1) rows.push(ab);
                    await i.update({ content: 'Wähle deine Klasse!', components: rows });
                } else if (action === BTN_EVENT_ACTION.SUBCLASS) {
                    const subClass = await prismaClient.class.findUnique({
                        where: {
                            name: value
                        }
                    });
                    if (subClass) {
                        await this.action<'ADD_MEMBER'>(
                            {
                                classIcon: subClass.icon,
                                eventId: Number(eventIdStr.substring(4)),
                                type: 'ADD_MEMBER',
                                userId: i.user.id,
                                actionUserId: i.user.id
                            },
                            eventIdStr.toString()
                        );
                    }
                    await i.update({ content: 'Done!', components: [] });
                }
            }
        });
        this.isInit();
        await this.updateAllEvents();
    }

    public async updateAllEvents(): Promise<void> {
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
        const currChannel = <TextChannel>this._discord.guild.channels.cache.get(event.channelId);
        const message = currChannel?.messages.cache.get(event.messageId || '');
        await message?.thread?.fetch();
        return message;
    }

    public async setLogMode(eventId: number, mode: LogMode, actionUserId: string): Promise<void> {
        const event = await prismaClient.event.findFirstOrThrow({
            where: {
                id: eventId
            }
        });
        await prismaClient.event.update({
            where: {
                id: eventId
            },
            data: {
                logMode: mode
            }
        });
        event.logMode = mode;
        await this._createLog(`<@${actionUserId}> hat den Logmodus auf [${mode}] geändert`, event);
    }

    async queueAction(actionData: TActionQueueData<TMemberEvents>): Promise<void> {
        let actionResult: TActionresult | undefined;
        const { uid, data } = actionData;
        switch (data.type) {
            case 'ADD_MEMBER': {
                actionResult = await this._addMember(
                    data.eventId,
                    data.classIcon,
                    data.userId,
                    data.actionUserId
                );
                break;
            }
            case 'CREATE_EVENT': {
                actionResult = await this._createEvent(
                    data.creatorId,
                    data.dds,
                    data.supps,
                    data.free,
                    data.name,
                    data.channelId
                );
                break;
            }
            case 'REMOVE_EVENT': {
                actionResult = await this._removeEvent(data.eventId, data.actionUserId);
                break;
            }
            case 'REMOVE_MEMBER_BY_PARTY_NUMBER': {
                actionResult = await this._removeMemberByPartyNumber(
                    data.eventId,
                    data.memberNumber,
                    data.partyNumber,
                    data.actionUserId
                );
                break;
            }
            case 'REMOVE_MEMBER_BY_USER_ID': {
                actionResult = await this._removeMemberByUserId(
                    data.eventId,
                    data.charNumber,
                    data.userId,
                    data.actionUserId
                );
                break;
            }
            case 'SWITCH_MEMBERS': {
                actionResult = await this._switchMembers(
                    data.eventId,
                    data.memberOne,
                    data.memberTwo,
                    data.actionUserId
                );
                break;
            }
            case 'UPDATE_EVENT_DESC': {
                actionResult = await this._updateEventDesc(
                    data.eventId,
                    data.description,
                    data.actionUserId
                );
                break;
            }
            case 'UPDATE_PARTY_DESC': {
                actionResult = await this._updateParytDesc(
                    data.eventId,
                    data.partyNumber,
                    data.description,
                    data.actionUserId
                );
                break;
            }
            case 'MOVE_MEMBER': {
                actionResult = await this._moveMember(
                    data.eventId,
                    data.member,
                    data.newPartyNumber,
                    data.actionUserId
                );
                break;
            }
            case 'MOVE_MEMBER_TO_SPARE': {
                actionResult = await this._moveMemberToSpareBench(
                    data.eventId,
                    data.member,
                    data.actionUserId
                );
                break;
            }
            case 'PARTY_IS_DONE': {
                actionResult = await this._setPartyIsDone(
                    data.eventId,
                    data.partyNumber,
                    data.actionUserId
                );
                break;
            }
            case 'EVENT_IS_DONE': {
                actionResult = await this._setEventIsDone(data.eventId, data.actionUserId);
                break;
            }
            case 'UPDATE_EVENT_NAME': {
                actionResult = await this._renameEvent(
                    data.eventId,
                    data.newEventName,
                    data.actionUserId
                );
                break;
            }
            default:
                throw new Error('Not implemented');
        }
        if (actionResult != null)
            await this._updateEvent(actionResult.event.id, false).catch(e => logger.error(e));
        await this._createLog(actionResult.actionLog, actionResult.event);
    }
    //#endregion

    //#region private func
    private async _createEvent(
        creatorId: string,
        dds: number,
        supps: number,
        free: number,
        name: string,
        channelId: string
    ): Promise<TActionresult> {
        const event = await prismaClient.event.create({
            data: {
                creatorId,
                dds,
                supps,
                free,
                name,
                channelId,
                partys: {
                    createMany: {
                        data: [{ isSpareBench: true }, {}]
                    }
                }
            }
        });
        await this._createEventRole(event.id);
        return { event, actionLog: null };
    }

    private async _setPartyIsDone(
        eventId: number,
        partyNumber: number,
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await this._getEventFromId(eventId);
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
        return {
            event,
            actionLog: `<@${actionUserId}> hat "Group ${partyNumber}" abgeschlossen`
        };
    }

    private async _setEventIsDone(eventId: number, actionUserId: string): Promise<TActionresult> {
        const event = await prismaClient.event.findFirstOrThrow({
            where: {
                id: eventId
            }
        });
        await prismaClient.event.update({
            where: {
                id: event.id
            },
            data: {
                isDone: !event.isDone
            }
        });
        return { event, actionLog: `<@${actionUserId}> hat das Event abgeschlossen` };
    }

    private async _removeEvent(eventId: number, actionUserId: string): Promise<TActionresult> {
        const event = await prismaClient.event.delete({
            where: {
                id: eventId
            }
        });
        if (!event) throw new Error('Event not found');
        await this._removeEventRole(event.id);
        const message = await this.getEventMessage(event);
        const thread = await message?.thread?.fetch();
        if (thread) {
            await thread?.delete();
            await message?.delete();
        }
        return { event, actionLog: `<@${actionUserId}> hat das Event gelöscht` };
    }

    private async _updateEventDesc(
        eventId: number,
        description: string,
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await prismaClient.event.findFirstOrThrow({
            where: {
                id: eventId
            }
        });
        await prismaClient.event.update({
            where: {
                id: eventId
            },
            data: {
                description
            }
        });

        return {
            event,
            actionLog: `<@${actionUserId}> hat die Event Beschreibung geändert`
        };
    }

    private async _updateParytDesc(
        eventId: number,
        partyNumber: number,
        description: string,
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await prismaClient.event.findFirstOrThrow({
            where: {
                id: eventId
            }
        });

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

        let actionLog: string | null = null;
        if (party) {
            actionLog = `<@${actionUserId}> hat die "Group ${partyNumber}" Beschreibung geändert`;
        }
        return { event, actionLog };
    }

    private async _addMember(
        eventId: number,
        classIcon: string,
        userId: string,
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await this._getEventFromId(eventId);
        const spareParty = await this._getSparePartyFromEventId(event.id);
        const laClass = await this._getClassFromIcon(classIcon);
        const maxMembers = event.dds + event.free + event.supps;
        const maxRoleCount = this._getRoleCounts(event, laClass);
        let currentUserCount = 0;
        const charNumbers = new Array<number>();
        for (const party of [...event.partys, spareParty]) {
            currentUserCount += party.partyMembers.filter(member => {
                const result = member.userId === userId;
                if (result) charNumbers.push(member.charNo);
                return result;
            }).length;
        }
        if (maxRoleCount < 1) {
            return {
                event,
                actionLog: `[ROLE NOT ALLOWED ERROR] <@${actionUserId}> hat versucht einen Character für <@${userId}> anzumelden`
            };
        } else if (currentUserCount === 6) {
            return {
                event,
                actionLog: `[MAX CHARS ERROR] <@${actionUserId}> hat versucht mehr als 6 Charactere für <@${userId}> anzumelden`
            };
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
        return {
            event,
            actionLog:
                userId === actionUserId
                    ? `<@${actionUserId}> hat Character #${newCharNumber} angemeldet`
                    : `<@${actionUserId}> hat Character #${newCharNumber} für <@${userId}> angemeldet`
        };
    }

    private async _removeMemberByUserId(
        eventId: number,
        charNumber: number,
        userId: string,
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await prismaClient.event.findFirstOrThrow({
            where: {
                id: eventId
            }
        });
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

        return {
            event,
            actionLog:
                userId === actionUserId
                    ? `<@${actionUserId}> hat Character #${charNumber} abgemeldet`
                    : `<@${actionUserId}> hat Character #${charNumber} von <@${userId}> abgemeldet`
        };
    }

    private async _removeMemberByPartyNumber(
        eventId: number,
        memberNumber: number,
        partyNumber: number | 'e',
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await prismaClient.event.findFirstOrThrow({
            where: {
                id: eventId
            }
        });
        const party =
            partyNumber === -1 || partyNumber === 'e'
                ? await this._getSparePartyFromEventId(eventId)
                : await this._getPartyByNumber(eventId, partyNumber, true);
        const partyMember = party?.partyMembers.find(member => member.memberNo === memberNumber);
        let actionLog: string | null = null;
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

            actionLog =
                partyMember.userId === actionUserId
                    ? `<@${actionUserId}> hat seinen Character #${partyMember.charNo} abgemeldet`
                    : `<@${actionUserId}> hat Character #${partyMember.charNo} von <@${partyMember.userId}> abgemeldet`;
        }
        return { event, actionLog };
    }

    private async _switchMembers(
        eventId: number,
        memberOne: { memberNumber: number; partyNumber: number },
        memberTwo: { memberNumber: number; partyNumber: number },
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await this._getEventFromId(eventId);
        const { partys } = event;
        let partyMemberOne: PartyMember | undefined;
        let partyMemberTwo: PartyMember | undefined;
        let partyOne: (Party & { partyMembers: (PartyMember & { class: Class })[] }) | null = null;
        let partyTwo: (Party & { partyMembers: (PartyMember & { class: Class })[] }) | null = null;
        let actionLog: string | null = null;
        let spareParty:
            | (Party & {
                  partyMembers: PartyMember[];
              })
            | null = null;
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
                    if (!spareParty) spareParty = await this._getSparePartyFromEventId(eventId);
                    await prismaClient.partyMember.update({
                        where: {
                            uid: duplicateMemberOne.uid
                        },
                        data: {
                            partyId: spareParty.id
                        }
                    });
                }
                const duplicateMemberTwo = partyTwo.partyMembers.find(
                    member => member.userId === partyMemberOne?.userId
                );
                if (duplicateMemberTwo && partyMemberTwo.userId !== duplicateMemberTwo.userId) {
                    if (!spareParty) spareParty = await this._getSparePartyFromEventId(eventId);
                    await prismaClient.partyMember.update({
                        where: {
                            uid: duplicateMemberTwo.uid
                        },
                        data: {
                            partyId: spareParty.id
                        }
                    });
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
                actionLog = `<@${actionUserId}> hat [<@${partyMemberOne.userId}> Group #${memberOne.partyNumber} Member #${memberOne.memberNumber}] mit [<@${partyMemberTwo.userId}> Group #${memberTwo.partyNumber} Member #${memberTwo.memberNumber}] getauscht`;
                break;
            }
        }
        return { event, actionLog };
    }

    private async _moveMemberToSpareBench(
        eventId: number,
        member: { memberNumber: number; partyNumber: number },
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await this._getEventFromId(eventId);
        const spareParty = await this._getSparePartyFromEventId(eventId);
        const oldParty = event.partys[member.partyNumber - 1];
        if (!oldParty) throw new Error('Party not found');
        const partyMember = oldParty.partyMembers.find(
            partyMember => partyMember.memberNo === member.memberNumber
        );
        if (!partyMember) throw new Error('Party member not found');
        await prismaClient.partyMember.update({
            where: {
                uid: partyMember.uid
            },
            data: {
                partyId: spareParty.id
            }
        });
        return {
            event,
            actionLog: `<@${actionUserId}> hat [<@${partyMember.userId}> Group #${member.partyNumber} Member #${member.memberNumber}] auf die Ersatzbank geschoben`
        };
    }

    private async _moveMember(
        eventId: number,
        member: { memberNumber: number; partyNumber: number | 'e' },
        newPartyNumber: number,
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await this._getEventFromId(eventId);
        const { partys } = event;
        let partyToMove: (Party & { partyMembers: PartyMember[] }) | null = null;
        let partyMemberToMove: PartyMember | undefined;
        let actionLog: string | null = null;

        if (member.partyNumber === -1 || member.partyNumber === 'e') {
            const spareParty = await this._getSparePartyFromEventId(event.id);
            partyMemberToMove = spareParty.partyMembers.find(
                spareMember => spareMember.memberNo === member.memberNumber
            );
            if (!partyMemberToMove) throw new Error('Member not found');
            partyToMove = partys[newPartyNumber - 1];
            if (!partyToMove) throw new Error('Party not found');
            const duplicatePartyMember = partyToMove.partyMembers.find(
                partyMember => partyMember.userId === partyMemberToMove?.userId
            );
            if (duplicatePartyMember) {
                await prismaClient.partyMember.update({
                    where: {
                        uid: duplicatePartyMember.uid
                    },
                    data: {
                        partyId: spareParty.id
                    }
                });
            }
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
            actionLog = `<@${actionUserId}> hat [<@${partyMemberToMove.userId}> Ersatzbank Member #${member.memberNumber}] nach Group #${newPartyNumber} geschoben`;
        } else {
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
                    if (duplicatePartyMember) {
                        const spareParty = await this._getSparePartyFromEventId(eventId);
                        await prismaClient.partyMember.update({
                            where: {
                                uid: duplicatePartyMember.uid
                            },
                            data: {
                                partyId: spareParty.id
                            }
                        });
                    }
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
                    actionLog = `<@${actionUserId}> hat [<@${partyMemberToMove.userId}> Group #${member.partyNumber} Member #${member.memberNumber}] nach Group #${newPartyNumber} geschoben`;
                    break;
                }
            }
        }
        return { event, actionLog };
    }

    private async _renameEvent(
        eventId: number,
        newEventName: string,
        actionUserId: string
    ): Promise<TActionresult> {
        const event = await prismaClient.event.findFirstOrThrow({
            where: {
                id: eventId
            }
        });
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
        }
        return { event, actionLog: `<@${actionUserId}> hat das Event umbenannt` };
    }

    private async _updateEvent(eventId: number, fetchEvent: boolean): Promise<void> {
        const event = await this._getEventFromId(eventId);
        if (!event) return;
        const spareParty = await this._getSparePartyFromEventId(event.id);
        const embed = await getEmbedMemberEvent(event, spareParty, this);

        const channel = <TextChannel>this._discord.guild.channels.cache.get(event.channelId);
        if (event.messageId) {
            const message = await this.getEventMessage(event);
            if (message) {
                await message.edit({
                    content: null,
                    embeds: [embed]
                });
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
            partys: (Party & {
                partyMembers: (PartyMember & {
                    class: Class;
                })[];
            })[];
        },
        channel: TextChannel,
        embed: EmbedBuilder
    ): Promise<void> {
        const newMessage = await channel.send({
            embeds: [embed],
            components: [this._getReactions(event.id)]
        });
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
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
        });
        await thread.send({
            content: `E-ID:\t${event.id}`,
            components: [this._getReactions(event.id)]
        });
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
        return prismaClient.event.findFirstOrThrow({
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
                    where: {
                        isSpareBench: false
                    },
                    orderBy: {
                        createdAt: 'asc'
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
                eventId,
                isSpareBench: false
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

    private async _getSparePartyFromEventId(eventId: number): Promise<
        Party & {
            partyMembers: (PartyMember & { class: Class })[];
        }
    > {
        let spareParty = await prismaClient.party.findFirst({
            where: {
                eventId,
                isSpareBench: true
            },
            include: {
                partyMembers: {
                    include: {
                        class: true
                    },
                    orderBy: {
                        memberNo: 'asc'
                    }
                }
            }
        });
        if (!spareParty) {
            spareParty = await prismaClient.party.create({
                data: {
                    isSpareBench: true,
                    eventId
                },
                include: {
                    partyMembers: {
                        include: {
                            class: true
                        },
                        orderBy: {
                            memberNo: 'asc'
                        }
                    }
                }
            });
        }
        return spareParty;
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

    private _getReactions(eventId: number): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Apply')
                .setStyle(ButtonStyle.Primary)
                .setCustomId('E-ID' + eventId + ':' + BTN_EVENT_ACTION.APPLY),
            new ButtonBuilder()
                .setLabel(`Applyn't`)
                .setStyle(ButtonStyle.Danger)
                .setCustomId('E-ID' + eventId + ':' + BTN_EVENT_ACTION.REMOVE)
        );
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

    private async _createLog(message: string | null, event: Event): Promise<void> {
        if (message) {
            await prismaClient.eventLog.create({
                data: {
                    message,
                    eventId: event.id
                }
            });
            if (event.logMode !== 'SILENT') {
                const dcMessage = await this.getEventMessage(event);
                if (event.logMode === 'NO_PING') {
                    message = this._discord.removeUserPingFromMessage(message);
                }
                await dcMessage?.thread?.send('LOG: ' + message);
            }
        }
    }
    //#endregion
}
