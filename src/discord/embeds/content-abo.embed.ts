import { EmbedBuilder } from '@discordjs/builders';
import { Discord } from '../discord.model';

export const getEmbedItemLevelReaction = (discord: Discord) => {
    const title = `Content alerts`;
    const description = `Reagiere auf alle Content Bereiche für welche Du aktivitäten abschließen möchtest.`;

    const embed = new EmbedBuilder();
    embed.setColor(0x0099ff);
    embed.setTitle(title);
    embed.setDescription(description);

    embed.addFields(
        {
            name: '\u200B',
            value:
                `${discord.customEmojiFactory.fromName('loa_t1')?.toIconString()}\tTier 1` +
                `\n${discord.customEmojiFactory.fromName('loa_t2')?.toIconString()}\tTier 2`,
            inline: true
        },
        {
            name: '\u200B',
            value: `${discord.customEmojiFactory
                .fromName('loa_argos')
                ?.toIconString()}\tArgos | 1370+`,
            inline: true
        },
        {
            name: '\u200B',
            value:
                `${discord.customEmojiFactory
                    .fromName('loa_valtannm')
                    ?.toIconString()}\tValtan NM | 1415+` +
                `\n${discord.customEmojiFactory
                    .fromName('loa_valtanhm')
                    ?.toIconString()}\tValtan HM | 1445+`,
            inline: true
        },
        {
            name: '\u200B',
            value:
                `${discord.customEmojiFactory
                    .fromName('loa_vykasnm')
                    ?.toIconString()}\tVykas NM | 1430+` +
                `\n${discord.customEmojiFactory
                    .fromName('loa_vykashm')
                    ?.toIconString()}\tVykas HM | 1460+`,
            inline: true
        },
        {
            name: '\u200B',
            value: `${discord.customEmojiFactory
                .fromName('loa_kakul')
                ?.toIconString()}\tKakul | 1475+`,
            inline: true
        },
        { name: '\u200B', value: '\u200B', inline: true }
    );
    embed.setFooter({ text: 'Bitte update Deinen Bereich regelmäßig!' });
    return embed;
};
