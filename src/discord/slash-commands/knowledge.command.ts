import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction
} from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord } from '../discord.model';
import { ButtonInteractionInfo, SlashCommand, SlashSubCommand } from '../event.types';

const getKnowledgeBase = async (): Promise<{ name: string; value: string }[]> => {
    const key = `CUSTOM_COM_`;
    const customCommands = await prismaClient.config.findMany({
        where: {
            key: {
                startsWith: key
            }
        },
        select: {
            key: true,
            value: true
        },
        orderBy: {
            key: 'asc'
        }
    });
    const result = customCommands.map(res => ({
        name: res.key.slice(key.length),
        value: <string>res.value
    }));
    return result;
};

const getKnowledge = async (name: string): Promise<{ name: string; value: string } | null> => {
    const keyPrefix = 'CUSTOM_COM_';
    const key = keyPrefix + name;
    const customCommand = await prismaClient.config.findFirst({
        where: {
            key
        },
        select: {
            key: true,
            value: true
        }
    });
    if (customCommand)
        return {
            name: customCommand.key.slice(keyPrefix.length),
            value: <string>customCommand.value
        };
    return null;
};

const delKnowledge = async (command: string): Promise<void> => {
    const key = `CUSTOM_COM_${command}`;
    await prismaClient.config.delete({
        where: {
            key
        }
    });
};

const setKnowledge = async (command: string, value: string): Promise<void> => {
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
};

const getKnowledgeCount = async (): Promise<number> => {
    const keyPrefix = 'CUSTOM_COM_';
    return prismaClient.config.count({
        where: {
            key: {
                startsWith: keyPrefix
            }
        }
    });
};

const ADD_KNOWLEDGE: SlashSubCommand = {
    data: b =>
        b
            .setName('create')
            .setDescription('Create information')
            .addStringOption(o =>
                o.setName('name').setDescription('Info name').setRequired(true).setMinLength(3)
            )
            .addStringOption(o =>
                o.setName('value').setDescription('Info value').setRequired(true).setMinLength(3)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void | string> => {
        if ((await getKnowledgeCount()) < 25)
            await setKnowledge(
                i.options.getString('name', true),
                i.options.getString('value', true)
            );
        else return 'Es sind zu viele EInträge vorhanden, Zeit zum aufräumen!';
    }
};

const LIST_KNOWLEDGE: SlashSubCommand = {
    data: b => b.setName('list').setDescription('Liste aller Informationen'),
    cb: async (i, dc): Promise<false | void> => {
        const knowledgeBase = await getKnowledgeBase();
        let buttonCount = 0;
        const rows = new Array<ActionRowBuilder<ButtonBuilder>>();
        let currRow = new ActionRowBuilder<ButtonBuilder>();
        rows.push(currRow);
        for (let z = 0; z < knowledgeBase.length; z++) {
            const knowledge = knowledgeBase[z];
            buttonCount++;
            currRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`KNOW:${knowledge.name}`)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(knowledge.name)
            );
            if (buttonCount === 5) {
                currRow = new ActionRowBuilder<ButtonBuilder>();
                buttonCount = 0;
                if (rows.length === 5) {
                    await i.reply({
                        content: 'Wähle eine Information',
                        components: rows,
                        ephemeral: true
                    });
                    return false;
                }
                if (z !== knowledgeBase.length - 1) rows.push(currRow);
            }
            if (z === knowledgeBase.length - 1) {
                await i.reply({
                    content: 'Wähle eine Information',
                    components: rows,
                    ephemeral: true
                });
                return false;
            }
        }
    }
};

const DEL_KNOWLEGE: SlashSubCommand = {
    data: b =>
        b
            .setName('delete')
            .setDescription('Delete information')
            .addStringOption(o =>
                o.setName('name').setDescription('Info name').setRequired(true).setMinLength(3)
            ),
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void> => {
        await delKnowledge(i.options.getString('name', true));
    }
};

export const KNOWLEDGE: SlashCommand = {
    name: 'knowledge',
    description: 'Manage informations',
    cb: null,
    subs: {
        delete: DEL_KNOWLEGE,
        create: ADD_KNOWLEDGE,
        list: LIST_KNOWLEDGE
    }
};

export const KNOWLEDGE_BUTTONS: ButtonInteractionInfo = {
    prefix: 'KNOW',
    cb: async (i, dc) => {
        await i.deferUpdate();
        const [prefix, value] = i.customId.split(':');
        const knowledge = await getKnowledge(value);
        await i.editReply({ content: knowledge?.value || 'NOT FOUND' });
    }
};
