import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasetController: DatasetController;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetController = new DatasetController();
    }
    //
    // public loadData(file: string): Promise<any[]> {
    //     return new Promise(async function (resolve, reject) {
    //
    //         let zip = new JSZip();
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

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // return Promise.reject("Not implemented.");
        // async function ()
        return new Promise(async function (resolve, reject) {
            try {
               // if (content != null)
               //  new JSZip().loadAsync(content)
                let zip = await new JSZip().loadAsync(content, {base64: true});
                const result = readZip(zip);
                this.datasetController.addDataset(id, result);

                resolve();
            } catch (error) {
                Log.error(error);
                reject("stub");
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
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

    private readZip(zip: JSZip): Promise<any[]> {
        const files: Array<Promise<any[]>> = [];
        // TODO
        return Promise.all(files);
    }

    private makeCourseEntry(e: any): any {
        e.filter((item: any) => item !== null);

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
}
const courseKeys: {
    // [dataset: string]: {
        // processZip: (zip: JSZip) => Promise<any[]>,
        // keys: {
            courses_dept: "string",
            courses_id: "string",
            courses_avg: "number",
            courses_instructor: "string",
            courses_title: "string",
            courses_pass: "number",
            courses_fail: "number",
            courses_audit: "number",
            courses_uuid: "string",
            courses_year: "number"
        // }
    // }
};
