import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import DatasetController, {arrayFlat} from "./DatasetController";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";

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

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let self: InsightFacade = this;

        return new Promise(async function (resolve, reject) {
            try {
                // if (content != null)
                let zip = await new JSZip().loadAsync(content, {base64: true});

                // await InsightFacade.readZip(zip).then((allData) => {
                await InsightFacade.readZip(zip).then(async function (allData) {

                    // Log.trace("AFTER READZIP " + allData.length.toString());
                    self.datasetController.addDataset(id, allData);
                    Log.trace("AFTER ds add " + allData.length.toString());

                    Log.trace("ENTRY COUNT: " + self.datasetController.entryCount().toString());

                    return resolve();
                });
            } catch (error) {
                Log.error(error);
                return reject({body: {error: "stub"}});
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        // return Promise.reject("Not implemented.");
        let self: InsightFacade = this;
        return new Promise(function (resolve, reject) {
            try {
                if (self.datasetController.containsDataset(id)) {
                    self.datasetController.removeDataset(id);
                }
                // self.datasetController.removeDataset(id);
                return resolve();
            } catch (error) {
                Log.error(error);
                if (!self.datasetController.containsDataset(id)) {
                    return reject (new NotFoundError ("dataset not found"));
                }
                return reject (new InsightError ("invalid"));
            }
        });
    }

    public performQuery(query: any): Promise<any[]> {
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
    public getMapCount(): number {
        return this.datasetController.entryCount();
    }

    public printKeys() {
        this.datasetController.printAllKeys();
    }

    private static readZip(zip: JSZip): Promise<any[]> { // TODO
        const files: Array<Promise<any[]>> = [];
        zip.forEach((path: string, file: JSZipObject) => {
            if (file.dir) {
                return;
            }

            files.push(file.async("text").then((data) => {
                return JSON.parse(data).result.map(InsightFacade.makeEntry).filter((i: any) => i !== null);
            }));
        });
        // return Promise.all(files); // TODO
        // Log.trace("FILESLENGTH " + files.length.toString());
        return Promise.all(files).then(arrayFlat); // TODO
    }

    private static makeEntry(e: any): any {
        // CHECK VALID TYPE
        // if (!isString(e.Subject)
        //     // || (!isStringObject(e.Course) && !isNumberObject(e.Course))
        // ) { return null; }
        if (typeof e.Subject !== "string") {
            return null;
        }

        // Log.trace("MAKE NON-NULL ENTRY");
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
    // ============
    // Helper Functions

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
