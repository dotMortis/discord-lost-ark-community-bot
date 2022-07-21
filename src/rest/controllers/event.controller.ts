import { deserialize, toDataStore } from '@bits_devel/de-serializer';
import { Event } from '@prisma/client';
import { NextFunction } from 'express';
import { prismaClient } from '../../db/prisma-client';
import { BotApiError } from '../../models/error/bot-api-error.model';
import { ApiRequestHandler } from '../../models/express-extended/api-request-handler.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { ApiResponse } from '../../models/express-extended/api-response.model';
import { EventModel, IEventModel } from '../../models/schema/event/event.model';
import { SERVER } from '../../server';
import { CommonController } from './common/common.controller';

export class EventController extends CommonController<EventModel, IEventModel> {
    constructor() {
        super(EventModel);
    }

    getList(): ApiRequestHandler {
        return async (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            await this.getListResponse('Get event list', res.locals, () =>
                prismaClient.event.findMany({
                    orderBy: {
                        id: 'asc'
                    }
                })
            ).finally(next);
        };
    }

    getOne(): ApiRequestHandler {
        return async (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            await this.getOneResponse('Get event', res.locals, async () => {
                const { eventId } = req.params;
                const event = await prismaClient.event.findUnique({
                    where: {
                        id: Number(eventId)
                    }
                });
                return event;
            }).finally(next);
        };
    }

    post(): ApiRequestHandler {
        return async (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            await this.getSingleCreateResponse('Create event', res.locals, async () => {
                const eventModel = await deserialize<EventModel, IEventModel>(EventModel, req.body);
                const eventData = <Event>(
                    await toDataStore<EventModel, IEventModel>(EventModel, eventModel)
                );
                const event = await SERVER.discord.memberEventFactory.action<'CREATE_EVENT'>({
                    creatorId: SERVER.discord.bot.user?.id || '',
                    type: 'CREATE_EVENT',
                    channelId: eventData.channelId,
                    dds: eventData.dds,
                    free: eventData.free,
                    name: eventData.name,
                    supps: eventData.supps,
                    description: eventData.description,
                    logMode: eventData.logMode
                });
                if (!event) {
                    throw new BotApiError('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR');
                }
                return event;
            }).finally(next);
        };
    }

    patch(): ApiRequestHandler {
        return async (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            await this.getNoneResponse('Create event', res.locals, async () => {
                const { eventId } = req.params;
                const eventModel = await deserialize<EventModel, IEventModel>(EventModel, req.body);
                const eventData = <Event>(
                    await toDataStore<EventModel, IEventModel>(EventModel, eventModel)
                );
                await SERVER.discord.memberEventFactory.action<'UPDATE_EVENT'>({
                    type: 'UPDATE_EVENT',
                    description: eventData.description,
                    actionUserId: SERVER.discord.bot.user?.id || '',
                    eventId: Number(eventId),
                    logMode: eventData.logMode,
                    name: eventData.name
                });
            }).finally(next);
        };
    }
}
