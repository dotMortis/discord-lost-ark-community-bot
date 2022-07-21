import { NextFunction, Response } from 'express';
import { ApiRequestHandler } from '../../models/express-extended/api-request-handler.model';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { Locals } from '../../models/express-extended/api-response.model';

export const initExpress: ApiRequestHandler = (
    request: ApiRequest,
    response: Response,
    next: NextFunction
): void => {
    response.locals = new Locals(request);
    next();
};
