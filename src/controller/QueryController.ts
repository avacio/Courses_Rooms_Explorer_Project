import {InsightDataset, InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController, {organizeResults, sortResults} from "./DatasetController";
import Query, {handleRegexIS, intersect, isValidMathField, isValidStringField, union} from "./Query";
import Log from "../Util";

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
                if (!isValidStringField(fields[1]) && !isValidMathField(fields[1])) {
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
        Log.trace("ID TO PARSE: " + this.id);
        return true;
    }

    // assume query is valid
    public parseQuery(obj: any): any[] {
        try {
            this.data = this.datasetController.getDataset(this.id); // all data entries for id
            let filtered = this.handleWHERE(obj.WHERE); // filter data
            if (filtered.length > 5000) { throw new ResultTooLargeError("RTL"); }

            // let query = new Query(obj.WHERE, obj.OPTIONS); // original query // do we need this?
            if (obj.OPTIONS.ORDER) {
                let sorted = sortResults(filtered, obj.OPTIONS.ORDER);
                return organizeResults(sorted, obj.OPTIONS.COLUMNS);
            }
            return organizeResults(filtered, obj.OPTIONS.COLUMNS); // the sorted, rendered array!
        } catch (error) {
            if (error.message === "RTL") { throw new ResultTooLargeError("RTL");
            } else { throw new InsightError(error.message); }
        }
    }

    public handleWHERE (q: any): any {
        try {
            let wEntryNum: number = Object.keys(q).length;
            if (wEntryNum === 0) { // maybe move this if to parseQuery
                Log.trace("empty where");
                if (this.data.length > 5000) {
                    throw new ResultTooLargeError("RTL");
                }
            }
            let data: any[] = [];
            let filter = Object.keys(q)[0];
            Log.trace("filter: " + filter);
            if (filter === "IS") {
                data = this.handleIS(q["IS"]);
            } else if (filter === "NOT") {
                data = this.handleNOT(q["NOT"]);
            } else if (filter === "AND") {
                data = this.handleAND(q["AND"]);
            } else if (filter === "OR") {
                data = this.handleOR(q["OR"]);
            } else if (filter === "LT") {
                // Log.trace(JSON.stringify(q["LT"]));
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
            let input: any = q[skey];
            if (typeof q[skey] !== "string") { throw new InsightError("invalid input"); }
            let str = skey.split("_");
            let sfield = str[1];
            if (!isValidStringField(sfield)) { throw new InsightError("invalid sfield"); }
            // let regex: RegExp = new RegExp(input);
            // let regex: RegExp;
            if (input.indexOf("*") !== -1 ) {
                return handleRegexIS(sfield, input, this.data);
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
                    }
                }
            }
            return data;
        } catch (error) {
            throw new InsightError(error.message);
        }
}

    public handleNOT (filters: any): any {
        try {
            let data: any[] = [];
            let nextFilter = Object.keys(filters)[0];
            // Log.trace("next filter: " + nextFilter);
            // let nextFilterData: any[] = this.getNextFilterData(filters[nextFilter]);
            let nextFilterData = this.handleWHERE(filters[nextFilter]);
            for (let i of filters) {
                if (!nextFilterData.includes(i, 0)) {
                    data.push(i);
                }
            }
            return data;
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
            return intersect(data);
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
            return union(data);
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
            let mfield = str[1];
            if (!isValidMathField(mfield)) { throw new InsightError("invalid mfield"); }

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
                }
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
            let mfield = str[1];
            if (!isValidMathField(mfield)) { throw new InsightError("invalid mfield"); }

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
            let mfield = str[1];
            if (!isValidMathField(mfield)) { throw new InsightError("invalid mfield"); }

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
            return data;
        } catch (error) {
            throw new InsightError("handleEQ" + error.message);
        }
    }

    public getQueryID(): string {
        return this.id;
    }
}
