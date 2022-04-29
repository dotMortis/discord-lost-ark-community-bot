import * as bcrypt from 'bcryptjs';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomFillSync } from 'crypto';
import { v4 } from 'uuid';
import { staticConfig } from '../config/static-config';

export class SecureConfig {
    static encryptValue(val: string): string {
        val = Buffer.from(val).toString('utf-8');
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-cbc', this._getsecureBuffer(), iv);
        const encrypted = Buffer.concat([cipher.update(val), cipher.final()]);
        return `${iv.toString('base64')}.${encrypted.toString('base64')}`;
    }

    static decryptValue(val: string): string {
        const [iv, hash] = val.split('.');
        const decipher = createDecipheriv(
            'aes-256-cbc',
            this._getsecureBuffer(),
            Buffer.from(iv, 'base64')
        );
        const decrpyted = Buffer.concat([
            decipher.update(Buffer.from(hash, 'base64')),
            decipher.final()
        ]);
        return decrpyted.toString('utf-8');
    }

    static generatePassword(length: number, wishlist?: string): string {
        const _wishlist =
            wishlist || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$';
        return Array.from(randomFillSync(new Uint32Array(length)))
            .map(x => _wishlist[x % _wishlist.length])
            .join('');
    }

    static generateApiKey(prefix: string): string {
        return `${prefix}_${v4().replace(/\-/g, '')}`;
    }

    static hashSecret(): Promise<string> {
        const hashConf = staticConfig().hash;
        return bcrypt.hash(hashConf.secret, hashConf.saltRounds);
    }

    static verifySecret(hash: string): boolean {
        const hashConf = staticConfig().hash;
        return bcrypt.compareSync(hashConf.secret, hash);
    }

    private static _getsecureBuffer(): Buffer {
        return Buffer.from(
            createHash('sha256').update(staticConfig().secureKey).digest('base64'),
            'base64'
        );
    }
}
