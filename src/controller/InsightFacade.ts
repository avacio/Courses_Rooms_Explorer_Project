import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
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
    protected datasetController: DatasetController;
    protected queryController: QueryController;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetController = new DatasetController();
        this.queryController = new QueryController(this.datasetController);
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let self: InsightFacade = this;
        return new Promise(async function (resolve, reject) {
                if (self.datasetController.containsDataset(id)) { // already contains, then reject
                    return reject(new InsightError("ID ALREADY ADDED BEFORE" + id));
                }
                if (content == null || kind == null || content === "" || id === "" || id == null ||
                    ((kind !== InsightDatasetKind.Courses) && (kind !== InsightDatasetKind.Rooms))) {
                    return reject(new InsightError ("INVALID, REJECTED ADDDATASET, content null: " + id));
                }
                if (content.substring(0, 4) !== "UEsD") {
                    return reject(new InsightError("INPUT dataset is not a zip: " + id));
                }

                await new JSZip().loadAsync(content, {base64: true})
                    .then((zip) => InsightFacade.readZip(id, zip, kind).then(function (allData) {
                        if (allData !== null && allData.length !== 0) {
                                // Log.trace("VALID, ADDED ADDDATASET: " + id);
                                self.datasetController.addDataset(id, [].concat.apply([], allData), kind);
                                return resolve(self.datasetController.getAllDataKeys());
                            } else {
                                return reject(new InsightError ("REJECTED addDataset, allData insignificant: " + id));
                            }}));
        });
    }

    public removeDataset(id: string): Promise<string> {
        let self: InsightFacade = this;
        return new Promise(async function (resolve, reject) {
                if (id === "" || id == null) {return reject (new InsightError ("invalid id")); }
                if (self.datasetController.containsDataset(id)) {
                    self.datasetController.removeDataset(id);
                    return resolve(id);
                }
                return reject (new NotFoundError (id));
        });
    }

    public performQuery(query: any): Promise<any[]> {
        let self: InsightFacade = this;
        return new Promise(function (resolve, reject) {
            try {
                if (!self.queryController.isValidQuery(query)) {
                    return reject (new InsightError ("invalid query"));
                }
                if (!self.datasetController.containsDataset(self.queryController.getQueryID())) {
                    return reject (new InsightError ("dataset has not been added"));
                }
                let results: any[] = self.queryController.parseQuery(query);
                if (results.length > 5000) { reject (new ResultTooLargeError()); }

                return resolve(results);
            } catch (error) {
                if (error.message === "RTL") { reject (new ResultTooLargeError());
                } else { reject (new InsightError ("performQuery error: " + error.message)); }
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        const self = this;
        return new Promise(function (resolve) {
            resolve(self.datasetController.listDatasets());
        });
    }

    private static readZip(id: string, zip: JSZip, kind: InsightDatasetKind): Promise<any[]> {
        const files: Array<Promise<any[]>> = [];

        if (kind === InsightDatasetKind.Courses) {
            zip.folder("courses").forEach((path: string, file: JSZipObject) => {
                files.push(file.async("text").then((data) => {
                    try {
                        let parsed = checkParsed(data);
                        return (parsed == null) ? null :
                            parsed.result.map((val: any) => InsightFacade.makeCourseEntry(val, id));
                    } catch (error) {
                        return null;
                    }
                }));
            });
            return Promise.all(files).then((f) => f.filter((i: any) => i !== null ));
        } else if (kind === InsightDatasetKind.Rooms) {
            zip.file("index.htm").async("text").then((index) => {
                // let buildings = getBuildings(index);
            });
        }
    }

    private static makeCourseEntry(e: any, id: string): any {
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
            return entry;
    }
}
