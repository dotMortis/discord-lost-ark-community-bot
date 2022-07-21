import { OpenApiRequest } from 'express-openapi-validator/dist/framework/types';

export interface ApiRequest extends OpenApiRequest {
    query: any;
}
