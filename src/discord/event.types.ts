import { EmbedBuilder, SlashCommandSubcommandBuilder } from '@discordjs/builders';
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    Message,
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    PermissionResolvable,
    Permissions,
    TextChannel,
    User
} from 'discord.js';
import { Discord } from './discord.model';

export type SlashCommand = {
    name: string;
    description: string;
    permission?: Permissions | bigint | number | null;
    cb:
        | null
        | ((
              interaction: ChatInputCommandInteraction,
              discord: Discord
          ) => Promise<void | string | false>);
    subs: {
        [key: string]: SlashSubCommand;
    };
};

export type SlashSubCommand = {
    data: (builder: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder;
    cb: (
        interaction: ChatInputCommandInteraction,
        discord: Discord
    ) => Promise<void | string | false>;
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
    text: EmbedBuilder | string | ((discord: Discord) => string | EmbedBuilder);
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

export type ButtonInteractionInfo = {
    prefix: string;
    cb: (interaction: ButtonInteraction, discord: Discord) => Promise<void>;
};
