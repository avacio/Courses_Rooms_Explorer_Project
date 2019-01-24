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

const path = __dirname + "/data.json";
export default class DatasetController {
    private data: Map<string, any[]>;

    constructor(private cache = false) {
        Log.trace("DatasetController constuctor");
        this.data = new Map<string, any[]>(this.checkCache());
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
        Log.trace("add ds in dc.ts : " + id);
        if (id != null) {
            this.data.set(id, content);

            if (this.cache) { this.writeToCache(); }
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

    // private writeToCache(id: string) {
    private writeToCache() {
        const entries: any[] = [];

        this.data.forEach(async function (value, key) { // needs to be async or no?
            entries.push([key, value]);
        });
        // fs.writeFileSync( __dirname + "/" + id + ".json", JSON.stringify(entries)); // TODO
        fs.writeFileSync( path, JSON.stringify(entries)); // TODO
    }

    // public listDatasets(): Promise<InsightDataset[]> {
    //     return this.data.get(id);
    // }

    // ///////// load
    // public loadData(file: string): Promise<any[]> {
    //     return new Promise(async function (resolve, reject) {
    //
    //         let zip = new JSzip();
    //         let d: string[] = []; // TODO
    //
    //         try {
    //         // const z = await zip.loadAsync(file, {base64: true});
    //         // // for (const i in z) {
    //         // //     this.addDataset(JSON.parse())
    //         // // }
    //             let promises: any[] = [];
    //             zip.loadAsync(file, {base64: true}).then( async function (f: any) {
    //             f.forEach(async function (fName: any, fileZ: any) {
    //                 if (f.dir) {return; } else {
    //                     Log.trace(fName);
    //                     // promises.push(zip.file(fName).async("string"))
    //                     let content: string = await zip.file(fName).async("text"); // TODO
    //                     const parsed = await JSON.stringify(JSON.parse(content));
    //                     promises.push(parsed);
    //                 }
    //             });
    //             // const p = await Promise.all(promises);
    //             // await resolve(promises);
    //             Promise.all(promises).then(function (response: any) {
    //                     resolve(promises);
    //                 });
    //             }
    //         );
    //     } catch (error) {
    //         Log.error(error);
    //         reject();
    //     }
    //     });
    // }
    ///// TODO: Add cache stuff
}
//

export function arrayFlat(d: any[][]): any[] {
    return d.reduce((result, i) => {
        result.push(i);
        return result;
    }, []);
}
