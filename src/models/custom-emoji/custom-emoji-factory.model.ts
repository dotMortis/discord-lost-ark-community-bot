import { path as rootPath } from 'app-root-path';
import path from 'path';
import { Discord } from '../../discord/discord.model';
import { TCustomEmojiName } from './custom-emoji.collection';
import { CustomEmoji } from './custom-emoji.model';

export class CustomEmojiFactory {
    private readonly _basePath: string;
    private readonly _discord: Discord;
    private _isInit: boolean;
    private readonly _emojisName: {
        [P in TCustomEmojiName]: null | CustomEmoji<TCustomEmojiName>;
    };
    private readonly _emojisId: {
        [id in string]?: CustomEmoji<TCustomEmojiName>;
    };

    constructor(discord: Discord) {
        this._isInit = false;
        this._discord = discord;
        this._basePath = path.resolve(rootPath, 'assets', 'images', 'custom-emojis');
        this._emojisName = {
            loa_argos: null,
            loa_argosp2: null,
            loa_argosp3: null,
            loa_kakul: null,
            loa_t1: null,
            loa_t2: null,
            loa_valtan: null,
            loa_valtanhm: null,
            loa_valtannm: null,
            loa_vykas: null,
            loa_vykashm: null,
            loa_vykasnm: null,
            la_artillerist: null,
            la_bard: null,
            la_berserker: null,
            la_deadeye: null,
            la_deathblade: null,
            la_destroyer: null,
            la_glaivier: null,
            la_gunlancer: null,
            la_gunslinger: null,
            la_paladin: null,
            la_scrapper: null,
            la_shadowhunter: null,
            la_sharpshooter: null,
            la_sorceress: null,
            la_soulfist: null,
            la_striker: null,
            la_wardancer: null,
            la_arcana: null
        };
        this._emojisId = {};
    }

    public async init(): Promise<void> {
        await this._initCustomIcons();
        this._isInit = true;
    }

    public fromName<NAME extends TCustomEmojiName>(
        name: NAME | `:${NAME}:`
    ): CustomEmoji<NAME> | null {
        this._isInitCheck();
        if (name.startsWith(':') && name.endsWith(':')) {
            name = <NAME>name.substring(1, name.length - 1);
        }
        return <CustomEmoji<NAME>>this._emojisName[name] || null;
    }

    public fromId(id: string): CustomEmoji<TCustomEmojiName> | null {
        this._isInitCheck();
        return this._emojisId[id] || null;
    }

    private async _initCustomIcons(): Promise<void> {
        const emojis = await this._discord.guild.emojis.fetch();
        for (const customEmojiKey of Object.keys(this._emojisName)) {
            const customEmojiName = <TCustomEmojiName>customEmojiKey;
            let emoji = emojis.find(emoji => emoji.name === customEmojiName);
            if (!emoji) {
                emoji = await this._discord.guild.emojis.create(
                    path.resolve(this._basePath, `${customEmojiName}.png`),
                    customEmojiName
                );
            }
            const customEmoji = new CustomEmoji<typeof customEmojiName>({
                id: emoji.id,
                emoji,
                name: customEmojiName
            });
            this._emojisId[customEmoji.id] = customEmoji;
            this._emojisName[customEmojiName] = customEmoji;
        }
    }

    private _isInitCheck(): void {
        if (!this._isInit) throw new Error('CustomEmojis not initialized');
    }
}
