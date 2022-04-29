import { Discord, TRoutine } from '../discord.model';

export const UPDATE_CALENDAR_ROUTINE: TRoutine = async (discord: Discord) => {
    await discord.updateCalendar();
};
