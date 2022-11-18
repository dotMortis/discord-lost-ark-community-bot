import { Message } from 'discord.js';
import { prismaClient } from '../../db/prisma-client';
import { Discord, TDefaultCommand } from '../discord.model';
export const ASSIGN_COMMAND: TDefaultCommand = {
    command: 'assign',
    minLength: 3,
    permission: 'Administrator',
    desc: [
        ['!dot assign com', 'Setzt den aktiven Channel für Bot-Commands.'],
        ['!dot assign clean_ref', 'Fügt den aktiven Channel zur Reinigungsroutine hinzu.']
    ],
    callback: async (msg: Message<boolean>, args: Array<string>, discord: Discord) => {
        const type = args[2];
        if (type === 'com') {
            const key = 'COM_CH_ID';
            const config = await prismaClient.config.upsert({
                where: {
                    key
                },
                create: {
                    key,
                    value: msg.channelId
                },
                update: {
                    value: msg.channelId
                }
            });
            discord.commandsChannelId = config.value == null ? undefined : config.value;
            await msg.reply('Done!');
        } else if (type === 'clean_ref') {
            const key = 'REF_CLEAN_CHS';
            const index = discord.refCleanChannelIds.indexOf(msg.channelId);
            if (index > -1) {
                discord.refCleanChannelIds.splice(index, 1);
            } else {
                discord.refCleanChannelIds.push(msg.channelId);
            }
            await prismaClient.config.upsert({
                where: {
                    key
                },
                create: {
                    key,
                    value: discord.refCleanChannelIds.join(',')
                },
                update: {
                    value: discord.refCleanChannelIds.join(',')
                }
            });
            if (index > -1) await msg.reply('Channel removed from ref clean.');
            else await msg.reply('Channel added to ref clean');
        } else {
            const reactionData = discord.reactions.find(
                reactionData => reactionData.reaction.ident === type
            );
            if (reactionData) {
                await discord.initReactionChannel(reactionData, msg.channelId);
                await msg.reply('Done!');
            }
            const alertData = discord.alerts.find(alertData => alertData.alert.ident === type);
            if (alertData) {
                await discord.initAlertChannel(alertData, msg.channelId);
                await msg.reply('Done!');
            }
            const eventAlertEData = discord.eventAlerts.find(
                eventAlertData => eventAlertData.eventAlert.identEvent === type
            );
            if (eventAlertEData) {
                await discord.initEventAlertChannel(eventAlertEData, 'EVENT', msg.channelId);
                await msg.reply('Done!');
            }
            const eventAlertAData = discord.eventAlerts.find(
                eventAlertData => eventAlertData.eventAlert.identAlert === type
            );
            if (eventAlertAData) {
                await discord.initEventAlertChannel(eventAlertAData, 'ALERT', msg.channelId);
                await msg.reply('Done!');
            }
        }
    }
};
