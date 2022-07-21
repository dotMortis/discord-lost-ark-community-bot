import { fromDataStore, IDeSerializable, serialize } from '@bits_devel/de-serializer';
import { chunk } from 'lodash';
import { BotApiError } from '../../../models/error/bot-api-error.model';
import { Locals } from '../../../models/express-extended/api-response.model';
import { RequestResponseFilter } from '../../../models/security/request-response-filter.model';

export abstract class CommonController<T extends IT & IDeSerializable<T, IT>, IT> {
    constructor(private type?: new () => T & IT & IDeSerializable<T, IT>) {}

    //#region getOne
    getOneResponse(
        message: string,
        locals: Locals,
        dataCB: () => Promise<IT | null>
    ): Promise<Locals> {
        return dataCB()
            .then(async (result: IT | null) => {
                if (result == null) throw new BotApiError('NOT_FOUND', 'RESOURCE_NOT_FOUND');
                if (!this.type) {
                    throw new BotApiError(
                        'INTERNAL_SERVER_ERROR',
                        'INTERNAL_SERVER_ERROR',
                        'Unkown type in common controller'
                    );
                }
                return fromDataStore<T, IT>(this.type, result);
            })
            .then((result: T) => serialize<T, IT>(<new () => T>this.type, result))
            .then((result: Partial<IT>) => {
                const responseBody = new RequestResponseFilter().filterResponseRequest(
                    result,
                    locals.path,
                    locals.method,
                    'response',
                    false
                );
                locals.addResponseInfo(message, responseBody);
            })
            .catch((error: Error | BotApiError) => {
                if (error instanceof BotApiError) {
                    locals.addErrorInfo(error);
                } else {
                    const apiError = new BotApiError('BAD_REQUEST', 'BAD_REQUEST', error);
                    locals.addErrorInfo(apiError);
                }
            })
            .then(_ => locals);
    }

    getCustomResponse(
        message: string,
        locals: Locals,
        dataCB: () => Promise<any>
    ): Promise<Locals> {
        return dataCB()
            .then(async (result: any) => {
                if (result == null) throw new BotApiError('NOT_FOUND', 'RESOURCE_NOT_FOUND');
                return result;
            })
            .then((result: any) => {
                const responseBody = new RequestResponseFilter().filterResponseRequest(
                    result,
                    locals.path,
                    locals.method,
                    'response',
                    false
                );
                locals.addResponseInfo(message, responseBody);
            })
            .catch((error: Error | BotApiError) => {
                if (error instanceof BotApiError) {
                    locals.addErrorInfo(error);
                } else {
                    locals.addErrorInfo(new BotApiError('BAD_REQUEST', 'BAD_REQUEST', error));
                }
            })
            .then(_ => locals);
    }
    //#endregion

    //#region list All
    getPaginatedResponse(
        message: string,
        locals: Locals,
        dataCB: () => Promise<[IT[], number]>
    ): Promise<Locals> {
        return dataCB()
            .then(async (result: [Partial<IT>[], number]) => {
                const dataChunks = chunk(result[0].slice(), 100);
                result[0].length = 0;
                for (const chunk of dataChunks) {
                    result[0].push(
                        ...(await Promise.all(
                            chunk.map((data: Partial<IT>) => {
                                if (!this.type) {
                                    throw new BotApiError(
                                        'INTERNAL_SERVER_ERROR',
                                        'INTERNAL_SERVER_ERROR',
                                        'Unkown type in common controller'
                                    );
                                }
                                return fromDataStore<T, IT>(this.type, data).then((result: T) =>
                                    serialize<T, IT>(<new () => T>this.type, result)
                                );
                            })
                        ))
                    );
                }
                return [result[0], result[1]];
            })
            .then(result => {
                const responseBody = new RequestResponseFilter().filterResponseRequest(
                    result,
                    locals.path,
                    locals.method,
                    'response',
                    true
                );
                locals.addResponseInfo(message, responseBody);
            })
            .catch((error: Error | BotApiError) => {
                if (error instanceof BotApiError) {
                    locals.addErrorInfo(error);
                } else {
                    locals.addErrorInfo(new BotApiError('BAD_REQUEST', 'BAD_REQUEST', error));
                }
            })
            .then(_ => locals);
    }

    getListResponse(
        message: string,
        locals: Locals,
        dataCB: () => Promise<{ [P in keyof IT]?: IT[P] }[]>
    ): Promise<Locals> {
        return dataCB()
            .then(async (result: { [P in keyof IT]?: IT[P] }[]) => {
                const dataChunks = chunk(result.slice(), 100);
                result.length = 0;
                for (const chunk of dataChunks) {
                    result.push(
                        ...(await Promise.all(
                            chunk.map(data => {
                                if (!this.type) {
                                    throw new BotApiError(
                                        'INTERNAL_SERVER_ERROR',
                                        'INTERNAL_SERVER_ERROR',
                                        'Unkown type in common controller'
                                    );
                                }
                                return fromDataStore<T, IT>(this.type, data);
                            })
                        ))
                    );
                }
                return result;
            })
            .then((result: { [P in keyof IT]?: IT[P] }[]) => {
                const responseBody = new RequestResponseFilter().filterResponseRequest(
                    result,
                    locals.path,
                    locals.method,
                    'response',
                    false
                );
                locals.addResponseInfo(message, responseBody);
            })
            .catch((error: Error | BotApiError) => {
                if (error instanceof BotApiError) {
                    locals.addErrorInfo(error);
                } else {
                    locals.addErrorInfo(new BotApiError('BAD_REQUEST', 'BAD_REQUEST', error));
                }
            })
            .then(_ => locals);
    }
    //#endregion

    //#region create
    getSingleCreateResponse(
        message: string,
        locals: Locals,
        dataCB: () => Promise<IT>
    ): Promise<Locals> {
        return dataCB()
            .then((result: IT) => {
                if ('id' in result) {
                    locals.addResponseInfo(message, { id: (<any>result).id });
                } else if ('uid' in result) {
                    locals.addResponseInfo(message, { id: (<any>result).uid });
                }
            })
            .catch((error: Error | BotApiError) => {
                if (error instanceof BotApiError) {
                    locals.addErrorInfo(error);
                } else {
                    locals.addErrorInfo(new BotApiError('BAD_REQUEST', 'BAD_REQUEST', error));
                }
            })
            .then(_ => locals);
    }

    getMultiCreateResponse(
        message: string,
        locals: Locals,
        dataCB: () => Promise<{ count: number }>
    ): Promise<Locals> {
        return dataCB()
            .then((result: { count: number }) => {
                locals.addResponseInfo(message, { count: result?.count || 0 });
            })
            .catch((error: Error | BotApiError) => {
                if (error instanceof BotApiError) {
                    locals.addErrorInfo(error);
                } else {
                    locals.addErrorInfo(new BotApiError('BAD_REQUEST', 'BAD_REQUEST', error));
                }
            })
            .then(_ => locals);
    }
    //#endregion

    //#region edit
    getNoneResponse(message: string, locals: Locals, dataCB: () => Promise<void>): Promise<Locals> {
        return dataCB()
            .then(_ => {
                locals.addResponseInfo(message, undefined);
            })
            .catch((error: Error | BotApiError) => {
                if (error instanceof BotApiError) {
                    locals.addErrorInfo(error);
                } else {
                    locals.addErrorInfo(new BotApiError('BAD_REQUEST', 'BAD_REQUEST', error));
                }
            })
            .then(_ => locals);
    }
    //#endregion
}
