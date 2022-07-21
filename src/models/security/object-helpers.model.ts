export class ObjectHelpers {
    filterNested(raw: any, filter: string[]): any;
    filterNested(raw: any, filter: string[], nestedObject: string): any;
    filterNested(raw: any, filter: string[], nestedObject?: string): any {
        if (raw instanceof Array) {
            return raw.map((item: any) => this.filterNested(item, filter));
        }
        const anyKey = nestedObject ? nestedObject + '.' + '__any' : '__any';
        if (filter.includes(anyKey)) {
            return raw;
        }
        return Object.keys(raw)
            .filter((key: string) => {
                const tempKey = nestedObject ? nestedObject + '.' + key : key;
                return filter.includes(tempKey);
            })
            .reduce((obj: any, key: string) => {
                if (raw[key] instanceof Array) {
                    const tempKey = nestedObject ? nestedObject + '.' + key : key;
                    obj[key] = new Array<any>();
                    raw[key].map((item: any) => {
                        if (item instanceof Object) {
                            const tempOpject = this.filterNested(item, filter, tempKey);
                            if (Object.keys(tempOpject).length > 0) obj[key].push(tempOpject);
                        } else {
                            obj[key].push(item);
                        }
                    });
                } else if (raw[key] instanceof Object) {
                    const tempKey = nestedObject ? nestedObject + '.' + key : key;
                    const tempOpject = this.filterNested(raw[key], filter, tempKey);
                    obj[key] = tempOpject;
                } else {
                    obj[key] = raw[key];
                }
                return obj;
            }, {});
    }

    filter(raw: any, filter: string[]): any {
        return Object.keys(raw)
            .filter((key: string) => filter.includes(key))
            .reduce((obj: any, key: string) => {
                if (raw[key] instanceof Array) {
                    obj[key] = new Array<any>();
                    raw[key].map((item: any) => {
                        obj[key].push(item);
                    });
                } else {
                    obj[key] = raw[key];
                }
                return obj;
            }, {});
    }

    filterByObjectNested(raw: any, filter: any): any {
        if (raw instanceof Array) {
            return raw.map((item: any) => this.filterByObjectNested(item, filter));
        }
        const filterKeys = filter ? Object.keys(filter) : [];
        return Object.keys(raw)
            .filter(key => filterKeys.includes(key))
            .reduce((obj: any, key: string) => {
                if (raw[key] instanceof Array) {
                    obj[key] = new Array();
                    raw[key].map((item: any) => {
                        obj[key].push(this.filterByObjectNested(item, filter[key]));
                    });
                } else if (raw[key] instanceof Object) {
                    obj[key] = raw[key] ? this.filterByObjectNested(raw[key], filter[key]) : null;
                } else {
                    obj[key] = raw[key];
                }
                return obj;
            }, {});
    }

    removeEmptyFields(raw: any, removeNull = false): void {
        Object.entries(raw).forEach(([key, val]) => {
            if (val && typeof val === 'object') this.removeEmptyFields(val, removeNull);
            else if (val === undefined || (removeNull && val === null)) delete raw[key];
        });
    }

    filterPagination(query: any): { skip: number; take: number } {
        let { skip, limit: take = 100 } = query;
        if (take > 100) take = 100;
        return { skip, take };
    }
}
