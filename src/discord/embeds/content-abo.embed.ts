import { MessageEmbed } from 'discord.js';
import { Discord } from '../discord.model';

export const getEmbedItemLevelReaction = (discord: Discord) => {
    const title = `Content alerts`;
    const description = `Reagiere auf alle Content Bereiche für welche Du aktivitäten abschließen möchtest.`;

    const embed = new MessageEmbed();
    embed.setColor('#0099ff');
    embed.setTitle(title);
    embed.setDescription(description);

    embed.addField(
        '\u200B',
        `${discord.customEmojiFactory.fromName('loa_t1')?.toIconString()}\tTier 1` +
            `\n${discord.customEmojiFactory.fromName('loa_t2')?.toIconString()}\tTier 2`,
        true
    );
    embed.addField(
        '\u200B',
        `${discord.customEmojiFactory.fromName('loa_argos')?.toIconString()}\tArgos P1 | 1370+` +
            `\n${discord.customEmojiFactory
                .fromName('loa_argosp2')
                ?.toIconString()}\tArgos P2 | 1385+` +
            `\n${discord.customEmojiFactory
                .fromName('loa_argosp3')
                ?.toIconString()}\tArgos P3 | 1400+`,
        true
    );
    embed.addField(
        '\u200B',
        `${discord.customEmojiFactory
            .fromName('loa_valtannm')
            ?.toIconString()}\tValtan NM | 1415+` +
            `\n${discord.customEmojiFactory
                .fromName('loa_valtanhm')
                ?.toIconString()}\tValtan HM | 1445+`,
        true
    );
    embed.addField(
        '\u200B',
        `${discord.customEmojiFactory.fromName('loa_vykasnm')?.toIconString()}\tVykas NM | 1430+` +
            `\n${discord.customEmojiFactory
                .fromName('loa_vykashm')
                ?.toIconString()}\tVykas HM | 1460+`,
        true
    );
    embed.addField(
        '\u200B',
        `${discord.customEmojiFactory.fromName('loa_kakul')?.toIconString()}\tKakul | 1475+`,
        true
    );
    embed.addField('\u200B', '\u200B', true);

    embed.setFooter({ text: 'Bitte update Deinen Bereich regelmäßig!' });
    return embed;
};
