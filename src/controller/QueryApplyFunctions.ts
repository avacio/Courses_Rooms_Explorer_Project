import Log from "../Util";
export * from "./QueryApplyFunctions";

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
export function handleApply(data: any, apply: any): any {
    let applyKey = Object.keys(data)[0]; // eg overallAVG
    let token = Object.keys(applyKey)[0]; // eg AVG
    let key = Object.values(applyKey)[0]; // eg courses_avg
    if (token === "MAX") {
        return handleMAX(data, key);
    } else if (token === "MIN") {
        return handleMIN(data, key);
    } else if (token === "AVG") {
        return handleAVG(data, key);
    } else if (token === "SUM") {
        return handleSUM(data, key);
    } else if (token === "COUNT") {
        return handleCOUNT(data, key);
    }
}

export function handleMAX(data: any, key: any): any {
    for (let group of data) {
        let max: number = 0;
        for (let section of group) {
            if (section[key.toString()] > max) {
                max = section[key.toString()];
            }
        }
    }
}

export function handleMIN(data: any, key: any): any {
    for (let group of data) {
        let min: number = Number.MAX_VALUE;
        for (let section of group) {
            if (section[key.toString()] < min) {
                min = section[key.toString()];
            }
        }
    }
}

export function handleAVG(data: any, key: any): any {
    for (let group of data) {
        let sum: number = 0;
        let count: number = 0;
        for (let section of group) {
            sum += section[key.toString()];
            count++;
        }
        let avg: number = sum / count;
    }
}

export function handleSUM(data: any, key: any): any {
    for (let group of data) {
        let sum = 0;
        for (let section of group) {
            sum += section[key.toString()];
        }
    }
}

export function handleCOUNT(data: any, key: any): any {
    for (let group of data) {
        let count: number = 0;
        for (let section of group) {
            if (section[key.toString()]) {
                count++;
            }
        }
    }
}
