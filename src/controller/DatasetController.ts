import Log from "../Util";
import * as JSzip from "jszip";
import * as JSZip from "jszip";
import {types} from "util";
import {InsightDatasetKind} from "./IInsightFacade";
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
export default class DatasetController {
    private data: Map<string, any[]>;

    constructor() {
        Log.trace("DatasetController constuctor");
        this.data = new Map<string, any[]>();
    }

    // returns false if id is null
    public addDataset(id: string, content: any[]): boolean {
        // if (this.data.containsDataset(id)) {
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

    // ///////// load
    // public loadData(file: string): Promise<any[]> {
    //     return new Promise(async function (resolve, reject) {
    //
    //         let zip = new JSzip();
    //         // let d: string[] = []; // TODO
    //         zip.loadAsync(file, {base64: true});
    //
    //
    //     });
    //
    //     try {
    //         // let pArr: any[] = [];
    //         // zip.loadAsync(file, {base64: true})
    //
    //
    //     } catch (error) {
    //
    //
    //     }
    // }
    //
    // // public parseZip(zip: JSZip): Promise<any[]> {
    // //     const files: Promise<any[]>[] = [];
    // //
    // //     // zip.forEach(((path: string, file: JSzip) => {
    // //     //     if (file.dir == true) {return;}
    // //     //
    // //     //     let f: any[] = [];
    // //     //     f = await JSON.parse(data).res
    // //     // }))
    // //
    // //     const f = await JSON.parse(f).result.map(createCourseEntry)
    // // }
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
