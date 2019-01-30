import Query, {Filter} from "./Query";
import {InsightDataset} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import InsightFacade from "./InsightFacade";

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

    public isValidfield(key: string): boolean {
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
    public parseQuery(q: any): QueryResult {
        // let self: QueryController = this;
        // const query = new Query(q.WHERE, q.OPTIONS);
        // TODO
        let obj = JSON.parse(q); // create JSON objects
        this.id = this.getID(obj); // set id (not checking for multiple id's yet which would be error)
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
        // get first filter
        let filter = Object.keys(q)[0];
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
        if (this.isValidfield(sfield)) {
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
}
