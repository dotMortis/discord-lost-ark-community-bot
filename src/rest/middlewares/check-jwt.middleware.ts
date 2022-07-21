import { logger } from '@bits_devel/logger';
import { NextFunction } from 'express';
import passport from 'passport';
import { BotApiError } from '../../models/error/bot-api-error.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { ApiResponse } from '../../models/express-extended/api-response.model';
import { TJWTPayload } from '../../models/security/jwt-helper.model';

export const checkJwt = (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    logger.debug('Using checkJwt');

    passport.authenticate(
        'jwt',
        { session: false },
        (err: Error | BotApiError, payload: TJWTPayload) => {
            if (err || !payload) {
                res.locals.addErrorInfo(
                    err instanceof BotApiError
                        ? err
                        : new BotApiError(
                              'UNAUTHORIZED',
                              'UNAUTHORIZED',
                              err ? err : 'Missing payload'
                          )
                );
                return next(res.locals.error);
            }
            res.locals.userInfo.setInfo({
                userId: payload.user.id,
                currentToken: payload.currentToken,
                newToken: payload.newToken
            });
            next();
        }
    )(req, res, next);
};
