import { Message } from 'discord.js';
import { Discord, TMemberEventCommand } from '../discord.model';

export const ADD_MEMBER_EVENT: TMemberEventCommand = {
    command: 'create',
    desc: [['!event create ...', 'Erstellt ein Event mit eindeutigem Namen.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, classMapping] = args;
        const [dds = 0, supps = 0, free = 0] = classMapping.split(':');
        const name = args.slice(3).join(' ');
        await discord.memberEventFactory.createEvent(
            msg.author.id,
            Number(dds),
            Number(supps),
            Number(free),
            name,
            msg.channelId
        );
    }
};
