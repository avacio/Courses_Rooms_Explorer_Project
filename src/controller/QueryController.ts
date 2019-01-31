import Query, {Filter} from "./Query";
import {InsightDataset, InsightError} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import InsightFacade from "./InsightFacade";
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
    // constructor() {
        this.id = "";
        this.datasetController = datasetController;
        // this.datasetController = new DatasetController(); // shouldn't create new
    }

    public isValidQuery(q: any): boolean {
        Log.trace(q.toString());
        if (q == null) {
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

        Log.trace("COLUMNS LENGTH " + opts.COLUMNS.length.toString());
        let idKey: string = "";
        for (let col of opts.COLUMNS) {
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

    public isValidField(key: string): boolean {
        let str = key.split("_");
        let field = str[1];
        if (field === "avg" || field === "pass" || field === "fail"
            || field === "audit" || field === "year" || field === "dept"
            || field === "id" || field === "instructor"
            || field === "title" || field === "uuid" ) {
            return true;
        } else {
            return false;
        }
    }

    // public getDataset(id: string): any[] {
    //     return this.datasetController.getDataset(id);
    // }

    // public getField(field: string): string {
    //     if (field === )
    // }

    // assume query is valid
    // public parseQuery(obj: any): QueryResult {
    public parseQuery(obj: any): QueryResult {
        // let self: QueryController = this;
        // const query = new Query(q.WHERE, q.OPTIONS);
        // TODO
        try {
            // if (typeof q !== "string") { q = JSON.stringify((q)); }
            // let obj = JSON.parse(q); // create JSON objects
            // already in JSON form!
            // Log.trace(JSON.stringify(obj.WHERE));
            // this.id = this.getID(obj); // set id (not checking for multiple id's yet which would be error)
            // added to checkValid! checks for multiple
            // this.data = this.datasetController.getDataset(this.id); // all data entries for id
            let filteredWHERE = this.handleWHERE(obj.WHERE); // filter data
            let processedData = this.handleOPTIONS(filteredWHERE); // process Options
            let query = new Query(obj.WHERE, obj.OPTIONS); // original query
            return new QueryResult(query, processedData); // return
            // return new QueryResult(null, ""); // STUB
        } catch (error) {
            throw new InsightError("parse query problem");
        }
    }

    public handleWHERE (q: any): any {
        // Log.trace(q.WHERE.toString());
        if (q.WHERE === {}) { // maybe move this if to parseQuery
            // if WHERE is empty return all entries in dataset
            // return this.datasetController.getDataset(this.id);
            return; // stub: need to filter and sort by columns
            // maybe do this in another function called from InsightFacade?
            //      or else will throw InsightError instead of ResultTooLargeError
        }
        // map((val: any) => InsightFacade.makeEntry(val, id))

        // get first filter
        // let filter = Object.keys(q)[0];
        // Log.trace(filter.toString());
        //
        // if (filter === "IS") {
        //     // is comp w skey and input
        //     return this.handleIS(Object.keys(filter)[0], Object.values(filter)[0]);
        // } else if (filter === "NOT") {
        //     return this.handleNOT(Object.values(filter)[0]);
        // } else if (filter === "AND") {
        //     return this.handleAND();
        // } else if (filter === "OR") {
        //     return this.handleOR();
        // } else if (filter === "LT") {
        //     return this.handleLT();
        // } else if (filter === "GT") {
        //     return this.handleGT();
        // } else if (filter === "EQ") {
        //     return this.handleEQ();
        // }
        // Log.trace(q[1]);
        // let filter = Object.keys(q)[0];
        // Log.trace(Object.values(filter)[0]);
        // Log.trace(q);
        let filter = Object.keys(q)[0];

        // for (let filter in q)
        if (filter === "IS") {
            // is comp w skey and input
            return this.handleIS(Object.keys(filter)[0], Object.values(filter)[0]);
        } else if (filter === "NOT") {
            return this.handleNOT(Object.values(filter)[0]);
        } else if (filter === "AND") {
            return this.handleAND();
        } else if (filter === "OR") {
            return this.handleOR();
        } else if (filter === "LT") {
            return this.handleLT();
        } else if (filter === "GT") {
            return this.handleGT();
        } else if (filter === "EQ") {
            return this.handleEQ();
        }
    }

    public handleOPTIONS (q: any): any {
        return this.data; // stub

    }

    public handleIS(skey: string, input: string ): any[] {
        let str = skey.split("_");
        // let id = str[0];
        let sfield = str[1];
        // let data = this.datasetController.getDataset(this.id);
        if (this.isValidField(sfield)) {
            if (sfield === "dept") {
                // search data for sfield matching dept
                // return array of json's that match
                // data.forEach(function (item)){}
                for (let item in this.data) {
                    // if (item.contains())
                    let obj = JSON.parse(item);
                    // Object.values(obj)
                    if (obj.Subject !== input) {
                        this.data.pull(item);
                        // return this.data; // stub
                    }
                    return this.data;
                }
            }
        }
    }

    public handleNOT (filter: any): any {
        return this.data;
    }

    public handleAND (): any {
        return this.data;
    }

    public handleOR (): any {
        return this.data;
    }

    public handleLT (): any {
        return this.data;
    }

    public handleGT (): any {
        return this.data;
    }

    public handleEQ (): any {
        return this.data;
    }

    public getID (query: any): any {
        let val: string;
        for (val in Object.values(query)) {
            if (typeof val === "string") {
                let field: string[] = val.split("_");
                let id: string = field[0];
            }
        }
    }

    public getQueryID(): string {
        return this.id;
    }
}
