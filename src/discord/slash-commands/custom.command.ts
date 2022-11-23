import { ChatInputCommandInteraction } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord } from '../discord.model';
import { SlashCommand, SlashSubCommand } from '../event.types';

const getCustomCommands = async (): Promise<{ name: string; value: string }[]> => {
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

const delCustomCommand = async (command: string): Promise<void> => {
    const key = `CUSTOM_COM_${command}`;
    await prismaClient.config.delete({
        where: {
            key
        }
    });
};

const setCustomCommand = async (command: string, value: string): Promise<void> => {
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
    cb: async (i: ChatInputCommandInteraction, discord: Discord): Promise<void> => {
        await setCustomCommand(
            i.options.getString('name', true),
            i.options.getString('value', true)
        );
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
        await delCustomCommand(i.options.getString('name', true));
    }
};

export const KNOWLEDGE: SlashCommand = {
    name: 'knowledge',
    description: 'Manage informations',
    cb: null,
    subs: {
        delete: DEL_KNOWLEGE,
        create: ADD_KNOWLEDGE
    }
};
