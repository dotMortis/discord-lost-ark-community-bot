const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    logger: {
        defaultMeta: { service: 'la_dc_bot' },
        logLevel: process.env.WINSTON_LEVEL,
        dirPath: process.env.WINSTON_PATH,
        prefix: process.env.WINSTON_PREFIX
    }
};
