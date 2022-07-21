import { logger } from '@bits_devel/logger';
import { startRedisCache } from '@bits_devel/redis-cache';
import { SwaggerParser } from '@bits_devel/swaggerhub-parser2';
import { path as rootPath } from 'app-root-path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response, Router } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import helmet from 'helmet';
import { createServer, Server } from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { version } from '../../package.json';
import { staticConfig } from '../config/static-config';
import { ApiRequest } from '../models/express-extended/api-request.model';
import { ApiResponse } from '../models/express-extended/api-response.model';
import { PassportController } from './controllers/passport.controller';
import bodyParserMiddleware from './middlewares/body-parser.middleware';
import { decodeQueryParams } from './middlewares/decode-query-params.middleware';
import { apiErrorHandler } from './middlewares/error-handler.middleware';
import { initExpress } from './middlewares/init-express.middleware';
import { responseHandler } from './middlewares/response-handler.middleware';
import openapi from './openapi.json';
import V1_ROUTER from './router/v1/v1.router';

export class Rest {
    public static swaggerParser: SwaggerParser;
    public static openapiJsonPath: string;

    private app?: Application;
    private server?: Server;
    private name = 'BITS Verwaltung API';

    constructor() {
        Rest.openapiJsonPath = path.resolve(__dirname, 'openapi.json');
        Rest.swaggerParser = new SwaggerParser();
    }

    public async startServer(): Promise<Rest> {
        startRedisCache({ host: staticConfig().redis.host }, staticConfig().redis.prefix, logger);
        logger.info('Cache initialized');
        await Rest.swaggerParser.init(Rest.openapiJsonPath);
        logger.info('Swagger parser initialized');
        const app = this.addMiddlewares();
        logger.info('Middlewares initialized');
        this.addPaths(app);
        logger.info('Paths initialized');
        this.createHttpServer();
        logger.info('Http server initialized');
        //await initSocketIO(server);
        //logger.info('IO Socket Server initialized.');
        await this.listen();
        logger.info(`Running server on port ${staticConfig().port}`);
        return this;
    }

    private addMiddlewares(): Application {
        this.app = express();
        this.app.use(cors(staticConfig().cors));
        this.app.use(helmet());
        this.app.use(bodyParserMiddleware);
        this.app.use(cookieParser());
        this.app.use(new PassportController().initialize());
        this.app.use(decodeQueryParams);
        return this.app;
    }

    private addPaths(app: express.Application): void {
        app.use('/static', express.static(path.resolve(rootPath, 'assets', 'public')));
        const docsRouter = Router();
        docsRouter.get('/v1', (req: Request, res: Response, next: NextFunction) => {
            try {
                return swaggerUi.setup(
                    { ...openapi, ...{ info: { version, title: this.name } } },
                    {
                        customSiteTitle: this.name,
                        customfavIcon: '/static/images/favicon.ico'
                    }
                )(req, res, next);
            } catch (error: any) {
                next(error);
            }
        });
        app.use('/docs', initExpress, swaggerUi.serve, docsRouter);
        app.use('/version', (req: ApiRequest, res: ApiResponse, next: NextFunction) =>
            res.status(200).json({ version })
        );
        app.use(
            '/v1',
            OpenApiValidator.middleware({
                apiSpec: Rest.openapiJsonPath,
                validateResponses: {
                    coerceTypes: true
                },
                validateRequests: {
                    coerceTypes: true
                },
                fileUploader: false,
                unknownFormats: true
            }),
            initExpress,
            V1_ROUTER,
            responseHandler
        );
        app.use(apiErrorHandler);
    }

    private createHttpServer(): Server {
        this.server = createServer(this.app);
        return this.server;
    }

    private listen(): Promise<true> {
        return new Promise((resolve, reject) => {
            try {
                if (this.server) {
                    this.server.listen(staticConfig().port, () => resolve(true));
                } else {
                    reject(new Error('Server not initialized.'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}
