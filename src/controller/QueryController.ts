// import Query, {Filter} from "./Query";
import {InsightDataset} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import InsightFacade from "./InsightFacade";
import Query from "./Query";
import Log from "../Util";

export class QueryResult {
    constructor(query: Query, dataset: string) {
        //
        dataset = "";
    }
}

export default class QueryController {
    private datasetController: DatasetController;
    private id: string;
    private data: any;
    // private filteredData: any[] = [];
    constructor() {
        this.datasetController = new DatasetController();
        // this.data = this.datasetController.getDataset(this.id);
    }

    public static isValidQuery(q: any): boolean {
        if (q === null) {
            return false;
        }

        let keys = Object.keys(q);
        if (keys.length !== 2) {
            return false;
        }

        // OPTIONS FORMAT
        const opts = q.OPTIONS;
        if (opts === null || !Array.isArray(opts.COLUMNS)
            || opts.COLUMNS.length < 1 || opts.length > 2
            || opts.COLUMNS.some((e: any) => typeof e !== "string")) {
            return false;
        }

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
    // start with full dataset, and empty filtered dataset, push desired entries from data into filtered data
    public parseQuery(q: any): QueryResult {
        // let self: QueryController = this;
        // const query = new Query(q.WHERE, q.OPTIONS);
        // TODO
        let obj = JSON.parse(q); // create JSON objects
        this.id = QueryController.getID(obj); // set id (not checking for multiple id's yet which would be error)
        this.data = this.datasetController.getDataset(this.id); // all data entries for id
        let filteredWHERE = this.handleWHERE(obj.WHERE); // filter data
        let processedData = this.handleOPTIONS(filteredWHERE); // process Options
        let query = new Query(obj.WHERE, obj.OPTIONS); // original query
        return new QueryResult(query, processedData); // return
        // return new QueryResult(null, ""); // STUB
    }

    public handleWHERE (q: any): any {
        // let obj = JSON.parse(q);
        if (q.WHERE === {}) { // maybe move this if to parseQuery
            // if WHERE is empty return all entries in dataset
            return this.datasetController.getDataset(this.id);
        }
        let data: any[] = [];
        // get first filter
        let filter = Object.keys(q)[0];
        if (filter === "IS") {
            // is comp w skey and input
            data.push(this.handleIS(Object.keys(filter)[0], Object.values(filter)[0]));
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
        let filteredData: any[] = [];
        if (QueryController.isValidStringField(sfield)) {
                // search data for sfield matching dept
                // return array of json's that match
            for (let item in this.data) {
                let obj = JSON.parse(item);
                if (sfield === "dept") {
                    if (obj.Subject === input) {
                        Log.trace("yoyooyoyoyo");
                        filteredData.push(item);
                    }
                    return filteredData;
                }
                if (sfield === "id") {
                    return filteredData; // stub
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
        return this.data;
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
}
