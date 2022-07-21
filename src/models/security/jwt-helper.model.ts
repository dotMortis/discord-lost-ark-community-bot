import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import { staticConfig } from '../../config/static-config';

export class JWTHelper {
    static getExpiration(): number {
        return Date.now() + staticConfig().jwt.refreshTtlInMin * 60_000;
    }

    static createJwt(
        userId: string,
        username: string,
        id?: string
    ): { token: string; exp: number } {
        const rExp = this.getExpiration();
        const { jwtSecret, ttl } = staticConfig().jwt;
        if (!jwtSecret) throw new Error('Missing JWT secret');
        const token = jwt.sign({ userId, username, rExp, id: id || v4() }, jwtSecret, {
            expiresIn: ttl
        });
        const { exp }: { exp: number } = <{ [key: string]: any; exp: number }>jwt.decode(token);
        return { exp, token };
    }
}

export type TJWTPayload = {
    newToken?: string;
    currentToken: string;
    user: {
        id: string;
    };
};
