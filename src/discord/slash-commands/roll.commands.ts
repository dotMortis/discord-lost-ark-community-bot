import { SlashCommand } from '../event.types';

export const ROLL: SlashCommand = {
    name: 'roll',
    description: '1 - 100',
    cb: async (i, dc) => {
        await i.reply({
            content: `<@${i.user.id}>\t${String(Math.floor(Math.random() * 100) + 1)}`
        });
        return false;
    },
    subs: {}
};
