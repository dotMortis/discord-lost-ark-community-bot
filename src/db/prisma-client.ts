import { PrismaClient } from '@prisma/client';
import { staticConfig } from '../config/static-config';

const PRISMA_CLIENT = new PrismaClient({
    log: staticConfig().loggingLevel
});

//#region Event softdelete
PRISMA_CLIENT.$use(async (params, next) => {
    if (params.model === 'Event') {
        if (params.action === 'findUnique' && params.args.where.deleteAt == null) {
            params.action = 'findFirst';
            params.args.where.isDeleted = false;
        } else if (params.action === 'findFirst' && params.args.where.deleteAt == null) {
            params.args.where.isDeleted = false;
        } else if (params.action === 'findMany') {
            if (params.args == null) {
                params.args = {
                    where: {
                        isDeleted: false
                    }
                };
            } else if (params.args.where == null) {
                params.args.where = {
                    isDeleted: false
                };
            } else if (params.args.where.deleteAt == null) {
                params.args.where.isDeleted = false;
            }
        }
    }
    return next(params);
});

PRISMA_CLIENT.$use(async (params, next) => {
    if (params.model === 'Event') {
        if (params.action === 'update' && params.args.where.deleteAt == null) {
            params.action = 'updateMany';
            params.args.where.isDeleted = false;
        }
        if (params.action === 'updateMany') {
            if (params.args.where == null) {
                params.args.where = { isDeleted: false };
            } else if (params.args.where.deleteAt == null) {
                params.args.where.isDeleted = false;
            }
        }
    }
    return next(params);
});

PRISMA_CLIENT.$use(async (params, next) => {
    if (params.model === 'Event') {
        if (params.action == 'delete') {
            params.action = 'update';
            params.args.data = { isDeleted: true };
        }
        if (params.action === 'deleteMany') {
            params.action = 'updateMany';
            if (params.args.data != null) {
                params.args.data.isDeleted = true;
            } else {
                params.args.data = { isDeleted: true };
            }
        }
    }
    return next(params);
});
//#endregion

export const prismaClient = PRISMA_CLIENT;

export const connectPrismaClient = () => PRISMA_CLIENT.$connect();
