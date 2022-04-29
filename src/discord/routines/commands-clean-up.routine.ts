import { TextChannel } from 'discord.js';
import { Discord, TRoutine } from '../discord.model';

export const COMMANDS_CLEAN_UP_ROUTINE: TRoutine = async (discord: Discord) => {
    const channel = <TextChannel>discord.guild.channels.cache.get(discord.commandsChannelId);
    const messages = (await channel.messages.fetch({ limit: 100 })).filter(
        message => message.createdAt.getTime() < Date.now() - 1000 * 60 * 30
    );
    await channel.bulkDelete(messages);
};
