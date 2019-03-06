import Log from "../Util";
import {InsightError} from "./IInsightFacade";
import {Decimal} from "decimal.js";

export * from "./QueryApplyFunctions";

export function handleGroup(data: any[], group: any[]): any {
    let groups: any = new Map();
    let groupKeys: any = Object.values(group);
    if (groupKeys.length > 1) {
        return groupHelper(data, groupKeys);
    }
    for (let i of data) {
        let keyValues: any[] = [];
        for (let key of groupKeys) {
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
        }
    }
    let result: any[] = [];
    for (let g of groups.values()) {
        result.push(Object.values(g));
    }
    return result;
}

export function groupHelper(data: any[], group: string[]): any {
    let newGroup: any[] = [];
    newGroup.push(group[0]);
    let newGroup2: any[] = [];
    newGroup2.push(group[1]);
    let a = handleGroup(data, newGroup);
    return handleGroup([].concat.apply([], a), newGroup2);
}

export function handleApply(data: any[], apply: any[]): any {
    if (apply.length === 0) {
        let result: any[] = [];
        for (let i of data) {
            result.push(i[0]);
        }
        return result;
    }
    let res: any[] = [];
    for (let a of apply) {
        let applyKey = Object.keys(a); // maxSeats
        let t = Object.values(a)[0]; // inside maxSeats {"MAX":"rooms_seats"}
        let token = Object.keys(t)[0]; // MAX
        let key = Object.values(t)[0]; // rooms_seats
        if (token === "MAX") {
            res = handleMAX(data, key, applyKey);
        } else if (token === "MIN") {
            res = handleMIN(data, key, applyKey);
        } else if (token === "AVG") {
            res = handleAVG(data, key, applyKey);
        } else if (token === "SUM") {
            res = handleSUM(data, key, applyKey);
        } else if (token === "COUNT") {
            res = handleCOUNT(data, key, applyKey);
        } else {
            return new InsightError("invalid apply token");
        }
    }
    return res;
}

export function handleMAX(data: any, key: any, applyKey: any): any {
    for (let group of data) {
        let max: number = 0;
        for (let section of group) {
            if (section[key.toString()] > max) {
                max = section[key.toString()];
            }
        }
        for (let s of group) {
            s[applyKey] = max;
        }
    }
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
    }
    Log.trace("max result: " + JSON.stringify(result));
    return result;
}

export function handleMIN(data: any, key: any, applyKey: any): any {
    for (let group of data) {
        let min: number = Number.MAX_SAFE_INTEGER;
        for (let section of group) {
            if (section[key.toString()] < min) {
                min = section[key.toString()];
            }
        }
        for (let s of group) {
            s[applyKey] = min;
        }
    }
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
    }
    Log.trace("min result: " + JSON.stringify(result));
    return result;
}

export function handleAVG(data: any, key: any, applyKey: any): any {
    for (let group of data) {
        let sum = new Decimal(0);
        let count = new Decimal(0);
        for (let section of group) {
            let val = new Decimal(section[key.toString()]);
            sum = Decimal.add(sum, val);
            count = Decimal.add(count, 1);
        }
        let avg: number = sum.toNumber() / count.toNumber();
        for (let s of group) {
            avg = Number(avg.toFixed(2));
            s[applyKey] = avg;
        }
    }
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
    }
    return result;
}

export function handleSUM(data: any, key: any, applyKey: any): any {
    for (let group of data) {
        let sum = new Decimal(0);
        for (let section of group) {
            sum = sum.add(section[key.toString()]);
        }
        for (let s of group) {
            let totalSum = sum.toNumber();
            s[applyKey] = Number(totalSum.toFixed(2));
        }
    }
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
    }
    return result;
}

export function handleCOUNT(data: any, key: any, applyKey: any): any {
    for (let group of data) {
        let keyValues: any[] = [];
        for (let section of group) {
            keyValues.push(section[key.toString()]);
        }
        let unique: any[] = keyValues.filter((val, i, arr) => arr.indexOf(val) === i);
        for (let s of group) {
            s[applyKey] = unique.length;
        }
    }
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
    }
    return result;
}
