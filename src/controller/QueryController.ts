import Query from "./Query";
import {InsightDataset} from "./IInsightFacade";
import DatasetController from "./DatasetController";

export class QueryResult {
    constructor(query: Query, dataset: string) {
        //
        dataset = "";
    }
}

export default class QueryController {
    // constructor() {}

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

    // public isComp(skey: string, input: string, data: any[]): any[] {
    //     let str = skey.split("_");
    //     let ds = str[0];
    //     let sfield = str[1];
    //     if (this.isValidfield(sfield)) {
    //         if (sfield === "dept") {
    //
    //         }
    //     }
    // }

    // public getField(field: string): string {
    //     if (field === )
    // }

    // assume query is valid
    public parseQuery(q: any): QueryResult {
        const query = new Query(q.WHERE, q.OPTIONS);
        // TODO
        // let Object = JSON.parse(q);
        // Log.trace()
        return new QueryResult(null, ""); // STUB
    }
}
