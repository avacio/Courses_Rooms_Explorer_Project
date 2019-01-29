import Log from "../Util";
import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import * as fs from "fs";

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

    constructor(private cache = false) {
        Log.trace("DatasetController constuctor");
        // Log.trace("path   " + path);
        this.data = new Map<string, any[]>(this.checkCache());
        // this.data = new Map<string, any[]>();
    }

    private checkCache() {
        if (this.cache && fs.existsSync(path)) {
            return JSON.parse(fs.readFileSync(path).toString());
        } else { return []; }
    }

    public clearCache() {
        if (fs.existsSync(path)) { fs.unlinkSync(path); }
    }

    // returns false if id is null
    public addDataset(id: string, content: any[]): boolean {
        // if (this.data.containsDataset(id)) {
        // Log.trace("add ds in dc.ts : " + id);
        if (id != null && content != null) {
        // if (id != null && content != null && !this.containsDataset(id)) {
            this.data.set(id, content);

            this.writeToCache(id);
            // if (this.cache) { this.writeToCache(); }
            return true;
        }
        return false;
    }

    // returns false if id is null
    public removeDataset(id: string): boolean {
        // if (this.data.containsDataset(id)) {
        if (id != null) {
            this.data.delete(id);
            return true;
        }
        return false;
    }

    public containsDataset(id: string): boolean {
        return this.data.has(id);
    }

    public getDataset(id: string): any[] {
        return this.data.get(id);
    }

    public entryCount(): number {
        return this.data.size;
    }

    public printAllKeys() {
        // return this.data.keys();
        // this.data.forEach((value: boolean, key: string) => {
        //     Log.trace(key);
        // });

        for (let key of Array.from( this.data.keys()) ) { Log.trace("PRINTKEYS: " + key); }
    }

    private writeToCache(id: string) {
    // private writeToCache() {
        const entries: any[] = [];
        this.data.forEach(async function (value, key) { // needs to be async or no?
            // entries.push([key, value]);
            entries.push(value);
        });
        // fs.writeFileSync( __dirname + "/" + id + ".json", JSON.stringify(entries)); // TODO
        // fs.writeFileSync( path, JSON.stringify(entries)); // TODO
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        // fs.writeFileSync(path + "/" + id + ".json", JSON.stringify(arrayFlat(entries))); // TODO
        fs.writeFileSync(path + "/" + id + ".json", JSON.stringify(entries)); // TODO
        Log.trace("WRITE TO CACHE!!! " + path + "/" + id + ".json");
    }
}

export function arrayFlat(d: any[][]): any[] {
    return d.reduce((result, i) => {
        result.push(i);
        // Log.trace("array FLAT");
        return result;
    }, []);
}

export function checkParsed(j: any): any { // TODO: being used?
    if (typeof j !== "string") { j = JSON.stringify((j)); }
    try {
        j = JSON.parse(j);
    } catch (error) {
        Log.error("ERROR CAUGHT");
        return null;
    }
    // Log.trace(JSON.stringify(j));
    // Log.trace(j.Subject);

    // if (j === undefined || j.Subject === undefined || j.Course === undefined
    //     || j.Avg === undefined || j.Professor === undefined
    //     || j.Title === undefined || j.Pass === undefined
    //     || j.Fail === undefined || j.Audit === undefined
    // || j.id === undefined
    // || j.Year === undefined
    // ) {
    // Log.trace(j.result);
    // if (j === null || j === undefined || typeof j !== "object" || j.result === undefined || j.result === null
    // if (j == null || typeof j !== "object" || j.result == null || j.result === []
    // Log.trace(j.result.toString());
    if (j && j.result && j.result.toString() !== ""
    ) {
        return j;
    }
    // Log.trace("null returned");
    return null;
}
