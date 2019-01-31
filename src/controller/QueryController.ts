// import Query, {Filter} from "./Query";
import {InsightDataset, InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetController, {organizeResults, sortResults} from "./DatasetController";
import InsightFacade from "./InsightFacade";
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
    // private columns: string[]; // necessary?
    // private order: string;

    constructor(datasetController: DatasetController) {
    // constructor() {
        this.id = "";
        this.datasetController = datasetController;
        this.data = null;
        // this.columns = [];
        // this.order = "";
        // this.datasetController = new DatasetController(); // shouldn't create new
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

        // this.columns = []; // clears from past queries
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
    // public parseQuery(obj: any): QueryResult {
    public parseQuery(obj: any): QueryResult | any {
        // let self: QueryController = this;
        // const query = new Query(q.WHERE, q.OPTIONS);
        // TODO
        // return new Promise(function (reso))
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
        // Log.trace(JSON.stringify(q.WHERE));
        // Log.trace(q.keys().length.toString());
        // Log.trace(Object.keys(q).length.toString());
        let wEntryNum: number = Object.keys(q).length;
        // if (q.WHERE === {}) { // maybe move this if to parseQuery
        if (wEntryNum === 0) { // maybe move this if to parseQuery
            Log.trace("empty where");
            if (this.data.length > 5000) { throw new ResultTooLargeError("RTL"); }
        }
        let data: any[] = [];
        let filter = Object.keys(q)[0];
        Log.trace("filter: " + filter);

        if (filter === "IS") {
            // is comp w skey and input
            data.push(this.handleIS(Object.keys(filter)[0], Object.values(filter)[0]));
            // Log.trace("skey:" + Object.keys(filter)[0]);
            // Log.trace("input:" + Object.values(filter)[0]);
        } else if (filter === "NOT") {
            data.push(this.handleNOT(Object.values(filter)));
        } else if (filter === "AND") {
            data.push(this.handleAND(Object.values(filter)));
        } else if (filter === "OR") {
            data.push(this.handleOR(Object.values(filter)));
        } else if (filter === "LT") {
            data.push(this.handleLT(Object.keys(filter)[0], +Object.values(filter)[0]));
        } else if (filter === "GT") {
            data.push(this.handleGT(Object.keys(filter)[0], +Object.values(filter)[0]));
        } else if (filter === "EQ") {
            data.push(this.handleEQ(Object.keys(filter)[0], +Object.values(filter)[0]));
        }
        return data;
    }

    public handleOPTIONS (q: any): any {
        return this.data; // stub

    }

    public handleIS(skey: string, input: string ): any[] {
        let str = skey.split("_");
        let sfield = str[1];

        let data: any[] = [];
        if (QueryController.isValidStringField(sfield)) {
// =======
//         // let data = this.datasetController.getDataset(this.id);
//         if (this.isValidField(sfield)) {
//             if (sfield === "dept") {
// >>>>>>> alexis
                // search data for sfield matching dept
                // return array of json's that match
            for (let item in this.data) {
                let obj = JSON.parse(item);
                if (sfield === "dept") {
                    if (obj.Subject === input) {
                        Log.trace("Subject:" + obj);
                        data.push(item);
                    }
                    return data;
                }
                if (sfield === "id") {
                    return data; // stub
                }
            }
        }
    }

    public handleNOT (filters: any): any {
        // return this.data;
        let data: any[] = [];
        let alldata = this.datasetController.getDataset(this.id); // make copy of all data entries
        let nextFilterData: any[] = [];
        // does this handle double not idkk???
        for (let filter of filters) {
            // recursively go into query adding to next filter data
            nextFilterData.push(this.handleWHERE(filter));
        }
        for (let i of alldata) {
            if (!nextFilterData.includes(i, 0)) {
                data.push(i); // if the filtered data is not in the array containing all data add it to new array
            }
        }
        return data;
    }

    public handleAND (filters: any): any {
        // return this.data;
        let data: any[] = [];
        for (let filter of filters) {
            // recursively go into query adding all filtered results to this array
            // data is an array of arrays to intersect
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

    public handleLT (mkey: string, num: number): any {
        return this.data;
    }

    public handleGT (mkey: string, num: number): any {
        // return this.data;
        let self: QueryController = this;
        return new Promise(function (resolve, reject) {
            try {
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    public handleEQ (mkey: string, num: number): any {
        return this.data;
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
