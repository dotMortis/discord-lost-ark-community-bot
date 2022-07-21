import { DeSerializable, IDeSerializable } from '@bits_devel/de-serializer';

export interface IDiscordChannelInfo {
    id: string;
    name: string;
}

export class DiscordChannelInfo
    implements IDiscordChannelInfo, IDeSerializable<DiscordChannelInfo, IDiscordChannelInfo>
{
    id!: string;
    name!: string;

    constructor() {}

    deserialeSettings: DeSerializable<DiscordChannelInfo, IDiscordChannelInfo> = {
        keys: {
            id: {
                autoCast: 'string'
            },
            name: {
                autoCast: 'string'
            }
        }
    };
}
