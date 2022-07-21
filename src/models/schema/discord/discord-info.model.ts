import { DeSerializable, IDeSerializable } from '@bits_devel/de-serializer';
import { DiscordChannelInfo } from './discord-channel-info.model';

export interface IDiscordInfo {
    name: string;
    channels: Array<DiscordChannelInfo>;
}

export class DiscordInfo implements IDiscordInfo, IDeSerializable<DiscordInfo, IDiscordInfo> {
    name!: string;
    channels!: DiscordChannelInfo[];

    constructor() {}

    deserialeSettings: DeSerializable<DiscordInfo, IDiscordInfo> = {
        keys: {
            name: {
                autoCast: 'string'
            },
            channels: {
                autoCast: 'arrayNestedObject',
                nestedObject: DiscordChannelInfo
            }
        }
    };
}
