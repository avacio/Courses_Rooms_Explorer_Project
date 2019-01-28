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
                // Log.trace("is content json " + checkParsed(content).toString());
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

                // zip = await zip.filter(function (relativePath, file) {
                //     Log.trace(file.name);
                //     return true;
                // });

                // Log.trace(content);
                await InsightFacade.readZip(id, zip).then(async function (allData) {
                    if (allData !== null && allData.length !== 0) {
                        Log.trace("VALID, ADDED ADDDATASET: " + id);
                        // allData = arrayFlat(allData);
                        self.datasetController.addDataset(id, allData);
                        // self.datasetController.addDataset(id, allData.filter((i: any) => i !== null));
                        return resolve([id]);
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
        // return Promise.reject (new InsightError ("invalid"));
        return new Promise(function (resolve, reject) {
            // const queryResult = QueryController.parseQuery(query);
            try {
                if (!QueryController.isValidQuery(query)) {
                    return reject (new InsightError ("Query is invalid."));
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
        let files: Array<Promise<any[]>> = [];
        // let validNum: number = 0;
        // return new Promise(function (resolve, reject) {
        try {
                // Log.trace("READZIP ZIP NAME: " + zip.);
                // RETURNING WILL NOT STOP FOREACH EXECUTION
                zip.folder("courses").forEach(function (path: string, file: JSZipObject) {
                    let compromised: boolean = false;
                    // let f: Promise<any[]> = null;
                    let fff: Promise<any>; // Promise<void>
                    if (file.dir) {
                        // stop nested folders?
                        // Log.trace("FILE.DIR IS TRUE");
                        throw new InsightError("INVALID nested folder");
                        // return;
                    }
                    // file.

                    // Log.trace(file.name);
                    if (!file.name.endsWith(".json")) {
                        // Log.trace("NOT JSON NOT JSON");
                        // throw new InsightError("not JSON input");
                        compromised = true;
                    }
                    if (!compromised) {
                        fff = file.async("text").then(function (data) {
                            let parsed = checkParsed(data);
                            Log.trace(parsed);
                            if (parsed != null) {
                                return parsed.result.map(InsightFacade.makeEntry).filter(
                                // parsed.result.map(InsightFacade.makeEntry).filter(
                                    (i: any) => i != null && i !== []);
                                //     (i: any) =>
                                //         i !== null && i !== undefined); // && i !== undefined
                                // }
                                // return j.result.map(InsightFacade.makeEntry).filter(
                            } else { compromised = true;
                                     return null;
                            }
                        }
                        // ).then((result) => {
                        //         if (!compromised) {
                        //             Log.trace("pushed");
                        //             files.push(fff);
                        //         }
                        //     }
                        );
                        // if (fff != null) { files.push(fff); }
                        if (!compromised && fff != null) {
                            Log.trace("pushed");
                            files.push(fff); }
                    }
                    // if (!compromised) {
                    //     Log.trace("valid file");
                    //     // Log.trace(f.toString());
                    //     files.push(f);
                    // }
                });
                files = files.filter((i: any) => i != null && i !== {} && i !== []);
                // Log.trace("FILES COUNT " + files.length);
                return Promise.all(files).then(arrayFlat); // TODO not really working?
    }   catch (error) {
                // return; // TODO
                return Promise.reject(new InsightError("READZIP " + error.message));
                // return null;
            }
    }

    private static makeEntry(e: any): any {
        // CHECK VALID TYPE

        // Log.trace(e.Subject);
        if (e === null || typeof e.Subject !== "string" || typeof e.Course !== "string"
        || typeof e.Avg !== "number" || typeof e.Professor !== "string"
        || typeof e.Title !== "string" || typeof e.Pass !== "number"
        || typeof e.Fail !== "number" || typeof e.Audit !== "number"
        // || typeof e.id !== "string"
        // || typeof e.Year !== "number"
        ) {
            Log.trace("null returned");
            return null;
            // return; // TODO
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
