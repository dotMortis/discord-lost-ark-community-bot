import { logger } from '@bits_devel/logger';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { staticConfig } from '../config/static-config';
import { Discord } from './discord.model';

export const registerCommands = async (discord: Discord, commands: SlashCommandBuilder[]) => {
    const rest = new REST({ version: '10' }).setToken(staticConfig().discord.key || '');

    try {
        logger.info(`Started refreshing application (/) commands.`);
        const data: any = await rest.put(
            Routes.applicationGuildCommands(discord.bot.user?.id || '', discord.guild.id),
            {
                body: commands.map(c => c.toJSON())
            }
        );
        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        logger.error(error);
    }
};
