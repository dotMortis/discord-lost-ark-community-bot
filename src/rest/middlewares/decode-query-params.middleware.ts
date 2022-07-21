import { NextFunction } from 'express';
import { ApiRequest } from '../../models/express-extended/api-request.model';
import { ApiResponse } from '../../models/express-extended/api-response.model';

export const decodeQueryParams = (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
    try {
        Object.keys(req.query).forEach((key: string) => {
            const tempVal = req.query[key];
            if (tempVal instanceof Array) {
                req.query[key] = tempVal.map((val: any) => decodeURIComponent(val));
            } else {
                req.query[key] = decodeURIComponent(<string>req.query[key]);
            }
        });
    } catch (error) {
        return next(error);
    }
    next();
};
