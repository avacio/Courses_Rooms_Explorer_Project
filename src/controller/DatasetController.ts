import Log from "../Util";
import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import * as fs from "fs-extra"; // * = modules

/**
 * Helper class to help parse and control datasets
 *
 */
// BELOW IS FROM IINSIGHT
// export interface InsightDataset {
//     id: string;
//     kind: InsightDatasetKind;
//     numRows: number;
// }
const path = __dirname + "/../../data/";
export default class DatasetController {
    private data: Map<string, any[]>;
    private insightData: Map<string, InsightDataset>;

    // constructor(private cache = false) {
    constructor() {
        Log.trace("DatasetController constuctor");
        // this.data = new Map<string, any[]>(this.checkCache());
        this.data = new Map<string, any[]>();
        this.insightData = new Map<string, InsightDataset>();
    }

    // private checkCache() { // unused because reading from internal data structure, not from disk
    //     if (this.cache && fs.existsSync(path)) {
    //         return JSON.parse(fs.readFileSync(path).toString());
    //     } else { return []; }
    // }

    // returns false if id is null
    public addDataset(id: string, content: any[], kind: InsightDatasetKind) {
        Log.trace("CONTENT LENGTH " + content.length.toString());
        this.data.set(id, content);
        this.insightData.set(id, {id, kind, numRows: content.length});

        this.writeToCache(id);
    }

    public removeDataset(id: string) {
        this.data.delete(id);
        this.insightData.delete(id);
        fs.removeSync(path + "/" + id + ".json");    // remove from cache as well TODO
        return true;
    }

    public getDataset(id: string): any[] {
        return this.data.get(id);
    }

    public containsDataset(id: string): boolean {
        return this.data.has(id);
    }

    public getAllDataKeys(): string[] {
        let r = [];
        for (let key of Array.from( this.data.keys()) ) { r.push(key); }
        return r;
    }

    private writeToCache(id: string) {
        const entries: any[] = [];
        this.data.forEach(async function (value, key) { // needs to be async or no?
            entries.push(value);
        });
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        fs.writeFileSync(path + "/" + id + ".json", JSON.stringify(entries)); // TODO
        Log.trace("WRITE TO CACHE!!! " + path + "/" + id + ".json");
    }

    public listDatasets(): InsightDataset[] {
        return Array.from(this.insightData.values());
    }
}
//////////////////
// HELPER

export function checkParsed(j: any): any { // TODO: being used?
    // if (typeof j !== "string") { j = JSON.stringify((j)); }
    try {
        j = JSON.parse(j);
    } catch (error) {
        Log.error("ERROR CAUGHT");
        return null;
    }
    if (j && j.result && j.result.toString() !== "") { return j; }
    return null;
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
