import { MessageEmbed } from 'discord.js';
import { Discord } from '../discord.model';

export const getEmbedWelcomeReaction = (discord: Discord) => {
    const title = 'Herzlich willkommen';
    const description = `Um den Server freizuschalten, bitte einmal mit dem :robot: Emote auf diese Nachricht reagieren.`;

    const embed = new MessageEmbed();
    embed.setColor('#0099ff');
    embed.setTitle(title);
    embed.setDescription(description);
    embed.addField('\u200B', `Schau dir zudem unseren <#${discord.calData.channelId}> an!`);
    return embed;
};
