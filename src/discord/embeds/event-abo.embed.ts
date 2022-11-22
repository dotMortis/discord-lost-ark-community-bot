import { EmbedBuilder } from '@discordjs/builders';
import { Discord } from '../discord.model';

export const getEmbedEventAboReaction = (discord: Discord) => {
    const description = `Hier kannst du verschiedene Benachrichtigungen für wichtige LostArk Events abonieren.`;

    const embed = new EmbedBuilder();
    embed.setColor(0x0099ff);
    embed.setDescription(description);

    embed.addFields({
        name: '\u200B',
        value:
            '\n:flower_playing_cards:\tSeria Sammelkarte' +
            '\n:gift:\tLegendäre Geschenke' +
            '\n:island:\tAbenteuer Inseln'
    });
    return embed;
};
