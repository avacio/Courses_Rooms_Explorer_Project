import {InsightDatasetKind, InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import * as QUtil from "./QueryUtil";
import {handleRoomsIS} from "./QueryUtil";
import Log from "../Util";

export default class QueryController {
    protected id: string;
    protected data: any;
    protected datasetController: DatasetController;
    protected datasetKind: InsightDatasetKind;

    constructor(datasetController: DatasetController) {
        this.id = "";
        this.datasetController = datasetController;
        this.data = null;
        this.datasetKind = null;
    }

    public isValidQuery(q: any): boolean {
        this.datasetKind = null;
        if (q == null) { return false; }

        const opts = q.OPTIONS;
        if (opts === null || !Array.isArray(opts.COLUMNS)
            || opts.COLUMNS.length < 1 || opts.length > 2
            || opts.COLUMNS.some((e: any) => typeof e !== "string")) {
            return false;
        }
        if (opts.ORDER &&
            ((typeof opts.ORDER === "string" && opts.COLUMNS.indexOf(opts.ORDER) === -1) ||
            (opts.ORDER.keys && !Array.isArray(opts.ORDER.keys)
        ))) {
            Log.trace("invalid order");
            return false; }
        Log.trace("COLUMNS LENGTH " + opts.COLUMNS.length.toString());
        let idKey: string = "";
        for (let col of opts.COLUMNS) {
            if (col.indexOf("_") !== -1) {
                let fields = col.split("_");
                let k: string = fields[0];
                if (!QUtil.isValidStringField(this.datasetKind, fields[1]) &&
                    !QUtil.isValidMathField(this.datasetKind, fields[1])) {
                    Log.trace("INVALID FIELD" + fields[1]);
                    return false;
                }
                if (idKey === "") {
                    idKey = k;
                } else if (idKey !== k) { // checks if multiple datasets
                    Log.trace("multiple id keys in columns");
                    return false;
                }
            }
        }
        this.id = idKey;
        this.datasetKind = this.datasetController.getDataKind(this.id);
        return true;
    }

    public parseQuery(obj: any): any[] {
        try {
            this.data = this.datasetController.getDataset(this.id); // all data entries for id
            let filtered = this.handleWHERE(obj.WHERE); // filter data
            if (filtered.length > 5000) { throw new ResultTooLargeError("RTL"); }
            if (filtered.length === 0) { return []; }

            Log.trace("OBJ TRANS" + JSON.stringify(obj.TRANSFORMATIONS));
            if (!obj.OPTIONS.ORDER && obj.TRANSFORMATIONS) {
                Log.trace("!ORDER && TRANS THISSSSSSS!!!!!");
                let trans = QUtil.handleGroup(filtered, obj.TRANSFORMATIONS.GROUP) ;
                return QUtil.handleApply(trans, obj.TRANSFORMATIONS.APPLY);
            }
            if (obj.OPTIONS && obj.TRANSFORMATIONS) {
                Log.trace("OPTIONS && TRANS");
                let sorted = QUtil.sortResults(filtered, obj.OPTIONS.ORDER);
                let org = QUtil.organizeResults(sorted, obj.OPTIONS.COLUMNS);
                let trans = QUtil.handleGroup(org, obj.TRANSFORMATIONS.GROUP);
                let apply = QUtil.handleApply(trans, obj.TRANSFORMATIONS.APPLY);
                return QUtil.organizeResults(apply, obj.OPTIONS.COLUMNS); // the sorted, rendered array!
            }
            if (obj.OPTIONS.ORDER && !obj.TRANSFORMATIONS) {
                Log.trace("ORDER && !TRANS");
                // Log.trace("IN PARSEQUERY" + JSON.stringify(obj.OPTIONS.ORDER));
                // Log.trace("IN PARSEQUERY" + obj.OPTIONS.ORDER);
                Log.trace("IN PARSEQUERY" + JSON.stringify(filtered));
                let sorted = QUtil.sortResults(filtered, obj.OPTIONS.ORDER);
                Log.trace("return from sorted");
                return QUtil.organizeResults(sorted, obj.OPTIONS.COLUMNS);
            }
            return QUtil.organizeResults(filtered, obj.OPTIONS.COLUMNS); // the sorted, rendered array!
        } catch (error) {
            if (error.message === "RTL") { throw new ResultTooLargeError("RTL");
            } else { throw new InsightError(error.message); }
        }
    }

    public handleWHERE (q: any): any {
        try {
            let wEntryNum: number = Object.keys(q).length;
            if (wEntryNum === 0) { // maybe move this if to parseQuery, might cause errors when handleWHERE reiterates
                Log.trace("empty where");
                if (this.data.length > 5000) {
                    throw new ResultTooLargeError("RTL");
                } else { return this.data; }
            }
            let data: any[] = [];
            let filter = Object.keys(q)[0];
            // Log.trace("filter: " + filter);
            if (filter === "IS") {
                data = this.handleIS(q["IS"]);
            } else if (filter === "NOT") {
                data = QUtil.handleNOT(this, q["NOT"]);
            } else if (filter === "AND") {
                data = QUtil.handleAND(this, q["AND"]);
            } else if (filter === "OR") {
                data = QUtil.handleOR(this, q["OR"]);
            } else if (filter === "LT") {
                data = this.handleLT(q["LT"]);
            } else if (filter === "GT") {
                data = this.handleGT(q["GT"]);
            } else if (filter === "EQ") {
                data = this.handleEQ(q["EQ"]);
            } else {
                throw new InsightError("not valid filter");
            }
            return data;
        } catch (error) {
            if (error.message === "RTL") { throw new ResultTooLargeError("RTL");
            } else { throw new InsightError("handle WHere" + error.message); }
        }
    }

    public handleIS (q: any): any {
        try {
            let data: any[] = [];
            if (Object.keys(q).length > 1) {
                throw new InsightError("too many keys");
            }
            let skey: string = Object.keys(q)[0];
            if (typeof q[skey] !== "string") { throw new InsightError("invalid input"); }
            let input: any = q[skey];

            let str = skey.split("_");
            if (str[0] !== this.id) { throw new InsightError("referencing multiple datasets"); }
            let sfield = str[1];
            if (!QUtil.isValidStringField(this.datasetKind, sfield)) { throw new InsightError("invalid sfield"); }

            let asteriskCount = input.split("*").length - 1;
            if (asteriskCount > 0) {
                if (asteriskCount > 2 || (asteriskCount === 2 && input.lastIndexOf("*") !== input.length - 1) ||
                    (asteriskCount === 2 && input.indexOf("*") !== 0) ||
                    (input.indexOf("*") !== 0 && input.indexOf("*") !== input.length - 1)) {
                    throw new InsightError("no '*' in the middle of a string allowed");
                }
                return QUtil.handleRegexIS(this.id, sfield, input, this.data);
            } else {
                if (this.datasetKind === InsightDatasetKind.Courses) {
                    for (let i of this.data) {
                        if (sfield === "dept" && input === Object.values(i)[0]) {
                            data.push(i);
                        } else if (sfield === "id" && input === Object.values(i)[1]) {
                            data.push(i);
                        } else if (sfield === "instructor" && input === Object.values(i)[3]) {
                            data.push(i);
                        } else if (sfield === "title" && input === Object.values(i)[4]) {
                            data.push(i);
                        } else if (sfield === "uuid" && input === Object.values(i)[8]) {
                            data.push(i);
                        }
                    }
                } else if (this.datasetKind === InsightDatasetKind.Rooms) {
                    data = handleRoomsIS(sfield, input, this.data);
                }
            }
            return data;
        } catch (error) {
            throw new InsightError(error.message);
        }
    }

    public handleLT (q: any): any[] {
        try {
            let data: any[] = [];
            if (Object.keys(q).length > 1) {
                throw new InsightError("too many keys");
            }
            let mkey: string = Object.keys(q)[0];
            if (typeof q[mkey] !== "number") { throw new InsightError("invalid input"); }
            let num: number = q[mkey];
            let str = mkey.split("_");
            if (str[0] !== this.id) { throw new InsightError("referencing multiple datasets"); }
            let mfield = str[1];
            if (!QUtil.isValidMathField(this.datasetKind, mfield)) { throw new InsightError("invalid mfield"); }

            if (this.datasetKind === InsightDatasetKind.Courses) {
                for (let i of this.data) {
                    if (mfield === "avg" && num > Object.values(i)[2]) {
                        data.push(i);
                    } else if (mfield === "pass" && num > Object.values(i)[5]) {
                        data.push(i);
                    } else if (mfield === "fail" && num > Object.values(i)[6]) {
                        data.push(i);
                    } else if (mfield === "audit" && num > Object.values(i)[7]) {
                        data.push(i);
                    } else if (mfield === "year" && num > Object.values(i)[9]) {
                        data.push(i);
                    }
                }
            } else if (this.datasetKind === InsightDatasetKind.Rooms) {
                data = QUtil.handleRoomsMATH("LT", mfield, num, this.data); // STUB
            }
            return data;
        } catch (error) {
            throw new InsightError("handleLT" + error.message);
        }
    }

    public handleGT (q: any): any {
        let self: QueryController = this;
        try {
            let data: any[] = [];
            if (Object.keys(q).length > 1) {
                throw new InsightError("too many keys");
            }
            let mkey: string = Object.keys(q)[0];
            if (typeof q[mkey] !== "number") { throw new InsightError("invalid input"); }
            let num: number = q[mkey];
            let str = mkey.split("_");
            if (str[0] !== this.id) { throw new InsightError("referencing multiple datasets"); }
            let mfield = str[1];
            if (!QUtil.isValidMathField(this.datasetKind, mfield)) { throw new InsightError("invalid mfield"); }

            if (this.datasetKind === InsightDatasetKind.Courses) {
                for (let i of self.data) {
                    if (mfield === "avg" && num < Object.values(i)[2]) {
                        data.push(i);
                    } else if (mfield === "pass" && num < Object.values(i)[5]) {
                        data.push(i);
                    } else if (mfield === "fail" && num < Object.values(i)[6]) {
                        data.push(i);
                    } else if (mfield === "audit" && num < Object.values(i)[7]) {
                        data.push(i);
                    } else if (mfield === "year" && num < Object.values(i)[9]) {
                        data.push(i);
                    }
                }
            } else if (this.datasetKind === InsightDatasetKind.Rooms) {
                data = QUtil.handleRoomsMATH("GT", mfield, num, -1); // STUB}
            }
            return data;
        } catch (error) {
            throw new InsightError("handle GT" + error.message);
        }
    }

    public handleEQ (q: any): any {
        try {
            let data: any[] = [];
            if (Object.keys(q).length > 1) {
                throw new InsightError("too many keys");
            }
            let mkey: string = Object.keys(q)[0];
            if (typeof q[mkey] !== "number") { throw new InsightError("invalid input"); }
            let num: number = q[mkey];
            let str = mkey.split("_");
            if (str[0] !== this.id) { throw new InsightError("referencing multiple datasets"); }
            let mfield = str[1];
            if (!QUtil.isValidMathField(this.datasetKind, mfield)) { throw new InsightError("invalid mfield"); }

            if (this.datasetKind === InsightDatasetKind.Courses) {
                for (let i of this.data) {
                    if (mfield === "avg" && num === Object.values(i)[2]) {
                        data.push(i);
                    } else if (mfield === "pass" && num === Object.values(i)[5]) {
                        data.push(i);
                    } else if (mfield === "fail" && num === Object.values(i)[6]) {
                        data.push(i);
                    } else if (mfield === "audit" && num === Object.values(i)[7]) {
                        data.push(i);
                    } else if (mfield === "year" && num === Object.values(i)[9]) {
                        data.push(i);
                    }
                }
            } else if (this.datasetKind === InsightDatasetKind.Rooms) {
                data = QUtil.handleRoomsMATH("EQ", mfield, num, -1); // STUB
            }
            return data;
        } catch (error) {
            throw new InsightError("handleEQ" + error.message);
        }
    }

    public getQueryID(): string {
        return this.id;
    }
    public getData(): any {
        return this.data;
    }
}
