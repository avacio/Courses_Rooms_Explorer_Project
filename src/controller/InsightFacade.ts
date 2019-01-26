import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import DatasetController, {arrayFlat, isJson} from "./DatasetController";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
let isInvalidAdd: boolean = false;
export default class InsightFacade implements IInsightFacade {
    private datasetController: DatasetController;
    // private isInvalidAdd: boolean;

    constructor(cache = false) {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetController = new DatasetController(cache);
        // this.isInvalidAdd = false;
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let self: InsightFacade = this;
        // Log.trace("addDataset kind: " + kind.toString());
        return new Promise(async function (resolve, reject) {
            try {
                // Log.trace("is content json " + isJson(content).toString());
                if (content == null || kind == null || content === "" ||
                    ((kind !== InsightDatasetKind.Courses) && (kind !== InsightDatasetKind.Rooms))) {
                    return reject([id]); }
                let zip = await new JSZip().loadAsync(content, {base64: true});

                // Log.trace(zip.folder("courses"))
                await InsightFacade.readZip(id, zip).then(async function (allData) {
                    // if (allData !== null && allData.length !== 0 && !isInvalidAdd) {
                    if (allData !== null && allData.length !== 0) {
                        Log.trace("VALID, ADDED ADDDATASET: " + id);
                        self.datasetController.addDataset(id, allData);
                        return resolve([id]);
                    } else {
                        // isInvalidAdd = false;
                        Log.trace("INVALID, REJECTED ADDDATASET: " + id);
                        return reject([id]);
                    }
                    // Log.trace("allData " + allData);
                    // Log.trace("ENTRY COUNT: " + self.datasetController.entryCount().toString());

                    // return resolve([id]);
                });
                ///////////

                // let results = await InsightFacade.readZip(id, zip);
                // await results.then(async function (allData) {
                //     if (allData !== null && allData.length !== 0) {
                //         self.datasetController.addDataset(id, allData);
                //         return resolve([id]);
                //     } else { return reject([id]); }
                //     // Log.trace("allData " + allData);
                //     // Log.trace("ENTRY COUNT: " + self.datasetController.entryCount().toString());
                //
                //     // return resolve([id]);
                // });
            } catch (error) {
                Log.error(error);
                return reject([id]);
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        // return Promise.reject("Not implemented.");
        let self: InsightFacade = this;
        return new Promise(async function (resolve, reject) {
            try {
                if (self.datasetController.containsDataset(id)) {
                    self.datasetController.removeDataset(id);
                }
                // self.datasetController.removeDataset(id);
                return resolve(id);
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
        // return Promise.reject("Not implemented.");
        return Promise.reject (new InsightError ("invalid"));
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

    private static readZip(id: string, zip: JSZip): Promise<any[]> { // TODO
        const files: Array<Promise<any[]>> = [];
        // let self: InsightFacade = this;
        try {
            // Log.trace("READZIP ZIP NAME: " + zip.);

            // zip.forEach((path: string, file: JSZipObject) => {
            zip.folder("courses").forEach((path: string, file: JSZipObject) => {
            // zip.folder(/courses/).forEach((path: string, file: JSZipObject) => {

                // Log.trace("FILEp" + (typeof file).toString());
                // Log.trace("FILEp" + file.name);
                // if (file.dir) {
                // if (file.dir || !file.name.includes(".json")
                // ) {
                //     return;
                // }
                // if (file.name !== "courses") {
                //     Log.trace("TEST: " + (file.name !== "courses").toString());
                //     Log.trace("TEST DIR NAME: " + (file.name).toString());
                //         // return Promise.reject([]);
                //     Log.trace("courses NAME FOLDER");
                //     isInvalidAdd = true;
                //     return;
                // }

                if (file.dir) {
                    Log.trace("TEST: " + (file.name !== "courses").toString());
                    Log.trace("TEST DIR NAME: " + (file.name).toString());
                    if (file.name !== "courses/") {
                        Log.trace("DHFH");
                        // isInvalidAdd = true;
                        // return Promise.reject([]);
                    }
                    return;
                }

                files.push(file.async("text").then((data) => {
                // files.push(file.async("base64").then((data) => {
                    if (!isJson(data)) {
                        Log.error("null returned");
                        // return null;
                        return;
                    }
                    return JSON.parse(data).result.map(InsightFacade.makeEntry).filter((i: any) => i !== null);
                }));
            });
            // return Promise.all(files); // TODO
            // Log.trace("FILESLENGTH " + files.length.toString());
            return Promise.all(files).then(arrayFlat); // TODO
        } catch (error) {
            return; // TODO
        }
    }

    private static makeEntry(e: any): any {
        // CHECK VALID TYPE
        // if (!isString(e.Subject)
        //     // || (!isStringObject(e.Course) && !isNumberObject(e.Course))
        // ) { return null; }

        if (e === null || typeof e.Subject !== "string" || typeof e.Course !== "string"
        || typeof e.Avg !== "number" || typeof e.Professor !== "string"
        || typeof e.Title !== "string" || typeof e.Pass !== "number"
        || typeof e.Fail !== "number" || typeof e.Audit !== "number"
        // || typeof e.id !== "string"
        // || typeof e.Year !== "number"
        ) {
            return null;
        }

        // Log.trace("MAKE NON-NULL ENTRY" + e.Subject + e.Course + typeof e.id);
        return {
            courses_dept: e.Subject,
            courses_id: e.Course,
            courses_avg: e.Avg,
            courses_instructor: e.Professor,
            courses_title: e.Title,
            courses_pass: e.Pass,
            courses_fail: e.Fail,
            courses_audit: e.Audit,
            courses_uuid: e.id.toString(), // number in JSON
            // courses_year: e.Year    // TODO
            courses_year: ((e.Section === "overall") ? 1900 : parseInt(e.Year, 10))    // TODO string in JSON
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
