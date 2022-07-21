import { Prisma } from '.prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const getLogginLevel = (): Array<Prisma.LogLevel | Prisma.LogDefinition> => {
    switch (process.env.DATABASE_LOG_LEVEL) {
        case 'all':
            return ['warn', 'error', 'query', 'info'];
        case 'debug':
            return ['warn', 'error', 'info'];
        case 'error':
            return ['warn', 'error'];
        default:
            return [];
    }
};

const _staticConfig = {
    secureKey: process.env.SEC_SECRET || '',
    loggingLevel: getLogginLevel(),
    hash: {
        saltRounds: 10,
        secret: process.env.HASH_SECRET || ''
    },
    discord: {
        key: process.env.DISCORD_KEY
    },
    cors: {
        origin: (
            origin: string | undefined,
            callback: (err: Error | null, result?: boolean) => void
        ) => {
            const originWhitelist = process.env.ALLOWED_ORIGINS?.split(',').map(ref => ref.trim());
            origin = origin?.match(/^https?:\/\/(?<domain>.+)/)?.groups?.domain;

            if (
                !origin ||
                originWhitelist?.indexOf('*') !== -1 ||
                originWhitelist.indexOf(origin) !== -1
            ) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        prefix: process.env.REDIS_PREFIX || 'loabot'
    },
    jwt: {
        jwtSecret: process.env.JWT_SECRET,
        ttl: '4h',
        refreshTtlInMin: 20
    },
    cookie: {
        sameSite: process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'strict',
        secure: process.env.COOKIE_SECURE === 'true'
    },
    port: 8081
};

export const staticConfig = () => _staticConfig;
