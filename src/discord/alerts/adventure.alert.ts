import { TextChannel } from 'discord.js';
import { GetConfig, SetConfig } from '../../models/config.model';
import { Discord } from '../discord.model';
import { TAlert } from '../event.types';

const timeMapping = new Map<number, number[]>([
    [1, [18, 20, 22]],
    [2, [18, 20, 22]],
    [3, [18, 20, 22]],
    [4, [18, 20, 22]],
    [5, [18, 20, 22]],
    [6, [14, 18, 20, 22]],
    [7, [14, 18, 20, 22]]
]);
const lastMsgIdent = 'ADVENTURE_LAST_MSG';
const fifteenMin = 1000 * 60 * 15;
const fifeMin = 1000 * 60 * 5;
const oneMin = 1000 * 60;

let lastMessageId: string = '';

const sendMsg = async (
    icon: string,
    roleId: string,
    channelId: string,
    hour: number,
    currentDate: Date,
    adventureTime: Date,
    discord: Discord
) => {
    const msg = `${icon} Nächste Abenteuerinsel um ${hour}:00 Uhr\n||<@&${roleId}> (Expires <t:${Math.round(
        (adventureTime.getTime() + 1000 * 60 * 3) / 1000
    )}:R>)||`;
    const ch = <TextChannel>discord.guild.channels.cache.get(channelId);
    if (lastMessageId) {
        const lastMessage = ch.messages.cache.get(lastMessageId);
        if (lastMessage) await lastMessage.delete();
    }
    const newMsg = await ch.send(msg);
    lastMessageId = newMsg.id;
    await SetConfig(lastMsgIdent, currentDate.getTime().toString());
};

export const ADVENTURE_ALERT: TAlert = {
    icon: ':island:',
    ident: 'ADVENTURE',
    role: '_ADVENTURE',
    desc: [['!dot assign ADVENTURE', 'Setzt den aktiven Channel für die Abenteuerinsel Alerts']],
    callback: async function (
        alertData: {
            channelId: string | undefined;
            role: { name: string; id: string };
            alert: TAlert;
        },
        discord: Discord
    ): Promise<void> {
        if (alertData.channelId == null) return;
        const currentDate = new Date();
        const adventureTimes = timeMapping.get(currentDate.getDay() || 7);
        const lastMsgTS = Number((await GetConfig(lastMsgIdent)) || 0);
        for (const h of adventureTimes || []) {
            const adventureTime = new Date();
            adventureTime.setUTCHours(h, 0, 0, 0);
            const diff = adventureTime.getTime() - currentDate.getTime();
            if (diff > -1 && diff <= oneMin && lastMsgTS < adventureTime.getTime() - oneMin) {
                await sendMsg(
                    this.icon,
                    alertData.role.id,
                    alertData.channelId,
                    adventureTime.getHours(),
                    currentDate,
                    adventureTime,
                    discord
                );
                break;
            } else if (
                diff > -1 &&
                diff <= fifeMin &&
                lastMsgTS < adventureTime.getTime() - fifeMin
            ) {
                await sendMsg(
                    this.icon,
                    alertData.role.id,
                    alertData.channelId,
                    adventureTime.getHours(),
                    currentDate,
                    adventureTime,
                    discord
                );
                break;
            } else if (
                diff > -1 &&
                diff <= fifteenMin &&
                lastMsgTS < adventureTime.getTime() - fifteenMin
            ) {
                await sendMsg(
                    this.icon,
                    alertData.role.id,
                    alertData.channelId,
                    adventureTime.getHours(),
                    currentDate,
                    adventureTime,
                    discord
                );
                break;
            }
        }
    }
};
