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
        || field === "title" || field === "uuid" || field === "fullname" || field === "shortname"
        || field === "number" || field === "name" || field === "address" || field === "type"
        || field === "furniture" || field === "href";
}

export function isValidMathField(field: string): boolean {
    // let str = key.split("_");
    // let field = str[1];
    return field === "avg" || field === "pass" || field === "fail"
        || field === "audit" || field === "year" || field === "lat" || field === "lon" || field === "seats";
}

export function handleRegexIS(id: any, sfield: any, input: any, data: any): any {
        let regex: RegExp = new RegExp("^" + input.split("*").join(".*") + "$");
        // Log.trace("regex: " + regex);
        let newData: any[] = [];
        // Log.trace("sfield: " + sfield);
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
            } else if (sfield === "fullname" && Object.values(i)[0].match(regex)) { // at this point we know kind=rooms
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

export function handleRoomsIS(sfield: any, input: any, dataset: any): any {
    // let newData: any[] = [];
    // for (let i of data) {
    if (sfield === "fullname" && input === Object.values(dataset)[0]) {
            // newData.push(i);
            return dataset;
        } else if (sfield === "shortname" && input === Object.values(dataset)[1]) {
            return dataset;
        } else if (sfield === "number" && input === Object.values(dataset)[2]) {
            return dataset;
        } else if (sfield === "name" && input === Object.values(dataset)[3]) {
            return dataset;
        } else if (sfield === "address" && input === Object.values(dataset)[4]) {
            return dataset;
        } else if (sfield === "type" && input === Object.values(dataset)[8]) {
            return dataset;
        } else if (sfield === "furniture" && input === Object.values(dataset)[9]) {
            return dataset;
        } else if (sfield === "href" && input === Object.values(dataset)[10]) {
            return dataset;
        } else { return new InsightError("invalid key"); }
    // }
    // return newData;
}

// export function handleRoomsIS(id: any, sfield: any, input: any, data: any): any {
//     let newData: any[] = [];
//     for (let i of data) {
//         if (isValidStringField(sfield) && input === Object.values(i)[id + sfield]) {
//             newData.push(i);
//         }
//     }
// }

export function handleRoomsMATH(op: any, mfield: any, num: any, dataset: any): any {
    if (op === "LT") {
        if (mfield === "lat" && num > Object.values(dataset)[5]) {
            return dataset;
        } else if (mfield === "lon" && num > Object.values(dataset)[6]) {
            return dataset;
        } else if (mfield === "seats" && num > Object.values(dataset)[7]) {
            return dataset;
        }
    } else if (op === "GT") {
        if (mfield === "lat" && num < Object.values(dataset)[5]) {
            return dataset;
        } else if (mfield === "lon" && num < Object.values(dataset)[6]) {
            return dataset;
        } else if (mfield === "seats" && num < Object.values(dataset)[7]) {
            return dataset;
        }
    } else if (op === "EQ") {
        if (mfield === "lat" && num === Object.values(dataset)[5]) {
            return dataset;
        } else if (mfield === "lon" && num === Object.values(dataset)[6]) {
            return dataset;
        } else if (mfield === "seats" && num === Object.values(dataset)[7]) {
            return dataset;
        }
    }
}
