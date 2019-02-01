import {InsightDataset, InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController, {organizeResults, sortResults} from "./DatasetController";
import Query from "./Query";
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
        let wEntryNum: number = Object.keys(q).length;
        if (wEntryNum === 0) { // maybe move this if to parseQuery
            Log.trace("empty where");
            if (this.data.length > 5000) { throw new ResultTooLargeError("RTL"); }
        }
        let data: any[] = [];
        // first (outer) filter
        let filter = Object.keys(q)[0];
        Log.trace("filter: " + filter);
        if (filter === "IS") {
            data.push(this.handleIS(q["IS"]));
        } else if (filter === "NOT") {
            data.push(this.handleNOT(q["NOT"]));
        } else if (filter === "AND") {
            data.push(this.handleAND(q["AND"]));
        } else if (filter === "OR") {
            data.push(this.handleOR(q["OR"]));
        } else if (filter === "LT") {
            data.push(this.handleLT(q["LT"]));
        } else if (filter === "GT") {
            data.push(this.handleGT(q["GT"]));
        } else if (filter === "EQ") {
            data.push(this.handleEQ(q["EQ"]));
        }
        return data;
    }

    public handleIS (q: any): any {
        let data: any[] = [];
        let skey: string = Object.keys(q)[0];
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
}

    public handleNOT (filters: any): any {
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
    }

    public handleAND (filters: any): any {
        let data: any[] = [];
        for (let filter of filters) {
            data.push(this.handleWHERE(filter));
        }
        return QueryController.intersect(data);
    }

    private static intersect (data: any[]): any[] {
        let x: any[] = data[0];
        let rsf: any[] = [];
        for (let i = 1; i < data.length; i++) {
            rsf = QueryController.handleIntersect(x, data[i]);
            x = rsf;
        }
        return x;
    }

    private static handleIntersect(x: any[], rsf: any[]): any[] {
        let z: any[] = [];
        for (let i of x) {
            if (rsf.includes(i, 0)) {
                z.push(i);
            }
        }
        return z;
    }

    public handleOR (filters: any): any {
        // return this.data;
        let data: any[] = [];
        for (let filter of filters) {
            data.push(this.handleWHERE(filter));
        }
        return QueryController.union(data);
    }

    private static union(data: any[]): any[] {
        let x: any[] = data[0];
        let rsf: any[] = [];
        for (let i = 1; i < data.length; i++) {
            rsf = QueryController.handleUnion(x, data[i]);
            x = rsf;
        }
        return x;
    }

    private static handleUnion (x: any[], rsf: any[]): any[] {
        for (let i of x ) {
            if (!rsf.includes(i, 0)) {
                rsf.push(i);
            }
        }
        return rsf;
    }

    public handleLT (q: any): any[] {
        let data: any[] = [];
        let mkey: string = Object.keys(q)[0];
        let num: number = q[mkey];
        let str = mkey.split("_");
        let mfield = str[1];
        for (let i of data) {
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
    }

    public handleGT (q: any): any {
        return new Promise(function (resolve, reject) {
            try {
                let data: any[] = [];
                let mkey: string = Object.keys(q)[0];
                let num: number = q[mkey];
                let str = mkey.split("_");
                let mfield = str[1];
                for (let i of data) {
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
                reject(error);
            }
        });
    }

    public handleEQ (q: any): any {
        let data: any[] = [];
        let mkey: string = Object.keys(q)[0];
        let num: number = q[mkey];
        let str = mkey.split("_");
        let mfield = str[1];
        for (let i of data) {
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
    }

    public static getID (query: any): any {
        let val: string;
        for (val in Object.values(query)) {
            if (typeof val === "string") {
                let field: string[] = val.split("_");
                let id: string = field[0];
                return id;
            }
        }
    }

    public getQueryID(): string {
        return this.id;
    }
}
