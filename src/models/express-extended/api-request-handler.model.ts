import { NextFunction } from 'express';
import { ApiRequest } from './api-request.model';
import { ApiResponse } from './api-response.model';

export type ApiRequestHandler = (
    apiRequest: ApiRequest,
    apiResponse: ApiResponse,
    next: NextFunction
) => void;
