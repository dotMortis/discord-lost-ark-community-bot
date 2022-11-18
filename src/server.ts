import { connectPrismaClient } from './db/prisma-client';
import { ADVENTURE_ALERT } from './discord/alerts/adventure.alert';
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
    LIST_EVENTS,
    LOGS_EVENT,
    LOG_MODE_EVENT,
    MOVE_MEMBER_EVENT_PARTY,
    MOVE_MEMBER_EVENT_SPARE,
    REMOVE_MEMBER_EVENT,
    RENAME_EVENT,
    SWITCH_MEMBERS_EVENT_PARTY
} from './discord/member-event-commands/member-event-commands';
import { ROLL_PUB_COMMAND } from './discord/public-commands/roll.public-command';
import { ALERT_REACTION } from './discord/reactions/alert.reaction';
import { ITEMLEVEL_REACTION } from './discord/reactions/itemlevel.reaction';
import { WELCOME_REACTION } from './discord/reactions/welcome.reaction';
import { CLEAN_UP_ROUTINE } from './discord/routines/clean-up.routine';
import { COMMANDS_CLEAN_UP_ROUTINE } from './discord/routines/commands-clean-up.routine';
import { MEMBER_EVENT_CLEAN_UP_ROUTINE } from './discord/routines/member-event-log-clean-up.routine';
export class Server {
    discord: Discord;

    constructor() {
        this.discord = new Discord();
    }

    async init() {
        await connectPrismaClient();
        await this.discord.init({
            defaultCommands: [
                ASSIGN_COMMAND,
                COMMAND_COMMAND,
                DEL_CUSTOM_COMMAND,
                ADD_CUSTOM_COMMAND
            ],
            routines: [CLEAN_UP_ROUTINE, COMMANDS_CLEAN_UP_ROUTINE, MEMBER_EVENT_CLEAN_UP_ROUTINE],
            reactions: [WELCOME_REACTION, ALERT_REACTION, ITEMLEVEL_REACTION],
            alerts: [ADVENTURE_ALERT],
            eventAlerts: [SERIA_EVENT_ALERT, GIFT_EVENT_ALERT],
            memberEvents: [
                ADD_MEMBER_EVENT,
                REMOVE_MEMBER_EVENT,
                DESCRIPE_EVENT,
                DESCRIPE_EVENT_PARTY,
                SWITCH_MEMBERS_EVENT_PARTY,
                KICK_MEMBER_EVENT_PARTY,
                MOVE_MEMBER_EVENT_PARTY,
                IS_DONE_EVENT_PARTY,
                IS_DONE_EVENT,
                LIST_EVENTS,
                LOGS_EVENT,
                RENAME_EVENT,
                LOG_MODE_EVENT,
                MOVE_MEMBER_EVENT_SPARE
            ],
            publicCommands: [ROLL_PUB_COMMAND]
        });
    }
}
