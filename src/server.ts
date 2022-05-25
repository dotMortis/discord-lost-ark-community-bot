import { connectPrismaClient } from './db/prisma-client';
import { ADVENTURE_ALERT } from './discord/alerts/adventure.alert';
import { ADD_EVENT } from './discord/cal-commands/add-event';
import { LIST_CALENDAR } from './discord/cal-commands/list-event';
import { REMOVE_EVENT } from './discord/cal-commands/remove-event';
import { SET_EVENT } from './discord/cal-commands/set-event';
import { UNSET_EVENT } from './discord/cal-commands/unset-event';
import { UPDATE_EVENT } from './discord/cal-commands/update-event';
import { ASSIGN_COMMAND } from './discord/deault-commands/assign.command';
import { COMMAND_COMMAND } from './discord/deault-commands/command.command';
import {
    ADD_CUSTOM_COMMAND,
    DEL_CUSTOM_COMMAND
} from './discord/deault-commands/custom-command.command';
import { Discord } from './discord/discord.model';
import { GIFT_EVENT_ALERT } from './discord/event-alerts/gift.event-alert';
import { SERIA_EVENT_ALERT } from './discord/event-alerts/seria.event-alert';
import {
    ADD_MEMBER_EVENT,
    DESCRIPE_EVENT,
    DESCRIPE_EVENT_PARTY,
    IS_DONE_EVENT,
    IS_DONE_EVENT_PARTY,
    KICK_MEMBER_EVENT_PARTY,
    MOVE_MEMBER_EVENT_PARTY,
    REMOVE_MEMBER_EVENT,
    SWITCH_MEMBERS_EVENT_PARTY
} from './discord/member-event-commands/member-event-commands';
import { ALERT_REACTION } from './discord/reactions/alert.reaction';
import { ITEMLEVEL_REACTION } from './discord/reactions/itemlevel.reaction';
import { WELCOME_REACTION } from './discord/reactions/welcome.reaction';
import { CLEAN_UP_ROUTINE } from './discord/routines/clean-up.routine';
import { COMMANDS_CLEAN_UP_ROUTINE } from './discord/routines/commands-clean-up.routine';
import { UPDATE_CALENDAR_ROUTINE } from './discord/routines/update-calendar.routine';
export class Server {
    discord: Discord;

    constructor() {
        this.discord = new Discord();
    }

    async init() {
        await connectPrismaClient();
        await this.discord.init(
            [ASSIGN_COMMAND, COMMAND_COMMAND, DEL_CUSTOM_COMMAND, ADD_CUSTOM_COMMAND],
            [LIST_CALENDAR, ADD_EVENT, REMOVE_EVENT, SET_EVENT, UNSET_EVENT, UPDATE_EVENT],
            [UPDATE_CALENDAR_ROUTINE, CLEAN_UP_ROUTINE, COMMANDS_CLEAN_UP_ROUTINE],
            [WELCOME_REACTION, ALERT_REACTION, ITEMLEVEL_REACTION],
            [ADVENTURE_ALERT],
            [SERIA_EVENT_ALERT, GIFT_EVENT_ALERT],
            [
                ADD_MEMBER_EVENT,
                REMOVE_MEMBER_EVENT,
                DESCRIPE_EVENT,
                DESCRIPE_EVENT_PARTY,
                SWITCH_MEMBERS_EVENT_PARTY,
                KICK_MEMBER_EVENT_PARTY,
                MOVE_MEMBER_EVENT_PARTY,
                IS_DONE_EVENT_PARTY,
                IS_DONE_EVENT
            ]
        );
    }
}
