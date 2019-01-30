import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import DatasetController, {arrayFlat, checkParsed} from "./DatasetController";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";
import QueryController from "./QueryController";

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
                        self.datasetController.addDataset(id, allData, kind);
                        return resolve(self.datasetController.getAllDataKeys());
                    } else {
                        throw new InsightError ("REJECTED addDataset, allData insignificant: " + id);

                        // return reject(new InsightError ("REJECTED addDataset, allData insignificant: " + id));
                        // return Promise.reject ([id]);
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
                // Log.trace("INVALID, REJECTED ADDDATASET: " + id);
                // Log.error(error);
                // return reject([id]);
                return reject (new InsightError (error.message));
                // return Promise.reject (new InsightError ("REJECTED AddDataset " + error.message + id));
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        let self: InsightFacade = this;
        return new Promise(async function (resolve, reject) {
            try {
                if (self.datasetController.containsDataset(id)) {
                    self.datasetController.removeDataset(id);
                    return resolve(id);
                }
                // self.datasetController.removeDataset(id);
                return reject (new NotFoundError (id));
            } catch (error) {
                Log.error(error);
                // if (!self.datasetController.containsDataset(id)) {
                //     return reject (new NotFoundError ("dataset not found"));
                // }
                return reject (new InsightError (error.message));
            }
        });
    }

    public performQuery(query: any): Promise<any[]> {
        // return Promise.reject (new InsightError ("invalid"));
        return new Promise(function (resolve, reject) {
            // const queryResult = QueryController.parseQuery(query);
            try {
                if (!QueryController.isValidQuery(query)) {
                    return reject (new InsightError ("invalid"));
                }
                return reject (new InsightError ("invalid"));

            } catch (error) {
                return reject (new InsightError ("invalid"));
            }

        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        // return Promise.reject("Not implemented.");
        const self = this;
        return new Promise(function (resolve) {
            // try {
                resolve(self.datasetController.listDatasets());
            // } catch (error) {
            //     Log.error(error);
            //     reject("stub listdatasets");
            // }
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
                zip.folder("courses").forEach((path: string, file: JSZipObject) => {
                    // if (file.dir) { throw new InsightError("INVALID nested folder"); } // TODO in specs?
                    if (file.name.endsWith(".json")) {
                        files.push(file.async("text").then(async (data) => {
                            // files.push(file.async("base64").then((data) => {
                            // validNum++;
                            // Log.trace(typeof JSON.parse(data).result.map(InsightFacade.makeEntry).filter((i: any) =>
                            //     i !== null));
                            // return JSON.parse(data).result.map(InsightFacade.makeEntry).filter((i: any) =>
                            //     i !== null);
                            // return checkParsed(data).result.map(InsightFacade.makeEntry).filter((i: any) =>
                            //     i !== null);
                            // let parsed = checkParsed(data);
                            // return await parsed.result.map(InsightFacade.makeEntry).filter((i: any) =>
                            //     i !== null);
                            // let parsed = new Promise((resolve, reject) => {
                            //     if (checkParsed(data) == null) {reject();}
                            //     else {resolve(); }///     / }).then(() => {return checkParsed(data).
                            //     then(result.map(InsightFacade.makeEntry).filter((i: any) =>
                            //     i !== null)); }).catch(() => { return [null]; });
                            // await parsed;

                            let parsed = checkParsed(data);
                            return (await parsed === null) ? null :
                                parsed.result.map(InsightFacade.makeEntry).filter((i: any) => i !== null);
                        }));
                    }
                });
                // return Promise.all(files); // TODO
                // Log.trace("FILESLENGTH " + files.length.toString()); // TODO && typeof i === "object")
                return Promise.all(files).then(arrayFlat).then((f) => f.filter((i: any) => i !== null));
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
        // if (e.Subject === "") {e.Subject = "TEST"; }
        // Log.trace(e.Subject);
        if (e == null
            || e.Subject == null || e.Course == null
            || e.Avg == null || e.Professor == null
            || e.Title == null || e.Pass == null
            || e.Fail == null || e.Audit == null
        || e.id == null || e.Year == null
        //     || typeof e.Subject !== "string" || typeof e.Course !== "string"
        // || typeof e.Avg !== "number" || typeof e.Professor !== "string"
        // || typeof e.Title !== "string" || typeof e.Pass !== "number"
        // || typeof e.Fail !== "number" || typeof e.Audit !== "number"
     //   // || typeof e.id !== "string"
     //   // || typeof e.Year !== "number"
        ) {
            Log.trace("null returned");
            return null;
            // return; // TODO
        }
        // Log.trace(parseInt(e.Fail, 10).toString());
        // Log.trace("MAKE NON-NULL ENTRY" + e.Subject + e.Course + typeof e.id);
        try {
        return {
            courses_dept: e.Subject.toString(),
            courses_id: e.Course.toString(),
            courses_avg: parseFloat(e.Avg),
            courses_instructor: e.Professor.toString(),
            courses_title: e.Title.toString(),
            courses_pass: parseInt(e.Pass, 10),
            courses_fail: parseInt(e.Fail, 10),
            courses_audit: parseInt(e.Audit, 10),
            courses_uuid: e.id.toString(), // number in JSON
            // courses_year: e.Year    // TODO
            courses_year: ((e.Section === "overall") ? 1900 : parseInt(e.Year, 10))    // TODO string in JSON
        };
        } catch (error) {
            return null;
        }
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
