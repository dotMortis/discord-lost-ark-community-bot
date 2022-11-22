import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Discord } from '../discord.model';
import { getEmbedWelcomeReaction } from '../embeds/welcome.embed';
import { TReaction } from '../event.types';

export const WELCOME_REACTION: TReaction = {
    icons: ['f09fa496', 'f09f9494'],
    ident: 'WEL',
    desc: [['!dot assign WEL', 'Setzt den aktiven Channel für die Willkommensnachricht']],
    roles: ['Member', 'MemberPing'],
    text: getEmbedWelcomeReaction,
    addCallback: async function (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData,
        user: User | PartialUser,
        discord: Discord
    ): Promise<void> {
        console.log(reactionHex);
        const index = this.icons.indexOf(reactionHex);
        if (index === -1) {
            await reaction.remove();
        } else {
            const member = discord.guild.members.cache.get(user.id);
            const role = reactionData.roles.get(this.roles[index]);
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
        console.log(reactionHex);
        const index = this.icons.indexOf(reactionHex);
        if (index === -1) {
            await reaction.remove();
        } else {
            const member = discord.guild.members.cache.get(user.id);
            const role = reactionData.roles.get(this.roles[index]);
            if (role && member) await member.roles.remove(role);
        }
    }
};
