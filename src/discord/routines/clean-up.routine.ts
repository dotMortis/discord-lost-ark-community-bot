import { logger } from '@bits_devel/logger';
import { TextChannel } from 'discord.js';
import { Discord, TRoutine } from '../discord.model';

export const CLEAN_UP_ROUTINE: TRoutine = async (discord: Discord) => {
    for (const id of discord.refCleanChannelIds) {
        const channel = <TextChannel>discord.guild.channels.cache.get(id);
        const messages = (await channel.messages.fetch({ limit: 100 })).filter(message => {
            try {
                let result = false;

                const expire = message.content.match(/Expire(s|d) \<t\:(?<time>[0-9]+)\:R\>/);

                if (expire && Number(expire.groups?.time) * 1000 < Date.now()) result = true;
                if (!result) {
                    const embed = message.embeds[0];
                    if (embed) {
                        const expire = embed.title?.match(/Expire(s|d) \<t\:(?<time>[0-9]+)\:R\>/);
                        if (expire && Number(expire.groups?.time) * 1000 < Date.now())
                            result = true;
                    }
                }
                if (!result) result = message.flags.bitfield === 10;
                return result;
            } catch (e) {
                logger.error(e);
                return false;
            }
        });
        if (messages.size) await channel.bulkDelete(messages);
    }
};
