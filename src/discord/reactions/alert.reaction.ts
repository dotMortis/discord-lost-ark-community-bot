import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Discord, TReaction } from '../discord.model';

export const ALERT_REACTION: TReaction = {
    icons: ['f09f8eb4', 'f09f8e81', 'f09f8f9defb88f'],
    ident: 'ALERT_R',
    roles: ['_SERIA', '_LEG_CARD', '_ADVENTURE'],
    desc: [['!dot assign ALERT_R', 'Setzt den aktiven Channel für die Alert-Abo-Nachricht']],
    text:
        'Hier kannst du verschiedene Benachrichtigungen für wichtige LostArk Events abonieren.' +
        '\n:flower_playing_cards:\tSeria Sammelkarte' +
        '\n:gift:\tLegendäre Geschenke' +
        '\n:island:\tAbenteuer Inseln',
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
        const alertIndex = this.icons.indexOf(reactionHex);
        if (alertIndex === -1) {
            await reaction.remove();
        } else {
            const role = reactionData.roles.get(this.roles[alertIndex]);
            const member = discord.guild.members.cache.get(user.id);
            if (role && member) await member.roles.add(role);
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
        const alertIndex = this.icons.indexOf(reactionHex);
        if (alertIndex === -1) {
            await reaction.remove();
        } else {
            const role = reactionData.roles.get(this.roles[alertIndex]);
            const member = discord.guild.members.cache.get(user.id);
            if (member && role) await member.roles.remove(role);
        }
    }
};
