import { BaseClass, Role } from '@prisma/client';
import { prismaClient } from '../src/db/prisma-client';

export const LAClasses: { [key in ELAClass]: TLAClass<ELAClass> } = {
    BERSERKER: {
        icon: 'la_berserker',
        name: 'Berserker',
        role: Role.DD,
        base: 'Warrior'
    },
    PALADIN: {
        icon: 'la_paladin',
        name: 'Paladin',
        role: Role.SUPP,
        base: 'Warrior'
    },
    GUNLANCER: {
        icon: 'la_gunlancer',
        name: 'Gunlancer',
        role: Role.DD,
        base: 'Warrior'
    },
    DESTROYER: {
        icon: 'la_destroyer',
        name: 'Destroyer',
        role: Role.DD,
        base: 'Warrior'
    },
    STRIKER: {
        icon: 'la_striker',
        name: 'Striker',
        role: Role.DD,
        base: 'MartialArtist'
    },
    WARDANCER: {
        icon: 'la_wardancer',
        name: 'Wardancer',
        role: Role.DD,
        base: 'MartialArtist'
    },
    SCRAPPER: {
        icon: 'la_scrapper',
        name: 'Scrapper',
        role: Role.DD,
        base: 'MartialArtist'
    },
    SOULFIST: {
        icon: 'la_soulfist',
        name: 'Soulfist',
        role: Role.DD,
        base: 'MartialArtist'
    },
    GLAIVIER: {
        icon: 'la_glaivier',
        name: 'Glaivier',
        role: Role.DD,
        base: 'MartialArtist'
    },
    GUNSLINGER: {
        icon: 'la_gunslinger',
        name: 'Gunslinger',
        role: Role.DD,
        base: 'Gunner'
    },
    ARTILLERIST: {
        icon: 'la_artillerist',
        name: 'Artillerist',
        role: Role.DD,
        base: 'Gunner'
    },
    DEADEYE: {
        icon: 'la_deadeye',
        name: 'Deadeye',
        role: Role.DD,
        base: 'Gunner'
    },
    SHARPSHOOTER: {
        icon: 'la_sharpshooter',
        name: 'Sharpshooter',
        role: Role.DD,
        base: 'Gunner'
    },
    BARD: {
        icon: 'la_bard',
        name: 'Bard',
        role: Role.SUPP,
        base: 'Mage'
    },
    SORCERESS: {
        icon: 'la_sorceress',
        name: 'Sorceress',
        role: Role.DD,
        base: 'Mage'
    },
    SHADOWHUNTER: {
        icon: 'la_shadowhunter',
        name: 'Shadowhunter',
        role: Role.DD,
        base: 'Assassin'
    },
    DEATHBLADE: {
        icon: 'la_deathblade',
        name: 'Deathblade',
        role: Role.DD,
        base: 'Assassin'
    },
    REAPER: {
        icon: 'la_reaper',
        base: 'Assassin',
        name: 'Reaper',
        role: Role.DD
    },
    ARCANIST: {
        icon: 'la_arcanist',
        base: 'Mage',
        name: 'Arcanist',
        role: Role.DD
    },
    MACHINIST: {
        icon: 'la_machinist',
        base: 'Gunner',
        name: 'Machinist',
        role: Role.DD
    }
};

export enum ELAClass {
    BERSERKER = 'BERSERKER',
    PALADIN = 'PALADIN',
    GUNLANCER = 'GUNLANCER',
    DESTROYER = 'DESTROYER',
    STRIKER = 'STRIKER',
    WARDANCER = 'WARDANCER',
    SCRAPPER = 'SCRAPPER',
    SOULFIST = 'SOULFIST',
    GLAIVIER = 'GLAIVIER',
    GUNSLINGER = 'GUNSLINGER',
    ARTILLERIST = 'ARTILLERIST',
    DEADEYE = 'DEADEYE',
    SHARPSHOOTER = 'SHARPSHOOTER',
    BARD = 'BARD',
    SORCERESS = 'SORCERESS',
    SHADOWHUNTER = 'SHADOWHUNTER',
    DEATHBLADE = 'DEATHBLADE',
    REAPER = 'REAPER',
    MACHINIST = 'MACHINIST',
    ARCANIST = 'ARCANIST'
}

export type TLAClass<NAME extends string> = {
    icon: `la_${Lowercase<NAME>}`;
    name: Capitalize<Lowercase<NAME>>;
    role: Role;
    base: BaseClass;
};

const main = async () => {
    await prismaClient.class.createMany({
        data: Object.values(LAClasses)
    });
};

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });
