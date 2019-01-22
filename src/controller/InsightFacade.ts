import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
// import DatasetController from "./DatasetController";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import {Dataset} from "./Dataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

let dataPool: Map<string, Dataset> = new Map<string, Dataset>(); // OR ANY[] FOR VALUE

export default class InsightFacade implements IInsightFacade {
    // private datasetController: DatasetController;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        // this.datasetController = new DatasetController();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // return Promise.reject("Not implemented.");
        // async function ()

        // let result: Promise<any[]>;
        // return new Promise(async function (resolve, reject) {
        //     try {
        //        // if (content != null)
        //        //  new JSZip().loadAsync(content)
        //        //  let zip = await new JSZip().loadAsync(content, {base64: true});
        //         // result = this.readZip(zip);
        //         let result = await this.datasetController.loadData(content);
        //         this.datasetController.addDataset(id, result);
        //
        //         resolve();
        //     } catch (error) {
        //         Log.error(error);
        //         reject("stub");
        //     }
        // });

        return new Promise(async function (resolve, reject) {
            // const self = this;
            // try {
            //     let zip = new JSZip();
            //     await zip.loadAsync(content, {base64: true});
            //     let promises = await InsightFacade.readZip(zip);
            //
            //     await self.datasetController.addDataset(id, promises);
            //     resolve();
            // } catch (error) {
            //     Log.error(error);
            //     reject("stub");
            // }

            // TRYING WITH DATASET CLASS
            let newDataset = new Dataset(id, content, kind);
            // let parsed = await newDataset.read();
            await newDataset.read();
            dataPool.set(id, newDataset);
        });
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        // return Promise.reject("Not implemented.");
        const self = this;
        return new Promise(function (resolve, reject) {
            try {
                // self.datasetController.listDatasets();
                resolve();
            } catch (error) {
                Log.error(error);
                reject("stub listdatasets");
            }
        });
    }

    // FOR TESTING
    public getDataPool(): Map<string, Dataset> {
        return dataPool;
    }

    // private static readZip(zip: JSZip): Promise<any[]> { // TODO
    //     const files: Array<Promise<any[]>> = [];
    //     // TODO
    //
    //     zip.forEach((path: string, file: JSZipObject) => {
    //         if (file.dir) { return; }
    //
    //         files.push(file.async("text").then((data) => {
    //             return JSON.parse(data).result.map(InsightFacade.makeEntry);
    //         }));
    //     });
    //     return Promise.all(files);
    // }

    private static makeEntry(e: any): any {
        // CHECK VALID TYPE
        // if (!isStringObject(e.Subject) ||
        //     (!isStringObject(e.Course) && !isNumberObject(e.Course))
        return {
            courses_dept: e.Subject,
            courses_id: e.Course,
            courses_avg: e.Avg,
            courses_instructor: e.Professor,
            courses_title: e.Title,
            courses_pass: e.Pass,
            courses_fail: e.Fail,
            courses_audit: e.Audit,
            courses_uuid: e.id,
            courses_year: e.Year    // TODO
        };
    }
    // ============
    // Helper Functions

    ///////// load

    // public parseZip(zip: JSZip): Promise<any[]> {
    //     const files: Promise<any[]>[] = [];
    //
    //     // zip.forEach(((path: string, file: JSZip) => {
    //     //     if (file.dir == true) {return;}
    //     //
    //     //     let f: any[] = [];
    //     //     f = await JSON.parse(data).res
    //     // }))
    //
    //     const f = await JSON.parse(f).result.map(createCourseEntry)
    // }
}
// const courseKeys: {
//             courses_dept: "string",
//             courses_id: "string",
//             courses_avg: "number",
//             courses_instructor: "string",
//             courses_title: "string",
//             courses_pass: "number",
//             courses_fail: "number",
//             courses_audit: "number",
//             courses_uuid: "string",
//             courses_year: "number"
// };

// function addDatasetHelper(id: string, dataArray: any[]) {
//     try {
//         let d: Dataset = {id, datas}
//     } catch (error) {
//         Log.error(error);
//     }
// }
