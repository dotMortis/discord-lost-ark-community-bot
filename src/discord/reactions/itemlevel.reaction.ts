import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Discord, TReaction } from '../discord.model';

export const ITEMLEVEL_REACTION: TReaction = {
    icons: [
        '31efb88fe283a3',
        '32efb88fe283a3',
        '33efb88fe283a3',
        '34efb88fe283a3',
        '35efb88fe283a3',
        '36efb88fe283a3',
        '37efb88fe283a3',
        '38efb88fe283a3'
    ],
    ident: 'LEVEL_R',
    roles: ['Tier1', 'Tier2', '1302+', '1340+', '1370+', '1385+', '1400+', '1415+'],
    desc: [['!dot assign LEVEL_R', 'Setzt den aktiven Channel für die Itemlevel-Abo-Nachricht']],
    text:
        'Reagiere auf alle Itemlevel Bereiche für welche Du aktivitäten abschließen möchtest.' +
        '\n:one:\tTier 1' +
        '\n:two:\tTier 2' +
        '\n:three:\t1302+' +
        '\n:four:\t1340+' +
        '\n:five:\t1370+' +
        '\n:six:\t1385+' +
        '\n:seven:\t1400+' +
        '\n:eight:\t1415+',

    addCallback: async function (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData: {
            channelId: string;
            messageId: string;
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
            await member.roles.add(role);
        }
    },
    removeCallback: async function (
        reaction: MessageReaction | PartialMessageReaction,
        reactionHex: string,
        reactionData: {
            channelId: string;
            messageId: string;
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
            member.roles.remove(role);
        }
    }
};
