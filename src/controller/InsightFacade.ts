import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import DatasetController, {arrayFlat, isJson} from "./DatasetController";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import QueryController from "./QueryController";
import Query from "./Query";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasetController: DatasetController;
    private queryController: QueryController;

    constructor(cache = false) {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetController = new DatasetController(cache);
        this.queryController = new QueryController();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let self: InsightFacade = this;

        return new Promise(async function (resolve, reject) {
            try {
                // Log.trace("is content json " + isJson(content).toString());
                if (self.datasetController.containsDataset(id)) { // already contains, then reject
                    // throw new InsightError("ID ALREADY ADDED BEFORE" + id);
                    return reject(new InsightError("ID ALREADY ADDED BEFORE" + id));
                    // return reject([id]);
                } // already contains, then reject
                if (content == null || kind == null || content === "" ||
                    ((kind !== InsightDatasetKind.Courses) && (kind !== InsightDatasetKind.Rooms))) {
                    return reject(new InsightError ("INVALID, REJECTED ADDDATASET, content null: " + id));
                    // return Promise.reject ([id]);
                }
                if (content.substring(0, 4) !== "UEsD") {
                    return reject(new InsightError("INPUT dataset is not a zip: " + id));
                    // return reject([id]);
                }
                let zip = await new JSZip().loadAsync(content, {base64: true});

                // Log.trace(content);
                await InsightFacade.readZip(id, zip).then(async function (allData) {
                    if (allData !== null && allData.length !== 0) {
                        Log.trace("VALID, ADDED ADDDATASET: " + id);
                        self.datasetController.addDataset(id, allData);
                        self.datasetController.setDatasetKind(kind);
                        return resolve([id]);
                    } else {
                        throw new InsightError ("REJECTED addDataset, allData insignificant: " + id);

                        // return reject(new InsightError ("REJECTED addDataset, allData insignificant: " + id));
                        // return Promise.reject ([id]);
                    }
                    // Log.trace("allData " + allData);
                    // Log.trace("ENTRY COUNT: " + self.datasetController.entryCount().toString());
                    // self.datasetController.setDatasetKind(kind);

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
                // Log.trace("INVALID, REJECTED ADDDATASET: " + id);
                // Log.error(error);
                // return reject([id]);
                return reject (new InsightError (error.message));
                // return Promise.reject (new InsightError ("REJECTED AddDataset " + error.message + id));
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

    public performQuery(query: Query): Promise<any[]> {
        // return Promise.reject (new InsightError ("invalid"));
        return new Promise(function (resolve, reject) {
            let self: InsightFacade = this;
            // const queryResult = QueryController.parseQuery(query);
            try {
                if (!QueryController.isValidQuery(query)) {
                    return reject (new InsightError ("Query is invalid."));
                }
                // return reject (new InsightError ("STUB REJECT"));
                self.queryController.parseQuery(query);

            } catch (error) {
                return reject (new InsightError ("invalid"));
            }

        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        // return Promise.reject("Not implemented.");
        const self = this;
        return new Promise(async function (resolve, reject) {
            try {
                // let Datasets: InsightDataset[] = [];
                let Datasets: any[] = [];
                //
                // await self.datasetController.listDatasets();
                // for (let info in Array.from(self.datasetController.Datasets))
                //
                for (let key in Array.from(self.datasetController.data.keys())) {
                    if (self.datasetController.containsDataset(key)) {
                        // Datasets.push(self.datasetController.getDataset(key));
                        let type: string;
                        let rows: string;
                        let info: string;
                        type = self.datasetController.getDatasetKind(key).toString();
                        rows = self.datasetController.getNumRows(key).toString();
                        Log.trace("id: " + key + "type: " + type + "number of rows: " + rows );
                        info = ("id: " + key + "type: " + type + "number of rows: " + rows);
                        Datasets.push(info);
                        // Datasets.push(self.datasetController.getDataset(key));
                        // InsightDataset.numRows;
                    }
                }
                resolve(Datasets);
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
        // let validNum: number = 0;
        // return new Promise(function (resolve, reject) {
        try {
                // Log.trace("READZIP ZIP NAME: " + zip.);

                // zip.forEach((path: string, file: JSZipObject) => {
                zip.folder("courses").forEach((path: string, file: JSZipObject) => {
                    // zip.folder(/courses/).forEach((path: string, file: JSZipObject) => {

                    // Log.trace("FILE PATH: " + path);
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
                        // stop nested folders?
                        return;
                    }
                    // file.

                    // if (!file.name.endsWith(".json")) {
                    //     Log.trace("NOT JSON NOT JSON");
                    //     return;
                    // }

                    files.push(file.async("text").then((data) => {
                        // files.push(file.async("base64").then((data) => {
                        if (!isJson(data)) {
                            Log.error("IS NOT JSON");
                            // return null;
                            return;
                        }
                        // validNum++;
                        // Log.trace(validNum.toString());
                        return JSON.parse(data).result.map(InsightFacade.makeEntry).filter((i: any) => i !== null);
                    }));
                });
                // return Promise.all(files); // TODO
                // Log.trace("FILESLENGTH " + files.length.toString());
                return Promise.all(files).then(arrayFlat); // TODO
            } catch (error) {
                return; // TODO
                // return Promise.reject(new InsightError("READZIP ERROR"));
                // return null;
            }
        // });
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
            // return null;
            return; // TODO
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
