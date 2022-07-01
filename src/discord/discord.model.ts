import { logger } from '@bits_devel/logger';
import {
    Client,
    Guild,
    GuildMember,
    Message,
    MessageEmbed,
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    PermissionResolvable,
    TextChannel,
    User
} from 'discord.js';
import { staticConfig } from '../config/static-config';
import { prismaClient } from '../db/prisma-client';
import { GetConfig, SetConfig } from '../models/config.model';
import { MemberEventFactory } from '../models/member-event-factory';
import { COMMAND_COMMAND } from './deault-commands/command.command';
import { getEmbedCalendar } from './embeds/calendar.embed';

export class Discord {
    //#region Properties
    private _guildId: string;
    private readonly _prefix = '!dot';
    private _bot: Client;
    private readonly _memberEventFactory: MemberEventFactory;

    get memberEventFactory(): MemberEventFactory {
        return this._memberEventFactory;
    }

    get commandsDesc(): [string, string][] {
        const commands = new Array<[string, string]>();
        commands.push(
            ...Array.from(this.calData.commands.values())
                .map(command => command.desc)
                .flat()
        );
        commands.push(...this.reactions.map(r => r.reaction.desc).flat());
        commands.push(...this.alerts.map(r => r.alert.desc).flat());
        commands.push(...this.eventAlerts.map(r => r.eventAlert.desc).flat());
        commands.push(
            ...Array.from(this._defaultCommands.values())
                .map(command => command.desc)
                .flat()
        );
        return commands;
    }

    get memberEventCommandsDesc(): [string, string][] {
        const commands = new Array<[string, string]>();
        commands.push(
            ...Array.from(this.memberEvents.values())
                .map(command => command.desc)
                .flat()
        );
        return commands;
    }

    get bot(): Client {
        return this._bot;
    }
    get guild(): Guild {
        const guild = this._bot.guilds.cache.get(this._guildId);
        if (!guild) throw new Error('Guild not found');
        return guild;
    }

    private _calData: {
        role: '_LAB_CAL';
        commands: Map<string, TCalCommand>;
        channelId: string | undefined;
        roleId: string;
        messageId: string | undefined;
    };
    get calData() {
        return this._calData;
    }

    private _defaultCommands: Map<string, TDefaultCommand>;
    private _publicCommands: Map<string, TPublicCommand>;
    get publicCommands() {
        return {
            get: (key: string) => this._publicCommands.get(key.toLocaleLowerCase()),
            set: (key: string, value: TPublicCommand) => this._publicCommands.set(key, value),
            map: this._publicCommands
        };
    }

    private _reactions: Array<{
        channelId: string | undefined;
        messageId: string | undefined;
        roles: Map<string, string>;
        reaction: TReaction;
    }>;
    get reactions() {
        return this._reactions.slice();
    }

    private _alerts: Array<{
        channelId: string | undefined;
        role: {
            name: string;
            id: string;
        };
        alert: TAlert;
    }>;
    get alerts() {
        return this._alerts.slice();
    }

    private _eventAlerts: Array<{
        channelAlertId: string | undefined;
        channelEventId: string | undefined;
        role: {
            name: string;
            id: string;
        };
        eventAlert: TEventAlert;
    }>;
    get eventAlerts() {
        return this._eventAlerts.slice();
    }

    private _commandsChannelId: string | undefined;
    set commandsChannelId(val: string | undefined) {
        this._commandsChannelId = val;
    }
    get commandsChannelId(): string | undefined {
        return this._commandsChannelId;
    }

    private _refCleanChannelIds: string[];
    set refCleanChannelIds(val: string[]) {
        this._refCleanChannelIds = val;
    }
    get refCleanChannelIds(): string[] {
        return this._refCleanChannelIds;
    }

    private _memberEvents: Map<string, TMemberEventCommand>;
    get memberEvents(): Map<string, TMemberEventCommand> {
        return this._memberEvents;
    }
    //#endregion

    //#region constructor
    constructor() {
        this._memberEventFactory = new MemberEventFactory(this);
        this._calData = {
            commands: new Map<string, TCalCommand>(),
            channelId: '',
            role: '_LAB_CAL',
            roleId: '',
            messageId: ''
        };
        this._reactions = new Array<{
            channelId: string;
            messageId: string;
            roles: Map<string, string>;
            reaction: TReaction;
        }>();
        this._alerts = new Array<{
            channelId: string;
            role: {
                name: string;
                id: string;
            };
            alert: TAlert;
        }>();
        this._eventAlerts = new Array<{
            channelAlertId: string;
            channelEventId: string;
            role: {
                name: string;
                id: string;
            };
            eventAlert: TEventAlert;
        }>();
        this._memberEvents = new Map<string, TMemberEventCommand>();
        this._defaultCommands = new Map<string, TDefaultCommand>();
        this._publicCommands = new Map<string, TPublicCommand>();
        this._bot = new Client({
            intents: [
                'GUILDS',
                'GUILD_MESSAGES',
                'GUILD_MESSAGE_REACTIONS',
                'DIRECT_MESSAGE_REACTIONS',
                'GUILD_MEMBERS'
            ]
        });
    }
    //#endregion

    async init(middlewares: {
        defaultCommands: Array<TDefaultCommand>;
        calCommands: Array<TCalCommand>;
        routines: Array<TRoutine>;
        reactions: Array<TReaction>;
        alerts: Array<TAlert>;
        eventAlerts: Array<TEventAlert>;
        memberEvents: Array<TMemberEventCommand>;
        publicCommands: Array<TPublicCommand>;
    }) {
        this._bot.on('debug', (msg: string) => {
            logger.debug(msg);
        });
        const promRead = new Promise<void>((res, rej) => {
            this._bot.on('ready', (client: Client<true>) => {
                logger.debug('Connected');
                logger.debug('Logged in as: ');
                logger.debug(this._bot.user?.tag + ' - (' + this._bot.user?.id + ')');
                res();
            });
        });
        const {
            defaultCommands,
            calCommands,
            routines,
            reactions,
            alerts,
            eventAlerts,
            memberEvents,
            publicCommands
        } = middlewares;
        await Promise.all([promRead, this._bot.login(staticConfig().discord.key)]);
        this._guildId = (await this._bot.guilds.fetch()).first()?.id || '';
        await this.guild.members.fetch();
        this._initCommands(defaultCommands, calCommands, memberEvents, publicCommands);
        await this._initChannels();
        await this._initReactions(reactions);
        await this._initAlerts(alerts);
        await this._initEventAlerts(eventAlerts);
        await this._initDefaultRole();
        this._routines(routines).catch(e => logger.error(e));
        await this._memberEventFactory.init();
    }

    public async updateCalendar(): Promise<void> {
        if (this._calData.channelId == null || this._calData.messageId == null) return;
        const channel = <TextChannel>this.guild.channels.cache.get(this._calData.channelId);
        if (channel) {
            const message = channel.messages.cache.get(this._calData.messageId);
            if (message) await message.edit({ embeds: [await getEmbedCalendar()] });
        }
    }

    private _initCommands(
        defaultCommands: Array<TDefaultCommand>,
        calCommands: Array<TCalCommand>,
        memberEventCommands: Array<TMemberEventCommand>,
        publicCommands: Array<TPublicCommand>
    ): void {
        for (const command of defaultCommands) {
            this._defaultCommands.set(command.command, command);
        }
        for (const command of calCommands) {
            this._calData.commands.set(command.command, command);
        }
        for (const command of memberEventCommands) {
            this._memberEvents.set(command.command, command);
        }
        for (const command of publicCommands) {
            this.publicCommands.set(command.command, command);
        }
        this._bot.on('messageCreate', async (msg: Message<boolean>) => {
            try {
                const eventAlertDatas = this._eventAlerts.filter(
                    eventAlertData =>
                        eventAlertData.channelEventId === msg.channelId &&
                        eventAlertData.channelAlertId &&
                        eventAlertData.channelEventId
                );
                if (eventAlertDatas.length) {
                    await Promise.allSettled(
                        eventAlertDatas.map(eventAlertData =>
                            eventAlertData.channelAlertId != null
                                ? eventAlertData.eventAlert.callback(
                                      msg,
                                      eventAlertData,
                                      this,
                                      <TextChannel>(
                                          this.guild.channels.cache.get(
                                              eventAlertData.channelAlertId
                                          )
                                      )
                                  )
                                : undefined
                        )
                    ).catch(e => logger.error(e));
                }
                if (
                    !msg.content.trimStart().startsWith('!') ||
                    msg.author.id === this._bot.user?.id
                ) {
                    return;
                } else if (msg.content.trimStart().startsWith('!event')) {
                    msg.content = msg.content.replace(/\ \ +/g, ' ').trim();
                    const args = msg.content.split(' ');
                    const command = this.memberEvents.get(args[1]);
                    if (command) {
                        const result = await command.callback(msg, args, this);
                        if (typeof result === 'string') {
                            await msg.reply(result);
                        } else {
                            await msg.delete();
                        }
                    } else {
                        const commands = this.memberEventCommandsDesc;
                        let msgContent = '';
                        for (const command of commands)
                            msgContent += command[1] + ':\n```' + command[0] + '```';
                        await msg.author.send(msgContent);
                    }
                } else if (!msg.content.trimStart().startsWith(this._prefix)) {
                    const args = msg.content.split(' ');
                    let [command] = args;
                    if ((command = command?.slice(1))) {
                        if (command.toLocaleLowerCase() === 'commands') {
                            const commands = await this.getCustomCommandList();
                            const commandsStr =
                                'Alle Befehle:\n' +
                                commands
                                    .map(com => (com.startsWith('!') ? com : '!' + com))
                                    .join('\n');
                            await msg.reply(commandsStr);
                        } else {
                            const value = await this.getPublicOrCustomCommand(command);
                            if (typeof value === 'string') {
                                await msg.reply(value);
                            } else if (value != null && args.length >= value.minLength) {
                                const result = await value.callback(msg, args, this);
                                if (result) await msg.channel.send(result);
                            } else {
                                const commands = await this.getCustomCommandList();
                                const commandsStr =
                                    'Nicht gefunden. Alle Befehle:\n' +
                                    commands
                                        .map(com => (com.startsWith('!') ? com : '!' + com))
                                        .join('\n');
                                await msg.reply(commandsStr);
                            }
                        }
                    }
                } else {
                    msg.content = msg.content.replace(/\ \ +/g, ' ').trim();
                    const args = msg.content.split(' ');
                    if (args.length < 2) {
                        await COMMAND_COMMAND.callback(msg, args, this);
                        return;
                    }
                    if (
                        msg.channelId === this.commandsChannelId &&
                        args.length > 2 &&
                        args[1] === 'cal'
                    ) {
                        if (!this._calData.channelId) return;
                        const command = this._calData.commands.get(args[2]);
                        if (command) {
                            await command.callback(msg, args, this);
                        } else await msg.delete();
                    } else {
                        const command = this._defaultCommands.get(args[1]);
                        if (
                            command &&
                            msg.member &&
                            this._hasPermissions(msg.member, command) &&
                            args.length >= command.minLength &&
                            command.command === args[1]
                        ) {
                            await command.callback(msg, args, this);
                        } else {
                            await COMMAND_COMMAND.callback(msg, args, this);
                            await msg.delete();
                        }
                    }
                }
            } catch (e: any) {
                await msg.reply('ERROR: ' + e?.message);
            }
        });
    }

    public async initCalendarChannel(): Promise<void> {
        this._calData.channelId = await GetConfig('CAL_CH_ID');
        this._calData.messageId = await GetConfig('CAL_MSG_ID');
        if (this._calData.channelId) {
            const ch = <TextChannel>this._bot.channels.cache.get(this._calData.channelId);
            const createMsg = async () => {
                const embed = await getEmbedCalendar();
                const newMsg = await ch.send({ embeds: [embed] });
                await SetConfig('CAL_MSG_ID', newMsg.id);
                this._calData.messageId = newMsg.id;
                await newMsg.fetch(true);
            };
            if (this._calData.messageId) {
                await ch.messages.fetch();
                const msg = ch.messages.cache.get(this._calData.messageId);
                if (!msg) await createMsg();
                else await this.updateCalendar();
            } else await createMsg();
        }
    }

    private _hasPermissions(member: GuildMember, command: TDefaultCommand): boolean {
        if (!command.permission) return true;
        return member.permissions.has(command.permission);
    }

    //#region reaction
    public async initReactionChannel(
        reactionData: typeof this._reactions[number],
        channelId?: string
    ): Promise<void> {
        const channdelIdent = reactionData.reaction.ident + '_CH_ID';
        const messageIdent = reactionData.reaction.ident + '_MSG_ID';
        const getChannelId = async (channelId: string | undefined): Promise<string | undefined> => {
            if (channelId) {
                return SetConfig(channdelIdent, channelId);
            } else {
                return GetConfig(channdelIdent);
            }
        };
        reactionData.channelId = await getChannelId(channelId);
        reactionData.messageId = await GetConfig(messageIdent);
        if (reactionData.channelId) {
            const ch = <TextChannel>this._bot.channels.cache.get(reactionData.channelId);
            const createMsg = async () => {
                const text =
                    reactionData.reaction.text instanceof Function
                        ? reactionData.reaction.text(this)
                        : reactionData.reaction.text;
                const newMsg = await ch.send(
                    typeof text === 'string'
                        ? text
                        : {
                              content: null,
                              embeds: [text]
                          }
                );
                await SetConfig(messageIdent, newMsg.id);
                reactionData.messageId = newMsg.id;
                await newMsg.fetch(true);
            };
            if (reactionData.messageId) {
                await ch.messages.fetch();
                const msg = ch.messages.cache.get(reactionData.messageId);
                if (!msg) await createMsg();
                else {
                    const text =
                        reactionData.reaction.text instanceof Function
                            ? reactionData.reaction.text(this)
                            : reactionData.reaction.text;
                    await msg.edit(
                        typeof text === 'string'
                            ? text
                            : {
                                  content: null,
                                  embeds: [text]
                              }
                    );
                }
            } else await createMsg();
        }
    }

    private async _initReactions(reactions: Array<TReaction>): Promise<void> {
        for (const reaction of reactions) {
            const reactionData = {
                channelId: '',
                messageId: '',
                roles: new Map<string, string>(reaction.roles.map((role: string) => [role, ''])),
                reaction
            };
            this._reactions.push(reactionData);
            await this._initReactionRoles(reactionData);
            await this.initReactionChannel(reactionData);
        }
        this._bot.on('messageReactionAdd', async (reaction, user) => {
            const reactionData = this.reactions.find(
                reactionData =>
                    reactionData.channelId === reaction.message.channelId &&
                    reactionData.messageId === reaction.message.id
            );
            if (reactionData && reaction.emoji.name) {
                await reactionData.reaction.addCallback(
                    reaction,
                    Buffer.from(reaction.emoji.name).toString('hex'),
                    reactionData,
                    user,
                    this
                );
            }
        });
        this._bot.on('messageReactionRemove', async (reaction, user) => {
            const reactionData = this.reactions.find(
                reactionData =>
                    reactionData.channelId === reaction.message.channelId &&
                    reactionData.messageId === reaction.message.id
            );
            if (reactionData && reaction.emoji.name) {
                await reactionData.reaction.removeCallback(
                    reaction,
                    Buffer.from(reaction.emoji.name).toString('hex'),
                    reactionData,
                    user,
                    this
                );
            }
        });
    }

    private async _initReactionRoles(reactionData: typeof this._reactions[number]): Promise<void> {
        const g = this.guild;
        for (const role of reactionData.reaction.roles) {
            const cacheRole = g.roles.cache.find(r => r.name === role);
            if (cacheRole) {
                reactionData.roles.set(role, cacheRole.id);
            } else {
                const newRole = await g.roles.create({ name: role });
                reactionData.roles.set(role, newRole.id);
            }
        }
    }
    //#endregion

    //#region alerts
    public async initAlertChannel(
        alertData: typeof this._alerts[number],
        channelId?: string
    ): Promise<void> {
        const channdelIdent = 'ALERT_' + alertData.alert.ident + '_CH_ID';
        const getChannelId = async (channelId: string | undefined): Promise<string | undefined> => {
            if (channelId) {
                return SetConfig(channdelIdent, channelId);
            } else {
                return GetConfig(channdelIdent);
            }
        };
        alertData.channelId = await getChannelId(channelId);
    }

    private async _initAlerts(alerts: Array<TAlert>): Promise<void> {
        for (const alert of alerts) {
            const alertData = {
                channelId: '',
                messageId: '',
                role: {
                    name: alert.role,
                    id: ''
                },
                alert
            };
            this._alerts.push(alertData);
            await this._initAlertRoles(alertData);
            await this.initAlertChannel(alertData);
        }
        const forever = async () => {
            for (;;) {
                try {
                    logger.debug('Running alerts.');
                    await Promise.allSettled(
                        this._alerts.filter(a => a.channelId).map(a => a.alert.callback(a, this))
                    );
                    await new Promise<void>(res => {
                        setTimeout(_ => res(), 15 * 1000);
                    });
                } catch (e) {
                    logger.error(e);
                }
            }
        };
        forever()
            .then(_ => logger.info('Started alerts'))
            .catch(logger.error);
    }

    private async _initAlertRoles(alertData: typeof this._alerts[number]): Promise<void> {
        const g = this.guild;
        const cacheRole = g.roles.cache.find(r => r.name === alertData.alert.role);
        if (cacheRole) {
            alertData.role.id = cacheRole.id;
        } else {
            const newRole = await g.roles.create({ name: alertData.alert.role });
            alertData.role.id = newRole.id;
        }
    }
    //#endregion

    //#region event alerts
    public async initEventAlertChannel(
        alertData: typeof this._eventAlerts[number],
        type: 'ALERT' | 'EVENT',
        channelId?: string
    ): Promise<void> {
        if (type === 'ALERT') {
            const channdelIdent = 'EVENT_ALERT_A_' + alertData.eventAlert.identAlert + '_CH_ID';
            const getChannelId = async (
                channelId: string | undefined
            ): Promise<string | undefined> => {
                if (channelId) {
                    return SetConfig(channdelIdent, channelId);
                } else {
                    return GetConfig(channdelIdent);
                }
            };
            alertData.channelAlertId = await getChannelId(channelId);
        } else {
            const channdelIdent = 'EVENT_ALERT_E_' + alertData.eventAlert.identEvent + '_CH_ID';
            const getChannelId = async (
                channelId: string | undefined
            ): Promise<string | undefined> => {
                if (channelId) {
                    return SetConfig(channdelIdent, channelId);
                } else {
                    return GetConfig(channdelIdent);
                }
            };
            alertData.channelEventId = await getChannelId(channelId);
        }
    }

    private async _initEventAlerts(eventAlerts: Array<TEventAlert>): Promise<void> {
        for (const eventAlert of eventAlerts) {
            const eventAlertData = {
                channelEventId: '',
                channelAlertId: '',
                messageId: '',
                role: {
                    name: eventAlert.role,
                    id: ''
                },
                eventAlert
            };
            this._eventAlerts.push(eventAlertData);
            await this._initEventAlertRoles(eventAlertData);
            await this.initEventAlertChannel(eventAlertData, 'ALERT');
            await this.initEventAlertChannel(eventAlertData, 'EVENT');
        }
    }

    private async _initEventAlertRoles(alertData: typeof this._eventAlerts[number]): Promise<void> {
        const g = this.guild;
        const cacheRole = g.roles.cache.find(r => r.name === alertData.eventAlert.role);
        if (cacheRole) {
            alertData.role.id = cacheRole.id;
        } else {
            const newRole = await g.roles.create({ name: alertData.eventAlert.role });
            alertData.role.id = newRole.id;
        }
    }
    //#endregion

    private async _initDefaultRole(): Promise<void> {
        const g = this.guild;
        const labCalRole = g.roles.cache.find(r => r.name === this._calData.role);
        if (labCalRole) {
            this._calData.roleId = labCalRole.id;
        } else {
            const newRole = await g.roles.create({ name: this._calData.role });
            this._calData.roleId = newRole.id;
        }
    }

    private async _initChannels(): Promise<void> {
        this.commandsChannelId = await GetConfig('COM_CH_ID');
        this.refCleanChannelIds = (await GetConfig('REF_CLEAN_CHS'))?.split(',') || [];
        await this.initCalendarChannel();
    }

    private async _routines(routines: Array<TRoutine>) {
        for (;;) {
            try {
                logger.debug('Running routine.');
                await Promise.allSettled(routines.map(r => r(this)));
            } catch (e) {
                logger.error(e);
            } finally {
                await new Promise<void>(res => {
                    setTimeout(_ => res(), 30 * 1000);
                });
            }
        }
    }

    //#region custom commands
    public async getPublicOrCustomCommand(
        command: string
    ): Promise<string | undefined | null | TPublicCommand> {
        const publicCommand = this.publicCommands.get(command);
        if (publicCommand) {
            return publicCommand;
        } else {
            const key = `CUSTOM_COM_${command}`;
            const result = await prismaClient.config.findFirst({
                where: {
                    key
                },
                select: {
                    value: true
                }
            });
            return result?.value;
        }
    }

    public async getCustomCommandList(): Promise<string[]> {
        const key = `CUSTOM_COM_`;
        const customCommands = await prismaClient.config.findMany({
            where: {
                key: {
                    startsWith: key
                }
            },
            select: {
                key: true
            },
            orderBy: {
                key: 'asc'
            }
        });
        const result = customCommands.map(res => res.key.slice(key.length));
        for (const pubCommand of this.publicCommands.map.values()) {
            result.unshift(`${pubCommand.desc[0][0]}\t${pubCommand.desc[0][1]}`);
        }
        return result;
    }

    public async delCustomCommand(command: string): Promise<void> {
        const key = `CUSTOM_COM_${command}`;
        await prismaClient.config.delete({
            where: {
                key
            }
        });
    }

    public async setCustomCommand(command: string, value: string): Promise<void> {
        const key = `CUSTOM_COM_${command}`;
        await prismaClient.config.upsert({
            create: {
                key,
                value
            },
            update: {
                value
            },
            where: {
                key
            }
        });
    }

    //#endregion
}

export type TCalCommand = {
    desc: [string, string][];
    command: string;
    callback: (msg: Message<boolean>, args: Array<string>, discord: Discord) => Promise<void>;
};

export type TMemberEventCommand = {
    desc: [string, string][];
    command: string;
    callback: (
        msg: Message<boolean>,
        args: Array<string>,
        discord: Discord
    ) => Promise<void | string>;
};

export type TDefaultCommand = {
    command: string;
    minLength: number;
    permission: PermissionResolvable | null;
    desc: [string, string][];
    callback: (msg: Message<boolean>, args: Array<string>, discord: Discord) => Promise<void>;
};

export type TPublicCommand = {
    command: string;
    minLength: number;
    desc: [string, string][];
    callback: (
        msg: Message<boolean>,
        args: Array<string>,
        discord: Discord
    ) => Promise<string | void>;
};

export type TRoutine = (discord: Discord) => Promise<void>;

export type TReaction = {
    ident: string;
    desc: [string, string][];
    icons: string[];
    text: MessageEmbed | string | ((discord: Discord) => string | MessageEmbed);
    roles: string[];
    addCallback: (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData: {
            channelId: string | undefined;
            messageId: string | undefined;
            roles: Map<string, string>;
            reaction: TReaction;
        },
        user: User | PartialUser,
        discord: Discord
    ) => Promise<void>;
    removeCallback: (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData: {
            channelId: string | undefined;
            messageId: string | undefined;
            roles: Map<string, string>;
            reaction: TReaction;
        },
        user: User | PartialUser,
        discord: Discord
    ) => Promise<void>;
};

export type TAlert = {
    ident: string;
    icon: string;
    desc: [string, string][];
    role: string;
    callback: (
        alertData: {
            channelId: string | undefined;
            role: {
                name: string;
                id: string;
            };
            alert: TAlert;
        },
        discord: Discord
    ) => Promise<void>;
};

export type TEventAlert = {
    identEvent: string;
    identAlert: string;
    desc: [string, string][];
    icon: string;
    role: string;
    callback: (
        message: Message<boolean>,
        eventAlertData: {
            channelAlertId: string | undefined;
            channelEventId: string | undefined;
            role: {
                name: string;
                id: string;
            };
            eventAlert: TEventAlert;
        },
        discord: Discord,
        alertChannel: TextChannel
    ) => Promise<void>;
};
