import { logger } from '@bits_devel/logger';
import { Server } from './src/server';

const start = async () => {
    try {
        const server = new Server();
        await server.init();
    } catch (error: any) {
        logger.error(error);
    }
};

start()
    .then(_ => logger.debug('Started'))
    .catch(e => process.exit(0));
