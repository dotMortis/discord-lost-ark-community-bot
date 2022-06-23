import { MessageEmbed } from 'discord.js';
import { Discord } from '../discord.model';

export const getEmbedEventAboReaction = (discord: Discord) => {
    const description = `Hier kannst du verschiedene Benachrichtigungen für wichtige LostArk Events abonieren.`;

    const embed = new MessageEmbed();
    embed.setColor('#0099ff');
    embed.setDescription(description);

    embed.addField(
        '\u200B',
        '\n:flower_playing_cards:\tSeria Sammelkarte' +
            '\n:gift:\tLegendäre Geschenke' +
            '\n:island:\tAbenteuer Inseln'
    );
    return embed;
};
