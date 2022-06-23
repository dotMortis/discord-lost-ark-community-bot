import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Discord, TReaction } from '../discord.model';
import { getEmbedWelcomeReaction } from '../embeds/welcome.embed';

export const WELCOME_REACTION: TReaction = {
    icons: ['f09fa496'],
    ident: 'WEL',
    desc: [['!dot assign WEL', 'Setzt den aktiven Channel für die Willkommensnachricht']],
    roles: ['_W'],
    text: getEmbedWelcomeReaction,
    addCallback: async function (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData,
        user: User | PartialUser,
        discord: Discord
    ): Promise<void> {
        if (this.icons[0] !== reactionHex) {
            await reaction.remove();
        } else {
            const member = discord.guild.members.cache.get(user.id);
            const role = reactionData.roles.get(this.roles[0]);
            if (role && member) await member.roles.add(role);
        }
    },
    removeCallback: async function (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData,
        user: User | PartialUser,
        discord: Discord
    ): Promise<void> {
        if (this.icons[0] === reactionHex) {
            const member = discord.guild.members.cache.get(user.id);
            const role = reactionData.roles.get(this.roles[0]);
            if (role && member) await member.roles.remove(role);
        }
    }
};
