import { logger } from '@bits_devel/logger';
import { NextFunction } from 'express';
import passport from 'passport';
import { staticConfig } from '../../config/static-config';
import { BotApiError } from '../../models/error/bot-api-error.model';
import { ApiRequestHandler } from '../../models/express-extended/api-request-handler.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { ApiResponse } from '../../models/express-extended/api-response.model';
import { PassportController, TLoginPayload } from './passport.controller';

export class AuthController {
    static login(): ApiRequestHandler {
        return (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            logger.debug('Using AuthController -> login');

            passport.authenticate('basic', { session: false }, (err, payload: TLoginPayload) => {
                if (err || !payload) {
                    if (err) logger.error(err);
                    else logger.error('Undefined payload');
                    res.locals.addErrorInfo(
                        new BotApiError(
                            'UNAUTHORIZED',
                            'UNAUTHORIZED',
                            err ? err : 'Undefined payload'
                        )
                    );
                    next();
                } else {
                    res.locals.userInfo.setInfo({
                        userId: payload.userId,
                        currentToken: undefined,
                        newToken: payload.token
                    });
                    res.locals.addResponseInfo('User has logged in.', {});
                    next();
                }
            })(req, res, next);
        };
    }

    static logout(): ApiRequestHandler {
        return (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            logger.debug('Using AuthController -> logout');
            const { userId, newToken, currentToken } = res.locals.userInfo;
            if (!currentToken || !userId)
                throw new BotApiError('INTERNAL_SERVER_ERROR', 'INTERNAL_SERVER_ERROR');

            const delJwt = PassportController.delActiveJWT(currentToken, userId);
            if (newToken) {
                delJwt.then(_ => PassportController.delActiveJWT(newToken, userId));
            }
            delJwt.then(() => res.locals.addResponseInfo('Logged out', {}));
            res.clearCookie('jwt', {
                httpOnly: true,
                secure: staticConfig().cookie.secure,
                sameSite: <boolean | 'lax' | 'strict' | 'none' | undefined>(
                    staticConfig().cookie.sameSite
                )
            });
            delJwt.catch(error => res.locals.addErrorInfo(error)).finally(next);
        };
    }

    static authenticated(): ApiRequestHandler {
        return (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
            logger.debug('Using AuthController -> authenticated');
            res.locals.addResponseInfo('Is authenticated', {});
            next();
        };
    }
}
