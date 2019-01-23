import Log from "../Util";
import * as JSzip from "jszip";
import * as JSZip from "jszip";
import {types} from "util";
import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {forEachComment} from "tslint";
// import isStringObject = module
// import isNumberObject = module

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

// DEPRECATED, NOT BEING USED
export default class DatasetController {
    private data: Map<string, any[]>;

    constructor() {
        Log.trace("DatasetController constuctor");
        this.data = new Map<string, any[]>();
    }

    // returns false if id is null
    public addDataset(id: string, content: any[]): boolean {
        // if (this.data.containsDataset(id)) {
        Log.trace("add ds in dc.ts : " + id);
        if (id != null) {
            this.data.set(id, content);
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

    // public parseZip(zip: JSZip): Promise<any[]> {
    //     const files: Promise<any[]>[] = [];
    //
    //     zip.forEach(((path: string, f: JSzip) => {
    //         if (f.dir == true) {return;}
    //
    //         // let f: any[] = [];
    //         // f = await JSON.parse(data).res
    //         files.push(f.async('string'))
    //     }));
    //
    //     // const f = await JSON.parse(f).result.map(createCourseEntry)
    // }
    //
    //
    //
    // public makeCourseEntry(e: any): any {
    //     e.filter((item: any) => item !== null);
    //
    //     // CHECK VALID TYPE
    //     // if (!isStringObject(e.Subject) ||
    //     //     (!isStringObject(e.Course) && !isNumberObject(e.Course))
    //     return {
    //         courses_dept: e.Subject,
    //         courses_id: e.Course,
    //         courses_avg: e.Avg,
    //         courses_instructor: e.Professor,
    //         courses_title: e.Title,
    //         courses_pass: e.Pass,
    //         courses_fail: e.Fail,
    //         courses_audit: e.Audit,
    //         courses_uuid: e.id,
    //         courses_year: e.Year    // TODO
    //     };
    // }

    ///// TODO: Add cache stuff
} //// TODO: parsing
//

export function arrayFlat(d: any[][]): any[] {
    return d.reduce((result, i) => {
        result.push(i);
        return result;
    }, []);
}
