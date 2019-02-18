import Log from "../Util";
import {InsightError} from "./IInsightFacade";
export * from "./QueryUtil";

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

export function isValidStringField(field: string): boolean {
    // let str = key.split("_");
    // let field = str[1];
    return field === "dept" || field === "id" || field === "instructor"
        || field === "title" || field === "uuid";
}

export function isValidMathField(field: string): boolean {
    // let str = key.split("_");
    // let field = str[1];
    return field === "avg" || field === "pass" || field === "fail"
        || field === "audit" || field === "year";
}

export function handleRegexIS(sfield: any, input: any, data: any): any {
        let regex: RegExp = new RegExp("^" + input.split("*").join(".*") + "$");
        // Log.trace("regex: " + regex);
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
}

// will put data in relevant columns
export function organizeResults(data: any[], columns: string[]): any[] {
    return [].slice.call(data).map((i: any) => filterObjectFields(i, columns));
}

// makes one line with given column keys
export function filterObjectFields(obj: {[key: string]: any}, keys: string[]): {[key: string]: any} {
    const filtered: {[key: string]: any} = {};
    for (let k of keys) {
        filtered[k] = obj[k];
    }
    return filtered;
}

// assumes that only relevant queried sections are in data field, and that order is valid string
export function sortResults(data: any[], order: string): any {
    // increasing order
    const before = -1;
    const after = -before;
    // if (order !== "") {
    data.sort((i1: any, i2: any) => {
        let val1 = i1[order];
        let val2 = i2[order];

        if (val1 < val2) {
            return before;
        } else if (val1 > val2) {
            return after;
        }
        return 0;
    });
    // }
    return data;
}
