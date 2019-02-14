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

    public addDataset(id: string, content: any[], kind: InsightDatasetKind) {
        Log.trace("CONTENT LENGTH " + content.length.toString());
        this.data.set(id, content);
        this.insightData.set(id, {id, kind, numRows: content.length});

        this.writeToCache(id);
    }

    public removeDataset(id: string) {
        this.data.delete(id);
        this.insightData.delete(id);
        fs.removeSync(path + "/" + id + ".json");    // remove from cache as well
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
// HELPERS

export function checkParsed(j: any): any { // TODO: being used?
    try {
        j = JSON.parse(j);
    } catch (error) {
        Log.error("ERROR CAUGHT");
        return null;
    }
    if (j && j.result && j.result.toString() !== "") { return j; }
    return null;
}
