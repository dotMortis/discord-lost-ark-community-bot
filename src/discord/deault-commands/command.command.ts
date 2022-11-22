import { Message } from 'discord.js';
import { Discord } from '../discord.model';
import { TDefaultCommand } from '../event.types';
export const COMMAND_COMMAND: TDefaultCommand = {
    command: 'commands',
    minLength: 2,
    permission: null,
    desc: [['!dot commands', 'Eine Liste aller administrativen Befehlen.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const commands = discord.commandsDesc;
        let msgContent = '';
        for (const command of commands) msgContent += command[1] + ':\n```' + command[0] + '```';
        await msg.reply(msgContent);
    }
};
