import { logger } from '@bits_devel/logger';
import { HttpMethod } from '@bits_devel/swaggerhub-parser2';
import { Rest } from '../../rest/rest';
import { ObjectHelpers } from './object-helpers.model';

export class RequestResponseFilter extends ObjectHelpers {
    constructor() {
        super();
    }

    filterResponseRequest(
        obj: any,
        path: string,
        method: HttpMethod,
        resReq: 'response' | 'request'
    ): any;
    filterResponseRequest(
        obj: any,
        path: string,
        method: HttpMethod,
        resReq: 'response' | 'request',
        isPageniated: boolean
    ): any;
    filterResponseRequest(
        obj: any,
        path: string,
        method: HttpMethod,
        resReq: 'response' | 'request',
        isPageniated: boolean,
        removeNull: boolean
    ): any;
    filterResponseRequest(
        obj: any,
        path: string,
        method: HttpMethod,
        resReq: 'response' | 'request',
        isPageniated = false,
        removeNull = false
    ): any {
        logger.debug('Using ObjectHelpers -> filterResponseRequest');
        const allowedFields = new Array<string>();
        allowedFields.push(
            ...(Rest.swaggerParser.getAllowedFields(path.replace('/v1', ''), method, resReq) || [])
        );

        let tempObj;
        if (obj) {
            if (isPageniated) {
                tempObj = { count: 0, data: [] };
                tempObj.count = obj[1];
                tempObj.data = obj[0];
            } else {
                tempObj = obj;
            }

            tempObj = this.filterNested(tempObj, allowedFields);
            if (resReq === 'request' || removeNull) {
                this.removeEmptyFields(tempObj, removeNull);
            }
        }

        return tempObj;
    }
}
