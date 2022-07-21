import { DeSerializable, IDeSerializable } from '@bits_devel/de-serializer';
import { Event, LogMode } from '@prisma/client';
import { SERVER } from '../../../server';

export interface IEventModel extends Event {
    channelName?: string;
    creatorName?: string;
}

export class EventModel implements IEventModel, IDeSerializable<EventModel, IEventModel> {
    id!: number;
    description!: string | null;
    channelId!: string;
    messageId!: string | null;
    channelName?: string;
    creatorName?: string;
    supps!: number;
    dds!: number;
    free!: number;
    name!: string;
    creatorId!: string;
    isDone!: boolean;
    isDeleted!: boolean;
    logMode!: LogMode;

    constructor() {}

    deserialeSettings: DeSerializable<EventModel, IEventModel> = {
        keys: {
            channelId: {
                options: {
                    priority: 1
                },
                autoCast: 'string'
            },
            channelName: {
                autoCast: 'string',
                options: {
                    priority: 2,
                    forceFromDataStore: true
                },
                dataStore: {
                    from: async () =>
                        SERVER.discord.guild.channels.cache.get(this.channelId)?.name || 'N/A',
                    to: 'delete'
                }
            },
            creatorId: {
                options: {
                    priority: 1
                },
                autoCast: 'string'
            },
            creatorName: {
                autoCast: 'string',
                options: {
                    priority: 2,
                    forceFromDataStore: true
                },
                dataStore: {
                    from: () =>
                        SERVER.discord.guild.members.cache.get(this.creatorId)?.displayName ||
                        'N/A',
                    to: 'delete'
                }
            },
            dds: {
                autoCast: 'number'
            },
            description: {
                autoCast: 'string'
            },
            free: {
                autoCast: 'number'
            },
            id: {
                autoCast: 'number'
            },
            isDeleted: {
                autoCast: 'boolean'
            },
            isDone: {
                autoCast: 'boolean'
            },
            logMode: {
                autoCast: 'enum',
                enum: LogMode
            },
            messageId: {
                autoCast: 'string'
            },
            name: {
                autoCast: 'string'
            },
            supps: {
                autoCast: 'number'
            }
        }
    };
}
