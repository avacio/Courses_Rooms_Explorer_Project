/// MIGHT NOT BE USED
export default class Query {
    constructor(
        public WHERE: Filter, // TODO
        public OPTIONS: IQueryOptions,
    ) {}

}

export enum Filter { IS, NOT, EQ, LT, GT, AND, OR }

interface IQueryOptions {
    COLUMNS: string[];
    ORDER?: string; // ORDER IS NOT NECESSARY IN A QUERY
}

export function union(data: any[]): any[] {
    let x: any[] = data[0];
    let rsf: any[] = [];
    for (let i = 1; i < data.length; i++) {
        rsf = handleUnion(x, data[i]);
        x = rsf;
    }
    return x;
}

export function handleUnion(x: any[], rsf: any[]): any[] {
    for (let i of x ) {
        if (!rsf.includes(i, 0)) {
            rsf.push(i);
        }
    }
    return rsf;
}

export function intersect(data: any[]): any[] {
    let x: any[] = data[0];
    let rsf: any[] = [];
    for (let i = 1; i < data.length; i++) {
        rsf = handleIntersect(x, data[i]);
        x = rsf;
    }
    return x;
}

export function handleIntersect(x: any[], rsf: any[]): any[] {
    let z: any[] = [];
    for (let i of x) {
        if (rsf.includes(i, 0)) {
            z.push(i);
        }
    }
    return z;
}

// not being used
export function isValidStringField(field: string): boolean {
    // let str = key.split("_");
    // let field = str[1];
    return field === "dept" || field === "id" || field === "instructor"
        || field === "title" || field === "uuid";
}

// not being used
export function isValidMathField(field: string): boolean {
    // let str = key.split("_");
    // let field = str[1];
    return field === "avg" || field === "pass" || field === "fail"
        || field === "audit" || field === "year";
}
