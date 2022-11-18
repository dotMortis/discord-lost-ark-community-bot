import { EmbedBuilder } from '@discordjs/builders';
import { Discord } from '../discord.model';

export const getEmbedWelcomeReaction = (discord: Discord) => {
    const title = 'Herzlich willkommen';
    const description = `Um den Server freizuschalten, bitte einmal mit dem :robot: Emote auf diese Nachricht reagieren.`;

    const embed = new EmbedBuilder();
    embed.setColor(0x0099ff);
    embed.setTitle(title);
    embed.setDescription(description);
    embed.addFields({
        name: '\u200B',
        value: `Schau dir zudem unseren <#${discord.calData.channelId}> an!`
    });
    return embed;
};
