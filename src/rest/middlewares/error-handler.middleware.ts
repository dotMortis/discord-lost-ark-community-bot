import { HttpError } from '@bits_devel/api-error2';
import { logger } from '@bits_devel/logger';
import { NextFunction } from 'express';
import { HttpError as OpenApiError } from 'express-openapi-validator/dist/framework/types';
import { staticConfig } from '../../config/static-config';
import { BotApiError } from '../../models/error/bot-api-error.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { ApiResponse } from '../../models/express-extended/api-response.model';

export const apiErrorHandler = async (
    err: BotApiError | Error | OpenApiError,
    req: ApiRequest,
    res: ApiResponse,
    next: NextFunction
) => {
    try {
        logger.debug('Using apiErrorHandler');
        let apiError: BotApiError;
        if (err instanceof BotApiError) {
            apiError = err;
        } else if (err instanceof OpenApiError) {
            const httpError =
                <keyof typeof HttpError>HttpError[err ? err.status : 500] ||
                'INTERNAL_SERVER_ERROR';
            apiError = new BotApiError(httpError, httpError, err);
        } else {
            apiError = new BotApiError('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR', err);
        }

        if (apiError.status === 401 && req.cookies.jwt != null) {
            res.clearCookie('jwt', {
                httpOnly: true,
                secure: staticConfig().cookie.secure,
                sameSite: <boolean | 'lax' | 'strict' | 'none' | undefined>(
                    staticConfig().cookie.sameSite
                )
            });
        }
        logger.error(apiError);
        res.status(apiError.status).json(apiError.toPublicError());
    } catch (error: any) {
        logger.error(error);
    }
};
