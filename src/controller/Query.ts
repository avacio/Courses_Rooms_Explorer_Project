/// MIGHT NOT BE USED
import Log from "../Util";
import {InsightError} from "./IInsightFacade";

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

export function handleRegexIS(sfield: any, input: any, data: any): any {
    try {
        let regex: RegExp = new RegExp("^" + input.split("*").join(".*") + "$");
        Log.trace("regex: " + regex);
        let newData: any[] = [];
        // Log.trace("sfield: " + sfield);
        for (let i of data) {
            if (sfield === "dept" && Object.values(i)[0].match(regex)) {
                newData.push(i);
            } else if (sfield === "id" && Object.values(i)[1].match(regex)) {
                newData.push(i);
            } else if (sfield === "instructor" && Object.values(i)[3].match(regex)) {
                newData.push(i);
            } else if (sfield === "title" && Object.values(i)[4].match(regex)) {
                newData.push(i);
            } else if (sfield === "uuid" && Object.values(i)[8].match(regex)) {
                newData.push(i);
            }
        }
        return newData;
    } catch (error) {
        throw new InsightError(error.message);
    }
}
