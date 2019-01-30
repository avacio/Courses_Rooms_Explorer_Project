import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import DatasetController, {checkParsed} from "./DatasetController";
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
                    return reject(new InsightError("ID ALREADY ADDED BEFORE" + id));
                }
                if (content == null || kind == null || content === "" || id === "" || id == null ||
                    ((kind !== InsightDatasetKind.Courses) && (kind !== InsightDatasetKind.Rooms))) {
                    return reject(new InsightError ("INVALID, REJECTED ADDDATASET, content null: " + id));
                }
                if (content.substring(0, 4) !== "UEsD") {
                    return reject(new InsightError("INPUT dataset is not a zip: " + id));
                    // return reject([id]);
                }
                // let zip = await new JSZip().loadAsync(content, {base64: true});

                await new JSZip().loadAsync(content, {base64: true})
                    .then((zip) => InsightFacade.readZip(id, zip).then(function (allData) {
                        // allData = allData.filter((i: any) => i !== null && i !== {});
                        if (allData !== null && allData.length !== 0) {
                                Log.trace("VALID, ADDED ADDDATASET: " + id);
                                // Log.trace(allData.length.toString());
                                self.datasetController.addDataset(id, [].concat.apply([], allData), kind);
                                return resolve(self.datasetController.getAllDataKeys());
                            } else {
                                return reject(new InsightError ("REJECTED addDataset, allData insignificant: " + id));
                            }}));

                // Log.trace(content);
                // await InsightFacade.readZip(id, zip).then(function (allData) {
                //     if (allData !== null && allData.length !== 0) {
                //         Log.trace("VALID, ADDED ADDDATASET: " + id);
                //         Log.trace(allData.length.toString());
                //         self.datasetController.addDataset(id, allData, kind);
                //         return resolve(self.datasetController.getAllDataKeys());
                //     } else {
                //         throw new InsightError ("REJECTED addDataset, allData insignificant: " + id);
                //     }
                // });
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
            // Log.trace(self.datasetController.listDatasets().length.toString());
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
        // return new Promise(function (resolve, reject) {
        try {
                // zip.folder("courses").forEach((path: string, file: JSZipObject) => {
                //     // if (file.dir) { throw new InsightError("INVALID nested folder"); } // TODO in specs?
                //     if (file.name.endsWith(".json")) {
                //         files.push(file.async("text").then(async (data) => {
                //             let parsed = checkParsed(data);
                //             return (await parsed === null) ? null :
                //                 parsed.result.map(InsightFacade.makeEntry).filter((i: any) => i !== null);
                //         }));
                //     }
                // });
                // // Log.trace("FILESLENGTH " + files.length.toString()); // TODO && typeof i === "object")
                // return Promise.all(files).then(arrayFlat).then((f) => f.filter((i: any) => i !== null));

            zip.folder("courses").forEach((path: string, file: JSZipObject) => {
                // if (file.dir) { throw new InsightError("INVALID nested folder"); } // TODO in specs?
                // if (file.name.endsWith(".json")) { // FILES DON'T HAVE TO BE JSON, JUST IN JSON FORMAT
                    files.push(file.async("text").then( (data) => {
                        // let parsed = checkParsed(data);
                        // return (await parsed === null) ? null :
                        try {
                            let parsed = checkParsed(data);
                            return (parsed == null) ? null :
                                parsed.result.map((val: any) => InsightFacade.makeEntry(val, id));
                        } catch (error) {
                            Log.trace("JSON reading error");
                            return null;
                        }
                        // .filter((i: any) => i !== null)
                    }));
                // }
            });
            // Log.trace("FILESLENGTH " + files.length.toString()); // TODO && typeof i === "object")
            // return Promise.all(files).then(arrayFlat);
            // Log.trace("FILES NUM " + files.filter((i: any) => i !== null ).length.toString());
            return Promise.all(files).then((f) => f.filter((i: any) => i !== null ));
        } catch (error) {
                Log.trace("CAUGHT ERROR READZIP");
                // return; // TODO
                // return Promise.reject(new InsightError("READZIP ERROR"));
                return null;
            }
        // });
    }

    private static makeEntry(e: any, id: string): any {
        // CHECK VALID TYPE
        // if (!isString(e.Subject)
        //     // || (!isStringObject(e.Course) && !isNumberObject(e.Course))
        // ) { return null; }
        // if (e.Subject === "") {e.Subject = "TEST"; }
        // Log.trace(e.Subject);
     //    if (e == null
     //        || e.Subject == null || e.Course == null
     //        || e.Avg == null || e.Professor == null
     //        || e.Title == null || e.Pass == null
     //        || e.Fail == null || e.Audit == null
     //    || e.id == null || e.Year == null
     //    //     || typeof e.Subject !== "string" || typeof e.Course !== "string"
     //    // || typeof e.Avg !== "number" || typeof e.Professor !== "string"
     //    // || typeof e.Title !== "string" || typeof e.Pass !== "number"
     //    // || typeof e.Fail !== "number" || typeof e.Audit !== "number"
     // //   // || typeof e.id !== "string"
     // //   // || typeof e.Year !== "number"
     //    ) {
     //        Log.trace("null returned");
     //        return null;
     //        // return; // TODO
     //    }
        // Log.trace(parseInt(e.Fail, 10).toString());
        // Log.trace("MAKE NON-NULL ENTRY" + e.Subject + e.Course + typeof e.id);
        try {
        // return {
        //     courses_dept: e.Subject.toString(),
        //     courses_id: e.Course.toString(),
        //     courses_avg: parseFloat(e.Avg),
        //     courses_instructor: e.Professor.toString(),
        //     courses_title: e.Title.toString(),
        //     courses_pass: parseInt(e.Pass, 10),
        //     courses_fail: parseInt(e.Fail, 10),
        //     courses_audit: parseInt(e.Audit, 10),
        //     courses_uuid: e.id.toString(), // number in JSON
        //     // courses_year: e.Year    // TODO
        //     courses_year: ((e.Section === "overall") ? 1900 : parseInt(e.Year, 10))    // TODO string in JSON
        // };

            // [id + "_dept"] : e.Subject,
            //     courses_id: (typeof e.Course !== "string") ? e.Course.toString() : e.Course,
            //     courses_avg: (typeof e.Avg !== "number") ? parseFloat(e.Avg) : e.Avg,
            //     courses_instructor: e.Professor,
            //     courses_title: e.Title,
            //     courses_pass: (typeof e.Pass !== "number") ? parseInt(e.Pass, 10) : e.Pass,
            //     courses_fail: (typeof e.Fail !== "number") ? parseInt(e.Fail, 10) : e.Fail,
            //     courses_audit: (typeof e.Audit !== "number") ? parseInt(e.Audit, 10) : e.Audit,
            //     courses_uuid: (typeof e.id !== "string") ? e.id.toString() : e.id, // number in JSON
            //     courses_year: (e.Section && e.Section === "overall") ? 1900 :
            //     ((typeof e.Year !== "number") ? parseInt(e.Year, 10) : e.Year)

            // return {
            let entry: any = {};
            entry[id + "_dept"] = e.Subject;
            entry[id + "_id"] = (typeof e.Course !== "string") ? e.Course.toString() : e.Course;
            entry[id + "_avg"] = (typeof e.Avg !== "number") ? parseFloat(e.Avg) : e.Avg;
            entry[id + "_instructor"] = e.Professor;
            entry[id + "_title"] = e.Title;
            entry[id + "_pass"] = (typeof e.Pass !== "number") ? parseInt(e.Pass, 10) : e.Pass;
            entry[id + "_fail"] = (typeof e.Fail !== "number") ? parseInt(e.Fail, 10) : e.Fail;
            entry[id + "_audit"] = (typeof e.Audit !== "number") ? parseInt(e.Audit, 10) : e.Audit;
            entry[id + "_uuid"] = (typeof e.id !== "string") ? e.id.toString() : e.id;
            entry[id + "_year"] = (e.Section && e.Section === "overall") ? 1900 :
                    ((typeof e.Year !== "number") ? parseInt(e.Year, 10) : e.Year);
            // };
            return entry;
        } catch (error) {
            Log.error(error.message);
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
