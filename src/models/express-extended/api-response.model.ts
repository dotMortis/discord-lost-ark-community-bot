import { HttpMethod } from '@bits_devel/swaggerhub-parser2';
import { Response } from 'express';
import { OpenApiRequestMetadata } from 'express-openapi-validator/dist/framework/types';
import { BotApiError } from '../error/bot-api-error.model';
import { ApiRequest } from './api-request.model';

export interface ApiResponse extends Response<any, Locals> {}

export interface IUserInfo {
    userId?: string;
    currentToken?: string;
    newToken?: string;
}

export class UserInfo implements IUserInfo {
    userId?: string;
    currentToken?: string;
    newToken?: string;

    constructor() {
        this.userId = undefined;
        this.currentToken = undefined;
        this.newToken = undefined;
    }

    setInfo(info: { userId?: string; currentToken?: string; newToken?: string }): void {
        this.userId = info.userId;
        this.currentToken = info.currentToken;
        this.newToken = info.newToken;
    }
}

export interface ILocals {
    userInfo: UserInfo;
    path: string;
    method: HttpMethod;
    message?: string;
    response: any;
    error?: BotApiError;
}

export class Locals implements ILocals {
    public userInfo: UserInfo;
    public path: string;
    public method: HttpMethod;
    public message?: string;
    public response: any;
    public error?: BotApiError;

    constructor(openapiRequest: ApiRequest) {
        const metadata = <OpenApiRequestMetadata>openapiRequest?.openapi;
        this.path = metadata?.openApiRoute;
        this.method = HttpMethod[<keyof typeof HttpMethod>openapiRequest.method.toLowerCase()];
        this.userInfo = new UserInfo();
    }

    addResponseInfo(message: string, response: any) {
        this.message = message;
        this.response = response;
    }

    addErrorInfo(error: BotApiError) {
        this.error = error;
    }
}
