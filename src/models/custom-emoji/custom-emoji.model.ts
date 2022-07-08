import { GuildEmoji } from 'discord.js';
import { TCustomEmojiName } from './custom-emoji.collection';

export interface ICustomEmoji<NAME extends TCustomEmojiName> {
    id: string;
    emoji: GuildEmoji;
    name: NAME;
    toIconString(): string;
}

export class CustomEmoji<NAME extends TCustomEmojiName> implements ICustomEmoji<NAME> {
    public id: string;
    public emoji: GuildEmoji;
    public name: NAME;

    constructor(data: { id: string; emoji: GuildEmoji; name: NAME }) {
        this.id = data.id;
        this.emoji = data.emoji;
        this.name = data.name;
    }

    public toIconString(): string {
        return `<:${this.name}:${this.id}>`;
    }

    public static toIconString(name: string, id: string): string {
        return `<:${name}:${id}>`;
    }
}
