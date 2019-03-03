import Log from "../Util";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {handleAVG, handleCOUNT, handleMAX, handleMIN, handleSUM} from "./QueryApplyFunctions";
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
        // Log.trace("sfield: " + sfield);
        // let ds = data[1];
        // Log.trace(Object.values(ds)[1]);
        // Log.trace(Object.keys(ds)[1]);
        // Log.trace(ds["courses_id"]);
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
    // if sorted by keys, automatically set direction to UP
    const sortDir = (typeof order === "string" ? "UP" : order.dir);

    // increasing order if before = -1
    const before = (sortDir === "UP" ? -1 : 1);
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

export function handleGroup(data: any[], group: string[]): any {
    let groups: any = new Map();
    let groupKeys: any = Object.values(group);
    Log.trace("asldfjklakdsjfla");
    Log.trace(groupKeys);
    // let groups: Map<any, any[]>;
    for (let i of data) {
        let keyValues: any[] = []; // maybe make map
        for (let key of groupKeys) {
            // let keyValues: any[] = [];
            keyValues.push(i[key.toString()]);
        }
        for (let val of keyValues) {
            if (groups.has(val.toString())) {
                let a: any[] = groups.get(val.toString());
                a.push(i);
                groups.set(val, a);
            } else if (!groups.has(val.toString())) {
                let b: any[] = [];
                b.push(i);
                groups.set(val, b);
            }
        } // idk if this will work for multiple group keys must fix!!
    }
    let result: any[] = [];
    for (let g of groups) {
        result.push(group.values());
    }
    return result;
}
export function handleApply(data: any, apply: any, groupKeys: any[]): any {
    let applyKey = Object.keys(data)[0]; // eg overallAVG
    let token = Object.keys(applyKey)[0]; // eg AVG
    let key = Object.values(applyKey)[0]; // eg courses_avg
    if (token === "MAX") {
        return handleMAX(data, key, applyKey);
    } else if (token === "MIN") {
        return handleMIN(data, key, applyKey);
    } else if (token === "AVG") {
        return handleAVG(data, key, applyKey);
    } else if (token === "SUM") {
        return handleSUM(data, key, applyKey);
    } else if (token === "COUNT") {
        return handleCOUNT(data, key, applyKey);
    }
}
