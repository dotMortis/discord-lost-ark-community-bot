import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { TCustomEmojiName } from '../../models/custom-emoji/custom-emoji.collection';
import { Discord } from '../discord.model';
import { getEmbedItemLevelReaction } from '../embeds/content-abo.embed';
import { TReaction } from '../event.types';

export const ITEMLEVEL_REACTION: TReaction = {
    icons: <Array<TCustomEmojiName>>[
        'loa_t1',
        'loa_t2',
        'loa_argos',
        'loa_argosp2',
        'loa_argosp3',
        'loa_valtannm',
        'loa_valtanhm',
        'loa_vykasnm',
        'loa_vykashm',
        'loa_kakul'
    ],
    ident: 'LEVEL_R',
    roles: [
        'Tier1',
        'Tier2',
        'ArgosP1',
        'ArgosP2',
        'ArgosP3',
        'ValtanNM',
        'ValtanHM',
        'VykasNM',
        'VykasHM',
        'Kakul'
    ],
    desc: [['!dot assign LEVEL_R', 'Setzt den aktiven Channel für die Content-Abo-Nachricht']],
    text: getEmbedItemLevelReaction,
    addCallback: async function (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData: {
            channelId: string | undefined;
            messageId: string | undefined;
            roles: Map<string, string>;
            reaction: TReaction;
        },
        user: User | PartialUser,
        discord: Discord
    ): Promise<void> {
        const alertIndex = this.icons.indexOf(reaction.emoji.name || '');
        if (alertIndex === -1) {
            await reaction.remove();
        } else {
            const role = reactionData.roles.get(this.roles[alertIndex]);
            const member = discord.guild.members.cache.get(user.id);
            if (member && role) await member.roles.add(role);
        }
    },
    removeCallback: async function (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData: {
            channelId: string | undefined;
            messageId: string | undefined;
            roles: Map<string, string>;
            reaction: TReaction;
        },
        user: User | PartialUser,
        discord: Discord
    ): Promise<void> {
        const alertIndex = this.icons.indexOf(reaction.emoji.name || '');
        if (alertIndex === -1) {
            await reaction.remove();
        } else {
            const role = reactionData.roles.get(this.roles[alertIndex]);
            const member = discord.guild.members.cache.get(user.id);
            if (role && member) await member.roles.remove(role);
        }
    }
};
