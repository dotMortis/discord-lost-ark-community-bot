import { Role } from '@prisma/client';

export const LAClass: { [key in ELAClass]: TLAClass } = {
    BERSERKER: {
        icon: '',
        name: 'Berserker',
        role: Role.DD
    },
    PALADIN: {
        icon: '',
        name: 'Paladin',
        role: Role.SUPP
    },
    GUNLANCER: {
        icon: '',
        name: 'Gunlancer',
        role: Role.DD
    },
    DESTROYER: {
        icon: '',
        name: 'Destroyer',
        role: Role.DD
    },
    STRIKER: {
        icon: '',
        name: 'Striker',
        role: Role.DD
    },
    WARDANCER: {
        icon: '',
        name: 'Wardancer',
        role: Role.DD
    },
    SCRAPPER: {
        icon: '',
        name: 'Scrapper',
        role: Role.DD
    },
    SOULFIST: {
        icon: '',
        name: 'Soulfist',
        role: Role.DD
    },
    GLAVIER: {
        icon: '',
        name: 'Glavier',
        role: Role.DD
    },
    GUNSLINGER: {
        icon: '',
        name: 'Gunslinger',
        role: Role.DD
    },
    ARTILLERIST: {
        icon: '',
        name: 'Artillerist',
        role: Role.DD
    },
    DEADEYE: {
        icon: '',
        name: 'Deadeye',
        role: Role.DD
    },
    SHARPSHOOTER: {
        icon: '',
        name: 'Sharpshooter',
        role: Role.DD
    },
    BARD: {
        icon: '',
        name: 'Bard',
        role: Role.SUPP
    },
    SORCERESS: {
        icon: '',
        name: 'Sorceress',
        role: Role.DD
    },
    SHADOWHUNTER: {
        icon: '',
        name: 'Shadowhunter',
        role: Role.DD
    },
    DEATHBLADE: {
        icon: '',
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
    GLAVIER = 'GLAVIER',
    GUNSLINGER = 'GUNSLINGER',
    ARTILLERIST = 'ARTILLERIST',
    DEADEYE = 'DEADEYE',
    SHARPSHOOTER = 'SHARPSHOOTER',
    BARD = 'BARD',
    SORCERESS = 'SORCERESS',
    SHADOWHUNTER = 'SHADOWHUNTER',
    DEATHBLADE = 'DEATHBLADE'
}

export type TLAClass = {
    icon: string;
    name: string;
    role: Role;
};
