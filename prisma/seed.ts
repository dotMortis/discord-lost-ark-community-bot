import { Role } from '@prisma/client';
import { prismaClient } from '../src/db/prisma-client';

export const LAClasses: { [key in ELAClass]: TLAClass<ELAClass> } = {
    BERSERKER: {
        icon: ':la_berserker:',
        name: 'Berserker',
        role: Role.DD
    },
    PALADIN: {
        icon: ':la_paladin:',
        name: 'Paladin',
        role: Role.SUPP
    },
    GUNLANCER: {
        icon: ':la_gunlancer:',
        name: 'Gunlancer',
        role: Role.DD
    },
    DESTROYER: {
        icon: ':la_destroyer:',
        name: 'Destroyer',
        role: Role.DD
    },
    STRIKER: {
        icon: ':la_striker:',
        name: 'Striker',
        role: Role.DD
    },
    WARDANCER: {
        icon: ':la_wardancer:',
        name: 'Wardancer',
        role: Role.DD
    },
    SCRAPPER: {
        icon: ':la_scrapper:',
        name: 'Scrapper',
        role: Role.DD
    },
    SOULFIST: {
        icon: ':la_soulfist:',
        name: 'Soulfist',
        role: Role.DD
    },
    GLAIVIER: {
        icon: ':la_glaivier:',
        name: 'Glaivier',
        role: Role.DD
    },
    GUNSLINGER: {
        icon: ':la_gunslinger:',
        name: 'Gunslinger',
        role: Role.DD
    },
    ARTILLERIST: {
        icon: ':la_artillerist:',
        name: 'Artillerist',
        role: Role.DD
    },
    DEADEYE: {
        icon: ':la_deadeye:',
        name: 'Deadeye',
        role: Role.DD
    },
    SHARPSHOOTER: {
        icon: ':la_sharpshooter:',
        name: 'Sharpshooter',
        role: Role.DD
    },
    BARD: {
        icon: ':la_bard:',
        name: 'Bard',
        role: Role.SUPP
    },
    SORCERESS: {
        icon: ':la_sorceress:',
        name: 'Sorceress',
        role: Role.DD
    },
    SHADOWHUNTER: {
        icon: ':la_shadowhunter:',
        name: 'Shadowhunter',
        role: Role.DD
    },
    DEATHBLADE: {
        icon: ':la_deathblade:',
        name: 'Deathblade',
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
    DEATHBLADE = 'DEATHBLADE'
}

export type TLAClass<NAME extends string> = {
    icon: `:la_${Lowercase<NAME>}:`;
    name: Capitalize<Lowercase<NAME>>;
    role: Role;
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
