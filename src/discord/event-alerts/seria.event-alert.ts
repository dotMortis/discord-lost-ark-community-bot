import { logger } from '@bits_devel/logger';
import { Message, TextChannel } from 'discord.js';
import { Discord, TEventAlert } from '../discord.model';

export const SERIA_EVENT_ALERT: TEventAlert = {
    identEvent: 'SERIA_E',
    identAlert: 'SERIA_A',
    icon: ':flower_playing_cards:',
    desc: [
        ['!dot assign SERIA_E', 'Überwacht den aktiven Channel für Seria-Ankündigungen.'],
        ['!dot assign SERIA_A', 'Setzt den aktiven Channel für die Seria Alerts.']
    ],
    role: '_SERIA',
    callback: async function (
        message: Message<boolean>,
        eventAlertData: {
            channelAlertId: string | undefined;
            channelEventId: string | undefined;
            role: { name: string; id: string };
            eventAlert: TEventAlert;
        },
        discord: Discord,
        alertCh: TextChannel
    ): Promise<void> {
        try {
            const embed = message.embeds[0];
            const match = embed?.title?.match(/seria.+(?<expires>Expire(s|d) \<t\:[0-9]+\:R\>)/i);
            if (match && match.groups?.expires) {
                await alertCh.send(
                    `${this.icon} Seria ${message.url}\n||${match?.groups?.expires} <@&${eventAlertData.role.id}>||`
                );
            }
        } catch (error) {
            logger.error(error);
        }
    }
};
