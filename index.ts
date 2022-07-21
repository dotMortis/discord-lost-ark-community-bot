import { logger } from '@bits_devel/logger';
import { SERVER } from './src/server';

const start = async () => {
    try {
        await SERVER.init();
    } catch (error: any) {
        logger.error(error);
    }
};

start()
    .then(_ => logger.info('Started dotBot'))
    .catch(e => process.exit(0));
