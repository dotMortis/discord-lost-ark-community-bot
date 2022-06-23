import { MessageEmbed } from 'discord.js';
import { Discord } from '../discord.model';

export const getEmbedItemLevelReaction = (discord: Discord) => {
    const title = `Content alerts`;
    const description = `Reagiere auf alle Itemlevel Bereiche für welche Du aktivitäten abschließen möchtest.`;

    const embed = new MessageEmbed();
    embed.setColor('#0099ff');
    embed.setTitle(title);
    embed.setDescription(description);

    embed.addField('\u200B', ':one:\tTier 1' + '\n:two:\tTier 2', true);
    embed.addField('\u200B', '\n:three:\t1302+' + '\n:four:\t1340+', true);
    embed.addField('\u200B', '\n:five:\t1370+' + '\n:six:\t1385+' + '\n:seven:\t1400+', true);
    embed.addField('\u200B', '\n:eight:\t1415+' + '\n:nine:\t1445+', true);
    embed.addField('\u200B', '\u200B', true);
    embed.addField('\u200B', '\u200B', true);

    embed.setFooter({ text: 'Bitte update Deinen Bereich regelmäßig!' });
    return embed;
};
