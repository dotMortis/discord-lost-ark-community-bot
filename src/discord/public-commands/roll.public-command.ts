import { TPublicCommand } from '../event.types';

export const ROLL_PUB_COMMAND: TPublicCommand = {
    command: 'roll',
    desc: [['!roll', 'Würfelt eine Zahl zwischen 1 und 100']],
    minLength: 1,
    async callback(msg, args, discord) {
        await msg.delete();
        return `<@${msg.author.id}>\t${String(Math.floor(Math.random() * 100) + 1)}`;
    }
};
