import { connectPrismaClient } from './db/prisma-client';
import { Discord } from './discord/discord.model';
import {
    ADD_MEMBER_EVENT,
    DESCRIPE_EVENT,
    DESCRIPE_EVENT_PARTY,
    IS_DONE_EVENT_PARTY,
    KICK_MEMBER_EVENT_PARTY,
    MOVE_MEMBER_EVENT_PARTY,
    REMOVE_MEMBER_EVENT,
    SWITCH_MEMBERS_EVENT_PARTY
} from './discord/member-event-commands/member-event-commands';
export class Server {
    discord: Discord;

    constructor() {
        this.discord = new Discord();
    }

    async init() {
        await connectPrismaClient();
        await this.discord.init(
            [],
            [],
            [],
            [],
            [],
            [],
            [
                ADD_MEMBER_EVENT,
                REMOVE_MEMBER_EVENT,
                DESCRIPE_EVENT,
                DESCRIPE_EVENT_PARTY,
                SWITCH_MEMBERS_EVENT_PARTY,
                KICK_MEMBER_EVENT_PARTY,
                MOVE_MEMBER_EVENT_PARTY,
                IS_DONE_EVENT_PARTY
            ]
        );
    }
}
