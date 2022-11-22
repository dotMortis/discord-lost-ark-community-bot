import { logger } from '@bits_devel/logger';
import { Message, TextChannel } from 'discord.js';
import { Discord } from '../discord.model';
import { TEventAlert } from '../event.types';

export const GIFT_EVENT_ALERT: TEventAlert = {
    identEvent: 'GIFT_E',
    identAlert: 'GIFT_A',
    icon: ':gift:',
    desc: [
        ['!dot assign GIFT_E', 'Überwacht den aktiven Channel für Gechenkankündigungen.'],
        ['!dot assign GIFT_A', 'Setzt den aktiven Channel für die Geschenk Alerts.']
    ],
    role: '_LEG_CARD',
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
            if (embed?.description) {
                const expireMatch = embed.title?.match(/(?<expires>Expire(s|d) \<t\:[0-9]+\:R\>)/i);
                const giftMatch = embed.description.match(/gift\:.+Legendary/i);
                if (giftMatch && expireMatch && expireMatch.groups?.expires) {
                    await alertCh.send(
                        `${this.icon} Legendary gift ${message.url}\n||${expireMatch.groups.expires} <@&${eventAlertData.role.id}>||`
                    );
                }
            }
        } catch (error) {
            logger.error(error);
        }
    }
};
