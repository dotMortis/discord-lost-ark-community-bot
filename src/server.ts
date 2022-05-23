import { connectPrismaClient } from './db/prisma-client';
import { Discord } from './discord/discord.model';
import { ADD_MEMBER_EVENT } from './discord/member-event-commands/create-event';
export class Server {
    discord: Discord;

    constructor() {
        this.discord = new Discord();
    }

    async init() {
        await connectPrismaClient();
        await this.discord.init([], [], [], [], [], [], [ADD_MEMBER_EVENT]);
    }
}
