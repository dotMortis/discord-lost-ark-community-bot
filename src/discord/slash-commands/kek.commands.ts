import { ChatInputCommandInteraction, Message, PermissionFlagsBits, User } from 'discord.js';
import { GetConfig, SetConfig } from '../../models/config.model';
import { Discord } from '../discord.model';
import { SlashCommand, SlashSubCommand } from '../event.types';

const ALL_KEKS = new Map<string, User>();
export const iniKeks = async (discord: Discord) => {
    const kekIds = (await GetConfig('keks'))?.split(';') || [];
    for (const kekId of kekIds) {
        const kekUser = discord.guild.members.cache.get(kekId);
        if (kekUser) ALL_KEKS.set(kekId, kekUser.user);
    }
};

const INSULTS = [
    'Was will der Kek schon wieder?!',
    'Uf...',
    'Okay, wenn du das sagst...',
    'Nicht mal ich finde das wichtig...',
    'Besser hier melden 0800 1110111'
];

export const blameKek = async (msg: Message<boolean>) => {
    if (ALL_KEKS.has(msg.author.id)) {
        if (Math.random() > 0.74) {
            let insult = INSULTS[Math.floor(Math.random() * INSULTS.length)];
            //insult = insult.replace('@user', `<@${msg.author.id}>`);
            await msg.reply(insult);
        }
    }
};

const KEK_ASSIGN: SlashSubCommand = {
    data: b =>
        b
            .setName('assign')
            .setDescription('New Kek')
            .addUserOption(i =>
                i.setName('user').setDescription('User becomes a KEK').setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, dc: Discord) => {
        const user = i.options.getUser('user', true);
        if (!ALL_KEKS.has(user.id)) {
            ALL_KEKS.set(user.id, user);
            await SetConfig('keks', Array.from(ALL_KEKS.keys()).join(';'));
        }
    }
};

const KEK_REMOVE: SlashSubCommand = {
    data: b =>
        b
            .setName('remove')
            .setDescription('Remove Kek')
            .addUserOption(i =>
                i.setName('user').setDescription(`User becomes a KEKn't`).setRequired(true)
            ),
    cb: async (i: ChatInputCommandInteraction, dc: Discord) => {
        const user = i.options.getUser('user', true);
        if (ALL_KEKS.has(user.id)) {
            ALL_KEKS.delete(user.id);
            await SetConfig('keks', Array.from(ALL_KEKS.keys()).join(';'));
        }
    }
};

export const KEK: SlashCommand = {
    name: 'kek',
    cb: null,
    description: 'Does a KEK',
    permission: PermissionFlagsBits.Administrator,
    subs: {
        assign: KEK_ASSIGN,
        remove: KEK_REMOVE
    }
};
