import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Discord, TReaction } from '../discord.model';

export const WELCOME_REACTION: TReaction = {
    icons: ['f09fa496'],
    ident: 'WEL',
    desc: [['!dot assign WEL', 'Setzt den aktiven Channel für die Willkommensnachricht']],
    roles: ['_W'],
    text: (discord: Discord) => {
        return `Herzlich willkommen.\nUm den Server freizuschalten, bitte einmal mit dem :robot: Emote auf diese Nachricht reagieren.\n Schau dir zudem unseren <#${discord.calData.channelId}> an!`;
    },
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
            await member.roles.add(reactionData.roles.get(this.roles[0]));
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
            member.roles.remove(reactionData.roles.get(this.roles[0]));
        }
    }
};
