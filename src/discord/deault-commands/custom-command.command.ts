import { Message } from 'discord.js';
import { Discord, TDefaultCommand } from '../discord.model';

export const ADD_CUSTOM_COMMAND: TDefaultCommand = {
    command: 'custom_add',
    minLength: 4,
    permission: null,
    desc: [
        [
            '!dot custom_add <commandName> <commandContent>',
            'Setzt einen benutzerdefinierten Bot-Befehl.'
        ],
        ['!commands', 'Liste aller benutzerdefinierten Bot-Befehlen.']
    ],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const newCommand = args[2];
        if (
            newCommand?.toLocaleLowerCase() === 'commands' ||
            discord.publicCommands.get(newCommand)
        ) {
            await msg.reply(`${newCommand} ist reserviert`);
        } else {
            const value = args.slice(3).join(' ');
            await discord.setCustomCommand(newCommand, value);
            await msg.reply('Done!');
        }
    }
};

export const DEL_CUSTOM_COMMAND: TDefaultCommand = {
    command: 'custom_del',
    minLength: 3,
    permission: null,
    desc: [['!dot custom_del <commandName>', 'Entfernt einen benutzerdefinierten Bot-Befehl.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const customCommand = args[2];
        await discord.delCustomCommand(customCommand);
        await msg.reply('Done!');
    }
};
