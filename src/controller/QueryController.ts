import {InsightDataset, InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController, {organizeResults, sortResults} from "./DatasetController";
import Query, {intersect, union} from "./Query";
import Log from "../Util";

// do we need this? not sure
export class QueryResult {
    constructor(query: Query, dataset: string) {
        //
        dataset = "";
    }
}

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
        Log.trace(q.toString());
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
        Log.trace("COLUMNS LENGTH " + opts.COLUMNS.length.toString());
        let idKey: string = "";
        for (let col of opts.COLUMNS) {
            // this.columns.push(col);
            if (col.indexOf("_") !== -1) {
                let k: string = col.split("_")[0];
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

    private static isValidStringField(key: string): boolean {
        let str = key.split("_");
        let field = str[1];
        return field === "dept" || field === "id" || field === "instructor"
            || field === "title" || field === "uuid";
    }

    private static isValidMathField(key: string): boolean {
        let str = key.split("_");
        let field = str[1];
        return field === "avg" || field === "pass" || field === "fail"
            || field === "audit" || field === "year";
    }

    // assume query is valid
    public parseQuery(obj: any): QueryResult | any {
        try {
            this.data = this.datasetController.getDataset(this.id); // all data entries for id
            let filtered = this.handleWHERE(obj.WHERE); // filter data
            if (filtered.length > 5000) { throw new ResultTooLargeError("RTL"); }

            // let processedData = this.handleOPTIONS(filteredWHERE); // process Options
            let query = new Query(obj.WHERE, obj.OPTIONS); // original query // do we need this?
            if (obj.OPTIONS.ORDER) {
                // filtered formerly this.data
                let sorted = sortResults(filtered, obj.OPTIONS.ORDER);
                return organizeResults(sorted, obj.OPTIONS.COLUMNS);
            }
            return organizeResults(filtered, obj.OPTIONS.COLUMNS); // the sorted, rendered array!
        } catch (error) {
            if (error.message === "RTL") { throw new ResultTooLargeError("RTL");
            } else { throw new InsightError("parse query problem"); }
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
            // first (outer) filter
            let filter = Object.keys(q)[0];
            Log.trace("filter: " + filter);
            if (filter === "IS") {
                // data.push(this.handleIS(q["IS"]));
                data = this.handleIS(q["IS"]);
            } else if (filter === "NOT") {
                // data.push(this.handleNOT(q["NOT"]));
                data = this.handleNOT(q["NOT"]);
            } else if (filter === "AND") {
                // data.push(this.handleAND(q["AND"]));
                data = this.handleAND(q["AND"]);
            } else if (filter === "OR") {
                // data.push(this.handleOR(q["OR"]));
                data = this.handleOR(q["OR"]);
            } else if (filter === "LT") {
                // Log.trace(JSON.stringify(q["LT"]));
                // data.push(this.handleLT(q["LT"]));
                data = this.handleLT(q["LT"]);
            } else if (filter === "GT") {
                // data.push(this.handleGT(q["GT"]));
                data = this.handleGT(q["GT"]);
            } else if (filter === "EQ") {
                // data.push(this.handleEQ(q["EQ"]));
                data = this.handleEQ(q["EQ"]);
            } else {
                throw new InsightError("not valid filter");
            }
            return data;
        } catch (error) {
            throw new InsightError();
        }
    }

    public handleIS (q: any): any {
        try {
            let data: any[] = [];
            let skey: string = Object.keys(q)[0];
            if (typeof q[skey] !== "string") {
                throw new InsightError("invalid input");
            }
            let input: any = q[skey];
            // Log.trace("input: " + input);
            let str = skey.split("_");
            let sfield = str[1];
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
            return data;
        } catch (error) {
            throw new InsightError();
        }
}

    public handleNOT (filters: any): any {
        try {
            let data: any[] = [];
            let nextFilterData: any[] = [];
            for (let filter of filters) { // does this handle double not idkk???
                nextFilterData.push(this.handleWHERE(filter)); // recursively go into query adding to next filter data
            }
            for (let i of filters) {
                if (!nextFilterData.includes(i, 0)) {
                    data.push(i); // if the filtered data is not in the array containing all data add it to new array
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
            // return this.data;
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
            let mkey: string = Object.keys(q)[0];
            if (typeof q[mkey] !== "number") { throw new InsightError("invalid input"); }
            let num: number = q[mkey];
            let str = mkey.split("_");
            let mfield = str[1];
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
            throw new InsightError("handleLT");
        }
    }

    // WHY ONLY THIS IN PROMISE, AND NOT OTHER MAthy
    public handleGT (q: any): any {
        let self: QueryController = this;
        return new Promise(function (resolve, reject) {
            try {
                let data: any[] = [];
                let mkey: string = Object.keys(q)[0];
                if (typeof q[mkey] !== "number") { throw new InsightError("invalid input"); }
                let num: number = q[mkey];
                let str = mkey.split("_");
                let mfield = str[1];
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
                resolve(data);
            } catch (error) {
                reject(new InsightError("handle GT"));
            }
        });
    }

    public handleEQ (q: any): any {
        try {
            let data: any[] = [];
            let mkey: string = Object.keys(q)[0];
            if (typeof q[mkey] !== "number") { throw new InsightError("invalid input"); }
            let num: number = q[mkey];
            let str = mkey.split("_");
            let mfield = str[1];
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
            throw new InsightError("handleEQ");
        }
    }

    public getQueryID(): string {
        return this.id;
    }
}
