import { logger } from '@bits_devel/logger';
import { redisCache } from '@bits_devel/redis-cache';
import passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy } from 'passport-jwt';
import { staticConfig } from '../../config/static-config';
import { BotApiError } from '../../models/error/bot-api-error.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { JWTHelper, TJWTPayload } from '../../models/security/jwt-helper.model';

export class PassportController {
    initialize() {
        passport.use('basic', this.getBasicStrategy());
        passport.use('jwt', this.getJwtStrategy());
        return passport.initialize();
    }

    getBasicStrategy() {
        return new BasicStrategy(async (username, password, done) => {
            try {
                if (username === 'admin' && password === 'admin') {
                    const { token, exp } = JWTHelper.createJwt('1234', username);
                    const loginPayload: TLoginPayload = { userId: '1234', token };
                    return PassportController.newActiveJWT(token, '1234', exp).then(_ =>
                        done(undefined, loginPayload)
                    );
                } else throw new BotApiError('UNAUTHORIZED', 'UNAUTHORIZED');
            } catch (error) {
                done(error);
            }
        });
    }

    getJwtStrategy() {
        const opts = {
            jwtFromRequest: (req: ApiRequest) => req.cookies.jwt,
            secretOrKey: staticConfig().jwt.jwtSecret,
            passReqToCallback: true
        };

        return new Strategy(
            opts,
            async (
                request: ApiRequest,
                jwt_payload: { userId: string; username: string; rExp: number; id: string },
                done: (error?: Error, result?: any) => void
            ) => {
                try {
                    logger.debug('Using PassportController -> getRefreshJwtStrategy');
                    const token = request.cookies.jwt;
                    const { userId, username, rExp, id } = jwt_payload;
                    if (!(userId && username)) {
                        return done(new BotApiError('UNAUTHORIZED', 'UNAUTHORIZED'));
                    }

                    const isActive = await redisCache(staticConfig().redis.prefix).getData(
                        `jwt_${userId}`,
                        token
                    );
                    if (!isActive) throw new BotApiError('UNAUTHORIZED', 'UNAUTHORIZED');

                    const newJwtPayload: TJWTPayload = {
                        user: {
                            id: userId
                        },
                        currentToken: token,
                        newToken: undefined
                    };

                    if (rExp <= Date.now()) {
                        const { token: newToken, exp } = JWTHelper.createJwt(userId, username, id);
                        newJwtPayload.newToken = newToken;
                        await PassportController.newActiveJWT(newToken, userId, exp);
                    }
                    done(undefined, newJwtPayload);
                } catch (error: any) {
                    done(error);
                }
            }
        );
    }

    public static newActiveJWT(token: string, userId: string, exp: number) {
        return redisCache(staticConfig().redis.prefix).setData(
            `jwt_${userId}`,
            token,
            exp * 1_000,
            1
        );
    }

    public static delActiveJWT(token: string, userId: string) {
        return redisCache(staticConfig().redis.prefix).delData(`jwt_${userId}`, token);
    }
}

export type TLoginPayload = {
    token: string;
    userId: string;
};
