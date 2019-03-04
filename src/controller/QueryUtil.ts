import Log from "../Util";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import QueryController from "./QueryController";
export * from "./QueryUtil";

export function handleNOT(qc: QueryController, filters: any): any {
    try {
        let data = qc.getData();
        let nextFilter = Object.keys(filters)[0];
        if (nextFilter !== "NOT") {
            let nextFilterData = qc.handleWHERE(filters);
            return data.filter((i: any) => !nextFilterData.includes(i));
        } else { // double-negative case
            Log.trace("double not");
            return qc.handleWHERE(filters[nextFilter]);
        }
    } catch (error) {
        throw new InsightError("handle not");
    }
}

export function handleAND(qc: QueryController, filters: any): any {
    try {
        let data: any[] = [];
        for (let filter of filters) {
            data.push(qc.handleWHERE(filter));
        }
        return intersect(data);
    } catch (error) {
        throw new InsightError("AND");
    }
}

export function handleOR(qc: QueryController, filters: any): any {
    try {
        let data: any[] = [];
        for (let filter of filters) {
            data.push(qc.handleWHERE(filter));
        }
        return union(data);
    } catch (error) {
        throw new InsightError("OR");
    }
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

export function isValidStringField(kind: InsightDatasetKind, field: string): boolean {
    if (kind === InsightDatasetKind.Courses) {
        return field === "dept" || field === "id" || field === "instructor" || field === "title" || field === "uuid";
    } else if (kind === InsightDatasetKind.Rooms) {
        return field === "fullname" || field === "shortname" || field === "number" || field === "name" ||
            field === "address" || field === "type" || field === "furniture" || field === "href";
    } else {
        return field === "dept" || field === "id" || field === "instructor" || field === "title" ||
            field === "uuid" || field === "fullname" || field === "shortname" || field === "number" ||
            field === "name" || field === "address" || field === "type" || field === "furniture" || field === "href";
    }
}

export function isValidMathField(kind: InsightDatasetKind, field: string): boolean {
    if (kind === InsightDatasetKind.Courses) {
        return field === "avg" || field === "pass" || field === "fail" || field === "audit" || field === "year";
    } else if (kind === InsightDatasetKind.Rooms) {
        return field === "lat" || field === "lon" || field === "seats";
    } else {
        return field === "avg" || field === "pass" || field === "fail" || field === "audit" ||
            field === "year" || field === "lat" || field === "lon" || field === "seats";
    }
}

export function handleRegexIS(id: any, sfield: any, input: any, data: any): any {
        let regex: RegExp = new RegExp("^" + input.split("*").join(".*") + "$");
        // Log.trace("regex: " + regex);
        let newData: any[] = [];
        for (let i of data) {
            if (sfield === "dept" && Object.values(i)[0].match(regex)) { // 0
                newData.push(i);
            } else if (sfield === "id" && Object.values(i)[1].match(regex)) { // 1
                newData.push(i);
            } else if (sfield === "instructor" && Object.values(i)[3].match(regex)) { // 3
                newData.push(i);
            } else if (sfield === "title" && Object.values(i)[4].match(regex)) { // 4
                newData.push(i);
            } else if (sfield === "uuid" && Object.values(i)[8].match(regex)) { // 8
                newData.push(i);
            } else if (sfield === "fullname" && Object.values(i)[0].match(regex)) {
                newData.push(i);
            } else if (sfield === "shortname" && Object.values(i)[1].match(regex)) {
                newData.push(i);
            } else if (sfield === "number" && Object.values(i)[2].match(regex)) {
                newData.push(i);
            } else if (sfield === "name" && Object.values(i)[3].match(regex)) {
                newData.push(i);
            } else if (sfield === "address" && Object.values(i)[4].match(regex)) {
                newData.push(i);
            } else if (sfield === "type" && Object.values(i)[8].match(regex)) {
                newData.push(i);
            } else if (sfield === "furniture" && Object.values(i)[9].match(regex)) {
                newData.push(i);
            } else if (sfield === "href" && Object.values(i)[10].match(regex)) {
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

// assumes that only relevant queried sections are in data field
// if ORDER is string then it is "UP" or "DOWN"
// if ORDER is string[] it will be a set of valid keys
// export function sortResults(data: any[], order: string | string[]): any {
export function sortResults(data: any[], order: any): any {
    const sortKeys = (typeof order === "string" ? [order] : order.keys);
    const sortDir = (typeof order === "string" ? "UP" : order.dir); // default set direction to UP

    const before = (sortDir === "UP" ? -1 : 1); // increasing order if before = -1
    const after = -before;
    data.sort((i1: any, i2: any) => {
        for (let k of sortKeys) {
            let val1 = i1[k];
            let val2 = i2[k];

            if (val1 < val2) {
                return before;
            } else if (val1 > val2) {
                return after;
            }
        }
        return 0;
    });
    return data;
}

export function handleRoomsIS(sfield: any, input: any, dataset: any[]): any[] {
    let newData: any[] = [];
    for (let i of dataset) {
        if (sfield === "fullname" && input === Object.values(i)[0]) {
            newData.push(i);
        } else if (sfield === "shortname" && input === Object.values(i)[1]) {
            newData.push(i);
        } else if (sfield === "number" && input === Object.values(i)[2]) {
            newData.push(i);
        } else if (sfield === "name" && input === Object.values(i)[3]) {
            newData.push(i);
        } else if (sfield === "address" && input === Object.values(i)[4]) {
            newData.push(i);
        } else if (sfield === "type" && input === Object.values(i)[8]) {
            newData.push(i);
        } else if (sfield === "furniture" && input === Object.values(i)[9]) {
            newData.push(i);
        } else if (sfield === "href" && input === Object.values(i)[10]) {
            newData.push(i);
        }
    }
    return newData;
}

export function handleRoomsMATH(op: any, mfield: any, num: any, dataset: any): any {
    let data: any[] = [];
    if (op === "LT") {
        for (let i of dataset) {
            if (mfield === "lat" && num > Object.values(i)[5]) {
                data.push(i);
            } else if (mfield === "lon" && num > Object.values(i)[6]) {
                data.push(i);
            } else if (mfield === "seats" && num > Object.values(i)[7]) {
                data.push(i);
            }
        }
    } else if (op === "GT") {
        for (let i of dataset) {
            if (mfield === "lat" && num < Object.values(i)[5]) {
                data.push(i);
            } else if (mfield === "lon" && num < Object.values(i)[6]) {
                data.push(i);
            } else if (mfield === "seats" && num < Object.values(i)[7]) {
                data.push(i);
            }
        }
    } else if (op === "EQ") {
        for (let i of dataset) {
            if (mfield === "lat" && num === Object.values(i)[5]) {
                data.push(i);
            } else if (mfield === "lon" && num === Object.values(i)[6]) {
                data.push(i);
            } else if (mfield === "seats" && num === Object.values(i)[7]) {
                data.push(i);
            }
        }
    }
    return data;
}

export function isValidOrder(q: any, qc: QueryController): boolean {
    const opts = q.OPTIONS;
    if (opts.ORDER) {
        if ((typeof opts.ORDER === "string" && opts.COLUMNS.indexOf(opts.ORDER) === -1)
            || Array.isArray(opts.ORDER)) {
            Log.trace("INVALID ORDER");
            return false;
        }
        if (opts.ORDER.keys && Array.isArray(opts.ORDER.keys)) {
            for (let k of opts.ORDER.keys) {
                let fields = k.split("_");
                if (fields[0] !== k) {
                    Log.trace("ORDER KEYS " + fields[1]);
                    if (opts.COLUMNS.indexOf(k) === -1 || (!isValidStringField(qc.getKind(), fields[1])
                        && !isValidMathField(qc.getKind(), fields[1]))) {
                        Log.trace("INVALID ORDER");
                        return false;
                    }
                } else {
                    if (!isValidFieldTrans(q, k)) { return false; }
                }
            }
        }
    }
    return true;
}

function isValidFieldTrans(q: any, field: string): boolean {
    if (q.TRANSFORMATIONS) {
        let i = 0;
        while (i < Object.keys(q.TRANSFORMATIONS.APPLY).length) {
            if (Object.keys(q.TRANSFORMATIONS.APPLY[i]).toString() === field) { return true; }
            i++;
        }
    }
    return false;
}

export function checkColumnsTrans(q: any, field: string): boolean {
    for (let trans of q.TRANSFORMATIONS.GROUP) {
        if (trans === field) { return true; }
    }
    let i = 0;
    while (i < Object.keys(q.TRANSFORMATIONS.APPLY).length) {
        if (Object.keys(q.TRANSFORMATIONS.APPLY[i]).toString() === field) { return true; }
        i++;
    }
    return false;
}
