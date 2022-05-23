import { Message } from 'discord.js';
import { EMemberEvent, TCreateEvent } from '../../models/member-event-factory';
import { Discord, TMemberEventCommand } from '../discord.model';

export const ADD_MEMBER_EVENT: TMemberEventCommand = {
    command: 'create',
    desc: [['!event create ...', 'Erstellt ein Event mit eindeutigem Namen.']],
    callback: async (msg: Message<boolean>, args: string[], discord: Discord): Promise<void> => {
        const [trigger, command, classMapping] = args;
        const [dds = 0, supps = 0, free = 0] = classMapping.split(':');
        const name = args.slice(3).join(' ');
        await discord.memberEventFactory.action<TCreateEvent>({
            channelId: msg.channelId,
            creatorId: msg.author.id,
            dds: Number(dds),
            free: Number(free),
            name,
            supps: Number(supps),
            type: EMemberEvent.CREATE_EVENT
        });
    }
};
