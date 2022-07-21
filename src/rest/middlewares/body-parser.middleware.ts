import { json, NextFunction, Request, Response } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
    return json()(req, res, next);
};
