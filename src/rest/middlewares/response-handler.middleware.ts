import { logger } from '@bits_devel/logger';
import { HttpMethod } from '@bits_devel/swaggerhub-parser2';
import { NextFunction } from 'express';
import { staticConfig } from '../../config/static-config';
import { ApiRequestHandler } from '../../models/express-extended/api-request-handler.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { ApiResponse } from '../../models/express-extended/api-response.model';

export const responseHandler: ApiRequestHandler = async (
    req: ApiRequest,
    res: ApiResponse,
    next: NextFunction
): Promise<void> => {
    try {
        logger.debug('Using responseHandler');
        if (res.locals.userInfo?.newToken) {
            res.cookie('jwt', res.locals.userInfo.newToken, {
                httpOnly: true,
                sameSite: 'strict',
                secure: staticConfig().cookie.secure
            });
        }

        if (res.locals.error) {
            next(res.locals.error);
        } else {
            switch (res.locals.method) {
                case HttpMethod.get:
                    res.status(200);
                    if (res.locals.response) res.json(res.locals.response);
                    else res.send();
                    break;
                case HttpMethod.post:
                    res.status(201);
                    if (res.locals.response) res.json(res.locals.response);
                    else res.send();
                    break;
                case HttpMethod.patch:
                    res.status(202);
                    if (res.locals.response) res.json(res.locals.response);
                    else res.send();
                    break;
                case HttpMethod.delete:
                    res.status(204).send();
            }
        }
    } catch (error: any) {
        next(error);
    }
};
