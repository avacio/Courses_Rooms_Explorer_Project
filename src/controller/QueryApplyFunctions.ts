import Log from "../Util";
import {InsightError} from "./IInsightFacade";
import {Decimal} from "decimal.js";

export * from "./QueryApplyFunctions";

export function handleGroup(data: any[], group: any[]): any {
    let groups: any = new Map();
    let groupKeys: any = Object.values(group);
    Log.trace("group in handleGroup: " + JSON.stringify(group));
    if (groupKeys.length > 1) {
        return groupHelper(data, groupKeys);
    }
    Log.trace("groupKeys.length(): " + groupKeys.length);
    for (let i of data) {
        let keyValues: any[] = []; // maybe make map
        for (let key of groupKeys) {
            // let keyValues: any[] = [];
            keyValues.push(i[key.toString()]);
            Log.trace("keyValue: " + i[key.toString()]);
        }
        for (let val of keyValues) {
            // Log.trace("val: " + val);
            if (groups.has(val.toString())) {
                let a: any[] = groups.get(val.toString());
                // Log.trace("values already in groups*: " + JSON.stringify(a));
                a.push(i);
                // Log.trace("i: " + JSON.stringify(i));
                // Log.trace("after a.push(i): " + JSON.stringify(a));
                groups.set(val, a);
            } else if (!groups.has(val.toString())) {
                let b: any[] = [];
                b.push(i);
                groups.set(val, b);
            }
            // Log.trace("i: " + JSON.stringify(i));
            // Log.trace("group values: " + JSON.stringify(groups.get(val.toString())));
        } // idk if this will work for multiple group keys must fix!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
    // Log.trace("populated groups: " + JSON.stringify(groups));
    // Log.trace("idk what to write here: " + Object.values(groups)[0]);
    // Log.trace("idk what to write here: " + groups.get());
    let result: any[] = [];
    for (let g of groups.values()) {
        // Log.trace("g.values(): " + JSON.stringify(Object.values(g)));
        // Log.trace("sldfk: " + JSON.stringify(g));
        // result.push(g.values()); // super wrong
        result.push(Object.values(g));
        // Log.trace("this is what im adding to result: " + JSON.stringify(Object.values(g)));
        // result.push();
    }
    // Log.trace("groups: " + JSON.stringify(result));
    // Log.trace("groupsLLLL: " + Object.values(groups.values())[0]);
    return result;
}

export function groupHelper(data: any[], group: string[]): any {
    Log.trace("GROUPHELPER");
    let newGroup: any[] = [];
    Log.trace("group in group helper: " + JSON.stringify(group));
    Log.trace("group[0]: " + group[0]);
    Log.trace("group[1]: " + group[1]);
    newGroup.push(group[0]);
    let newGroup2: any[] = [];
    Log.trace("newGroup: " + JSON.stringify(newGroup));
    newGroup2.push(group[1]);
    Log.trace("newGroup2: " + JSON.stringify(newGroup2));
    let a = handleGroup(data, newGroup);
    Log.trace("a: " + JSON.stringify(a));
    return handleGroup([].concat.apply([], a), newGroup2);
}

export function handleApply(data: any[], apply: any[]): any {
    if (apply.length === 0) {
        Log.trace("empty apply, still valid");
        let result: any[] = [];
        for (let i of data) {
            result.push(i[0]);
        }
        return result;
    }
    // Log.trace("apply: " + JSON.stringify(apply)); // [{"maxSeats":{"MAX":"rooms_seats"}}]
    // let a = Object.values(apply)[0]; // first in array of apply values {"maxSeats":{"MAX":"rooms_seats"}}
    Log.trace("Object.vales(apply): " + JSON.stringify(Object.values(apply)));
    Log.trace("apply: " + JSON.stringify(apply[0]));
    let res: any[] = [];
    for (let a of apply) {
        let applyKey = Object.keys(a); // maxSeats
        Log.trace("in apply: " + JSON.stringify(a));
        Log.trace("should be maxSeats: " + applyKey);
        let t = Object.values(a)[0]; // inside maxSeats {"MAX":"rooms_seats"}
        let token = Object.keys(t)[0]; // MAX
        Log.trace("in maxSeats: " + JSON.stringify(t));
        Log.trace("should be MAX: " + token);
        let key = Object.values(t)[0]; // rooms_seats
        Log.trace("should be rooms_seats: " + key);
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
    Log.trace("WE IN MAX");
    // Log.trace("groups: " + JSON.stringify(data));
    for (let group of data) {
        let max: number = 0;
        // Log.trace("group: " + group);
        // Log.trace("group2: " + group[key.toString()]);
        for (let section of group) {
            Log.trace("section: " + JSON.stringify(section));
            Log.trace("section2: " + Object.values(section)[0][key.toString()]);
            if (section[key.toString()] > max) { // Object.values(section)[0][key.toString()
                max = section[key.toString()]; // Object.values(section)[0][key.toString()
            }
        }
        // group.push(applyKey + ":" + max);
        Log.trace("max: " + max);
        Log.trace("each group: " + JSON.stringify(group));
        for (let s of group) {
            // max = Math.round(max * 100) / 100;
            s[applyKey] = max;
            // Log.trace("s: " + JSON.stringify(s));
        }
        // Log.trace("each group: " + JSON.stringify(group));
    }
    // return data;
    // Log.trace("what gets passed to organize res: " + JSON.stringify(data));
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
    }
    Log.trace("max result: " + JSON.stringify(result));
    return result;
}

export function handleMIN(data: any, key: any, applyKey: any): any {
    for (let group of data) {
        let min: number = Number.MAX_VALUE;
        for (let section of group) {
            if (section[key.toString()] < min) {
                min = section[key.toString()];
            }
        }
        for (let s of group) {
            // min = Math.round(min * 100) / 100;
            s[applyKey] = min;
        }
    }
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
        // result = i[0];
    }
    Log.trace("min result: " + JSON.stringify(result));
    return result;
}

export function handleAVG(data: any, key: any, applyKey: any): any {
    for (let group of data) {
        // let sum: number = 0;
        let sum = new Decimal(0);
        // let count: number = 0;
        let count = new Decimal(0);
        for (let section of group) {
            // sum += section[key.toString()];
            let val = new Decimal(section[key.toString()]);
            sum = Decimal.add(sum, val);
            // count++;
            // let one = new Decimal(1);
            // count.add(1);
            count = Decimal.add(count, 1);
        }
        let avg: number = sum.toNumber() / count.toNumber();
        for (let s of group) {
            // avg = Math.round(avg * 100) / 100;
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
        // let sum = 0;
        let sum = new Decimal(0);
        for (let section of group) {
            // sum += section[key.toString()];
            let val = new Decimal(section[key.toString()]);
            sum = Decimal.add(sum, val);
        }
        for (let s of group) {
            // sum = Math.round(sum * 100) / 100;
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
        // let count: number = 0;
        let count = new Decimal(0);
        for (let section of group) {
            if (section[key.toString()]) {
                // count++;
                // let one = new Decimal(1);
                // count.add(1);
                count = Decimal.add(count, 1);
            }
        }
        for (let s of group) {
            s[applyKey] = count.toNumber();
        }
    }
    let result: any[] = [];
    for (let i of data) {
        result.push(i[0]);
    }
    return result;
}
