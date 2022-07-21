import { TextChannel } from 'discord.js';
import { NextFunction } from 'express';
import { ApiRequestHandler } from '../../models/express-extended/api-request-handler.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { ApiResponse } from '../../models/express-extended/api-response.model';
import { DiscordChannelInfo } from '../../models/schema/discord/discord-channel-info.model';
import { DiscordInfo, IDiscordInfo } from '../../models/schema/discord/discord-info.model';
import { SERVER } from '../../server';
import { CommonController } from './common/common.controller';

export class DiscordController extends CommonController<DiscordInfo, IDiscordInfo> {
    constructor() {
        super(DiscordInfo);
    }

    getDiscordInfo(): ApiRequestHandler {
        return async (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            await this.getOneResponse('Get discord info', res.locals, async () => {
                const { guild } = SERVER.discord;
                return {
                    name: guild.name,
                    channels: <Array<DiscordChannelInfo>>guild.channels.cache
                        .filter(channel => channel instanceof TextChannel)
                        .map(textChannel => ({
                            id: textChannel.id,
                            name: textChannel.name
                        }))
                };
            }).finally(next);
        };
    }
}
