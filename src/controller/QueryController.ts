import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import * as QUtil from "./QueryUtil";
import Log from "../Util";
import {handleRoomsIS, handleRoomsMATH} from "./QueryUtil";

export default class QueryController {
    private id: string;
    private data: any;
    private datasetController: DatasetController;

    constructor(datasetController: DatasetController) {
        this.id = "";
        this.datasetController = datasetController;
        this.data = null;
    }

    public isValidQuery(q: any): boolean {
        if (q == null) { return false; }
        let keys = Object.keys(q);
        if (keys.length !== 2) { return false; }

        // OPTIONS FORMAT
        const opts = q.OPTIONS;
        if (opts === null || !Array.isArray(opts.COLUMNS)
            || opts.COLUMNS.length < 1 || opts.length > 2
            || opts.COLUMNS.some((e: any) => typeof e !== "string")) {
            return false;
        }
        if (opts.ORDER && (typeof opts.ORDER !== "string" ||
            opts.COLUMNS.indexOf(opts.ORDER) === -1)) {
            Log.trace("invalid order");
            return false; }
        Log.trace("COLUMNS LENGTH " + opts.COLUMNS.length.toString());
        let idKey: string = "";
        for (let col of opts.COLUMNS) {
            if (col.indexOf("_") !== -1) {
                let fields = col.split("_");
                let k: string = fields[0];
                if (!QUtil.isValidStringField(fields[1]) && !QUtil.isValidMathField(fields[1])) {
                    return false;
                }
                if (idKey === "") {
                    idKey = k;
                } else if (idKey !== k) { // checks if multiple datasets
                    return false;
                }
            }
        }
        this.id = idKey;
        // Log.trace("ID TO PARSE: " + this.id);
        return true;
    }

    public parseQuery(obj: any): any[] {
        try {
            this.data = this.datasetController.getDataset(this.id); // all data entries for id
            let filtered = this.handleWHERE(obj.WHERE); // filter data
            if (filtered.length > 5000) { throw new ResultTooLargeError("RTL"); }

            if (obj.OPTIONS.ORDER) {
                let sorted = QUtil.sortResults(filtered, obj.OPTIONS.ORDER);
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
                data = this.handleNOT(q["NOT"]);
            } else if (filter === "AND") {
                data = this.handleAND(q["AND"]);
            } else if (filter === "OR") {
                data = this.handleOR(q["OR"]);
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
            if (!QUtil.isValidStringField(sfield)) { throw new InsightError("invalid sfield"); }
            let asteriskCount = input.split("*").length - 1;
            if (asteriskCount > 0) {
                if (asteriskCount > 2 || (asteriskCount === 2 && input.lastIndexOf("*") !== input.length - 1) ||
                    (asteriskCount === 2 && input.indexOf("*") !== 0) ||
                    (input.indexOf("*") !== 0 && input.indexOf("*") !== input.length - 1)) {
                    throw new InsightError("no '*' in the middle of a string allowed");
                }
                return QUtil.handleRegexIS(this.id, sfield, input, this.data);
            } else {
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
                    } else if (sfield === "fullname" || sfield === "shortname" || sfield === "number"
                    || sfield === "name" || sfield === "address" || sfield === "type" || sfield === "furniture"
                        || sfield === "href") {
                        data.push(handleRoomsIS(sfield, input, i)); }
                }
            }
            return data;
        } catch (error) {
            throw new InsightError(error.message);
        }
}

    public handleNOT (filters: any): any {
        try {
            let data = this.data;
            let nextFilter = Object.keys(filters)[0];
            // Log.trace("next filter: " + nextFilter);
            if (nextFilter !== "NOT") {
                let nextFilterData = this.handleWHERE(filters);
                return data.filter((i: any) => !nextFilterData.includes(i));
            } else { // double-negative case
                Log.trace("double not");
                return this.handleWHERE(filters[nextFilter]);
            }
        } catch (error) {
            throw new InsightError("handle not");
        }
    }

    public handleAND (filters: any): any {
        try {
            let data: any[] = [];
            for (let filter of filters) {
                data.push(this.handleWHERE(filter));
            }
            return QUtil.intersect(data);
        } catch (error) {
            throw new InsightError("AND");
        }
    }
    public handleOR (filters: any): any {
        try {
            let data: any[] = [];
            for (let filter of filters) {
                data.push(this.handleWHERE(filter));
            }
            return QUtil.union(data);
        } catch (error) {
            throw new InsightError("OR");
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
            if (!QUtil.isValidMathField(mfield)) { throw new InsightError("invalid mfield"); }

            for (let i of this.data) { // WAS PREVIOUSLY JUST ITERATING OVER EMPTY [] INITIALIZED LOCALLY
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
                } else if (mfield === "lat" || mfield === "lon" || mfield === "seats") {
                    data.push(handleRoomsMATH("LT", mfield, num, i)); }
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
            if (!QUtil.isValidMathField(mfield)) { throw new InsightError("invalid mfield"); }

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
                } else if (mfield === "lat" || mfield === "lon" || mfield === "seats") {
                    (data.push(handleRoomsMATH("GT", mfield, num, i))); }
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
            if (!QUtil.isValidMathField(mfield)) { throw new InsightError("invalid mfield"); }

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
                } else if (mfield === "lat" || mfield === "lon" || mfield === "seats") {
                    data.push(handleRoomsMATH("EQ", mfield, num, i)); }
            }
            return data;
        } catch (error) {
            throw new InsightError("handleEQ" + error.message);
        }
    }

    public getQueryID(): string {
        return this.id;
    }
}
